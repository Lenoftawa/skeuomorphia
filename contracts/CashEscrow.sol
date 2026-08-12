// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IFlareContractRegistry {
    function getContractAddress(string calldata name) external view returns (address);
}

interface IVerificationManager {
    function verifyAttestation(bytes32 dataHash) external view returns (bool);
}

contract CashEscrow is ReentrancyGuard, Ownable {
    struct Banknote {
        uint256 denomination;
        bytes32 secretHash;
        address owner;
        bool redeemed;
        uint256 createdAt;
    }

    IERC20 public stableCoin;
    mapping(uint256 => Banknote) public banknotes;
    uint256 public nextNoteId;

    // Commit-reveal for front-running prevention
    mapping(uint256 => bytes32) public redemptionCommits;
    mapping(uint256 => uint256) public commitTimestamps;

    event NoteMinted(uint256 indexed noteId, address indexed owner, uint256 denomination);
    event NoteRedeemed(uint256 indexed noteId, address indexed merchant, address indexed owner, uint256 amount, uint256 change);
    event RedemptionCommitted(uint256 indexed noteId, address indexed merchant, bytes32 commitHash);
    event NoteCancelled(uint256 indexed noteId, address indexed owner);

    // Flare Contract Registry for FDC attestations
    address public flareRegistry;

    constructor(address _stableCoin, address _flareRegistry) Ownable(msg.sender) {
        stableCoin = IERC20(_stableCoin);
        flareRegistry = _flareRegistry;
        nextNoteId = 1;
    }

    function mintNote(uint256 denomination, bytes32 secretHash) external nonReentrant returns (uint256) {
        require(denomination > 0, "Denomination must be positive");
        require(secretHash != bytes32(0), "Invalid secret hash");

        require(stableCoin.transferFrom(msg.sender, address(this), denomination), "Transfer failed");

        uint256 noteId = nextNoteId++;
        banknotes[noteId] = Banknote({
            denomination: denomination,
            secretHash: secretHash,
            owner: msg.sender,
            redeemed: false,
            createdAt: block.timestamp
        });

        emit NoteMinted(noteId, msg.sender, denomination);
        return noteId;
    }

    function commitRedemption(uint256 noteId, bytes32 commitHash) external {
        Banknote storage note = banknotes[noteId];
        require(note.owner != address(0), "Note does not exist");
        require(!note.redeemed, "Note already redeemed");
        require(commitHash != bytes32(0), "Invalid commit hash");
        require(redemptionCommits[noteId] == bytes32(0), "Already committed");

        redemptionCommits[noteId] = commitHash;
        commitTimestamps[noteId] = block.timestamp;

        emit RedemptionCommitted(noteId, msg.sender, commitHash);
    }

    function redeemNote(
        uint256 noteId,
        bytes32 secret,
        uint256 amount
    ) external nonReentrant {
        Banknote storage note = banknotes[noteId];
        require(note.owner != address(0), "Note does not exist");
        require(!note.redeemed, "Note already redeemed");
        require(amount <= note.denomination, "Amount exceeds denomination");
        require(commitTimestamps[noteId] > 0, "No commit found");
        require(block.timestamp > commitTimestamps[noteId], "Commit not matured");

        bytes32 computedHash = keccak256(abi.encodePacked(secret, msg.sender));
        require(computedHash == redemptionCommits[noteId], "Invalid redemption proof");

        require(keccak256(abi.encodePacked(secret)) == note.secretHash, "Invalid secret");

        note.redeemed = true;

        uint256 change = note.denomination - amount;
        if (amount > 0) {
            require(stableCoin.transfer(msg.sender, amount), "Merchant transfer failed");
        }
        if (change > 0) {
            require(stableCoin.transfer(note.owner, change), "Change transfer failed");
        }

        emit NoteRedeemed(noteId, msg.sender, note.owner, amount, change);
    }

    function cancelNote(uint256 noteId, bytes32 secret) external {
        Banknote storage note = banknotes[noteId];
        require(note.owner == msg.sender, "Not the owner");
        require(!note.redeemed, "Note already redeemed");
        require(keccak256(abi.encodePacked(secret)) == note.secretHash, "Invalid secret");

        note.redeemed = true;
        require(stableCoin.transfer(note.owner, note.denomination), "Refund failed");

        emit NoteCancelled(noteId, note.owner);
    }

    function getNote(uint256 noteId) external view returns (Banknote memory) {
        return banknotes[noteId];
    }
}
