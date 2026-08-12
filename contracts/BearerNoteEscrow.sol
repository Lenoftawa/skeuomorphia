// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AssetRegistry.sol";

contract BearerNoteEscrow is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct BearerNote {
        address asset;
        uint256 faceValue;
        bytes32 secretHash;
        address issuer;
        uint64 createdAt;
        uint64 expiresAt;
        bool redeemed;
    }

    struct RedemptionCommit {
        bytes32 commitment;
        uint64 blockNumber;
    }

    AssetRegistry public immutable assetRegistry;
    uint256 public nextNoteId = 1;
    mapping(uint256 => BearerNote) public notes;
    mapping(uint256 => mapping(address => RedemptionCommit)) public redemptionCommits;

    error InvalidAddress();
    error InvalidSecretHash();
    error InvalidExpiry();
    error NoteNotFound();
    error NoteAlreadyRedeemed();
    error NoteExpired();
    error InvalidAmount();
    error InvalidCommitment();
    error CommitNotMatured();
    error InvalidSecret();
    error UnauthorizedIssuer();
    error UnsupportedTransferFee();

    event NoteMinted(uint256 indexed noteId, address indexed asset, address indexed issuer, uint256 faceValue, uint64 expiresAt);
    event RedemptionCommitted(uint256 indexed noteId, address indexed merchant, bytes32 commitment);
    event NoteRedeemed(uint256 indexed noteId, address indexed asset, address indexed merchant, address issuer, uint256 amount, uint256 issuerChange);
    event NoteCancelled(uint256 indexed noteId, address indexed asset, address indexed issuer, uint256 refund);

    constructor(address registry, address initialOwner) Ownable(initialOwner) {
        if (registry == address(0) || initialOwner == address(0)) revert InvalidAddress();
        assetRegistry = AssetRegistry(registry);
    }

    function mintNote(address asset, uint256 faceValue, bytes32 secretHash, uint64 expiresAt)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 noteId)
    {
        if (secretHash == bytes32(0)) revert InvalidSecretHash();
        if (expiresAt != 0 && expiresAt <= block.timestamp) revert InvalidExpiry();
        assetRegistry.validate(asset, faceValue);

        IERC20 token = IERC20(asset);
        uint256 balanceBefore = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), faceValue);
        if (token.balanceOf(address(this)) - balanceBefore != faceValue) revert UnsupportedTransferFee();

        noteId = nextNoteId++;
        notes[noteId] = BearerNote(asset, faceValue, secretHash, msg.sender, uint64(block.timestamp), expiresAt, false);
        emit NoteMinted(noteId, asset, msg.sender, faceValue, expiresAt);
    }

    function commitRedemption(uint256 noteId, bytes32 commitment) external whenNotPaused {
        BearerNote storage note = notes[noteId];
        _validateActiveNote(note);
        if (commitment == bytes32(0)) revert InvalidCommitment();

        redemptionCommits[noteId][msg.sender] = RedemptionCommit(commitment, uint64(block.number));
        emit RedemptionCommitted(noteId, msg.sender, commitment);
    }

    function redeemNote(uint256 noteId, bytes32 secret, uint256 amount) external nonReentrant whenNotPaused {
        BearerNote storage note = notes[noteId];
        _validateActiveNote(note);
        if (amount == 0 || amount > note.faceValue) revert InvalidAmount();

        RedemptionCommit memory pending = redemptionCommits[noteId][msg.sender];
        bytes32 expected = keccak256(abi.encode(secret, msg.sender, noteId, amount));
        if (pending.commitment == bytes32(0) || pending.commitment != expected) revert InvalidCommitment();
        if (block.number <= pending.blockNumber) revert CommitNotMatured();
        if (keccak256(abi.encode(secret)) != note.secretHash) revert InvalidSecret();

        note.redeemed = true;
        delete redemptionCommits[noteId][msg.sender];

        uint256 issuerChange = note.faceValue - amount;
        IERC20 token = IERC20(note.asset);
        token.safeTransfer(msg.sender, amount);
        if (issuerChange != 0) token.safeTransfer(note.issuer, issuerChange);
        emit NoteRedeemed(noteId, note.asset, msg.sender, note.issuer, amount, issuerChange);
    }

    function cancelNote(uint256 noteId, bytes32 secret) external nonReentrant {
        BearerNote storage note = notes[noteId];
        if (note.issuer == address(0)) revert NoteNotFound();
        if (note.redeemed) revert NoteAlreadyRedeemed();
        if (note.issuer != msg.sender) revert UnauthorizedIssuer();
        if (keccak256(abi.encode(secret)) != note.secretHash) revert InvalidSecret();

        note.redeemed = true;
        IERC20(note.asset).safeTransfer(note.issuer, note.faceValue);
        emit NoteCancelled(noteId, note.asset, note.issuer, note.faceValue);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _validateActiveNote(BearerNote storage note) private view {
        if (note.issuer == address(0)) revert NoteNotFound();
        if (note.redeemed) revert NoteAlreadyRedeemed();
        if (note.expiresAt != 0 && block.timestamp >= note.expiresAt) revert NoteExpired();
    }
}
