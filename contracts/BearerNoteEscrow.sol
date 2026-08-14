// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AssetRegistry.sol";

/// @notice Minimal Flare Data Connector Web2Json proof structures.
///         Mirrors the flare-periphery-contracts IWeb2Json so the
///         proof returned by the DA layer decodes correctly, without pulling
///         in the full periphery package (keeps solc 0.8.20 + no extra deps).
interface IWeb2Json {
    struct RequestBody {
        string url;
        string httpMethod;
        string headers;
        string queryParams;
        string body;
        string postProcessJq;
        string abiSignature;
    }

    struct ResponseBody {
        bytes abiEncodedData;
    }

    /// @dev Matches the official Flare periphery IWeb2Json.Response struct.
    ///      The FDC flattens attestationType/sourceId/votingRound/lowestUsedTimestamp
    ///      directly into Response (no nested Request wrapper).
    struct Response {
        bytes32 attestationType;
        bytes32 sourceId;
        uint64 votingRound;
        uint64 lowestUsedTimestamp;
        RequestBody requestBody;
        ResponseBody responseBody;
    }

    struct Proof {
        bytes32[] merkleProof;
        Response data;
    }
}

/// @notice Minimal FdcVerification surface — resolved at runtime via the
///         FlareContractRegistry so we never hardcode the verifier address.
interface IFdcVerification {
    function verifyWeb2Json(IWeb2Json.Proof calldata _proof) external view returns (bool _proved);
}

/// @notice Decoded compliance verdict attested by the FDC from the Web2
///         source-of-record endpoint (`complianceUrlPrefix`).
///         verdict: 1 = CLEAR, 2 = REVIEW, 3 = BLOCKED.
struct ComplianceVerdict {
    address subject;
    uint8 verdict;
    uint256 timestamp;
}

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
        bool fdcAttested;
    }

    struct RedemptionCommit {
        bytes32 commitment;
        uint64 blockNumber;
    }

    AssetRegistry public immutable assetRegistry;

    /// @dev FlareContractRegistry on Coston2 (constant across Flare-family nets).
    address public constant FLARE_CONTRACT_REGISTRY = 0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019;
    bytes32 private constant FDC_VERIFICATION_NAME = keccak256(bytes("FdcVerification"));

    /// @notice URL prefix that the compliance source-of-record must match.
    ///         The contract only accepts FDC proofs whose request URL starts
    ///         with this prefix, preventing MitM / malicious-source attacks.
    string public complianceUrlPrefix;

    /// @notice Max age (seconds) of an accepted compliance verdict.
    uint256 public complianceMaxAge = 1 hours;

    uint256 public nextNoteId = 1;
    mapping(uint256 => BearerNote) public notes;
    mapping(uint256 => mapping(address => RedemptionCommit)) public redemptionCommits;

    /// @notice Total notes minted via an FDC attestation (machine-verifiable KPI).
    uint256 public fdcAttestedMintCount;

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
    error FdcProofInvalid();
    error ComplianceUrlMismatch();
    error ComplianceVerdictNotClear();
    error ComplianceSubjectMismatch();
    error ComplianceStale();
    error EmptyUrlPrefix();

    event NoteMinted(uint256 indexed noteId, address indexed asset, address indexed issuer, uint256 faceValue, uint64 expiresAt, bool fdcAttested);
    event RedemptionCommitted(uint256 indexed noteId, address indexed merchant, bytes32 commitment);
    event NoteRedeemed(uint256 indexed noteId, address indexed asset, address indexed merchant, address issuer, uint256 amount, uint256 issuerChange);
    event NoteCancelled(uint256 indexed noteId, address indexed asset, address indexed issuer, uint256 refund);
    event ComplianceUrlPrefixUpdated(string prefix);
    event ComplianceMaxAgeUpdated(uint256 maxAge);

    constructor(address registry, address initialOwner) Ownable(initialOwner) {
        if (registry == address(0) || initialOwner == address(0)) revert InvalidAddress();
        assetRegistry = AssetRegistry(registry);
    }

    // ---------------------------------------------------------------------
    // FDC compliance configuration (owner)
    // ---------------------------------------------------------------------

    function setComplianceUrlPrefix(string calldata prefix) external onlyOwner {
        if (bytes(prefix).length == 0) revert EmptyUrlPrefix();
        complianceUrlPrefix = prefix;
        emit ComplianceUrlPrefixUpdated(prefix);
    }

    function setComplianceMaxAge(uint256 maxAge) external onlyOwner {
        complianceMaxAge = maxAge;
        emit ComplianceMaxAgeUpdated(maxAge);
    }

    // ---------------------------------------------------------------------
    // Minting
    // ---------------------------------------------------------------------

    /// @notice Mint a bearer note. Requires the issuer to have passed an FDC
    ///         Web2Json compliance attestation from `complianceUrlPrefix`.
    /// @param proof      FDC Web2Json proof of the compliance verdict.
    /// @param asset      ERC-20 used as collateral (must be allowlisted).
    /// @param faceValue  Amount of `asset` to lock.
    /// @param secretHash keccak256(abi.encode(secret)) — reveals on redeem.
    /// @param expiresAt  Absolute expiry timestamp (0 = never).
    function mintNoteAttested(
        IWeb2Json.Proof calldata proof,
        address asset,
        uint256 faceValue,
        bytes32 secretHash,
        uint64 expiresAt
    ) external nonReentrant whenNotPaused returns (uint256 noteId) {
        _enforceComplianceProof(proof);
        noteId = _mint(asset, faceValue, secretHash, expiresAt, true);
    }

    /// @notice Ungated mint (owner-only). Retained for testing / fallback.
    function mintNote(address asset, uint256 faceValue, bytes32 secretHash, uint64 expiresAt)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 noteId)
    {
        noteId = _mint(asset, faceValue, secretHash, expiresAt, false);
    }

    function _mint(address asset, uint256 faceValue, bytes32 secretHash, uint64 expiresAt, bool fdcAttested)
        internal
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
        notes[noteId] = BearerNote(asset, faceValue, secretHash, msg.sender, uint64(block.timestamp), expiresAt, false, fdcAttested);
        if (fdcAttested) {
            unchecked { fdcAttestedMintCount++; }
        }
        emit NoteMinted(noteId, asset, msg.sender, faceValue, expiresAt, fdcAttested);
    }

    // ---------------------------------------------------------------------
    // FDC compliance enforcement
    // ---------------------------------------------------------------------

    /// @dev Verifies the FDC proof, pins the source URL to the configured
    ///      prefix, decodes the compliance verdict, and ensures the attested
    ///      subject is the caller and the verdict is CLEAR and fresh.
    function _enforceComplianceProof(IWeb2Json.Proof calldata proof) internal view {
        // 1. Cryptographic FDC verification via the on-chain registry.
        address fdcVerification = _getFdcVerification();
        if (!IFdcVerification(fdcVerification).verifyWeb2Json(proof)) revert FdcProofInvalid();

        // 2. Source-URL pinning (MitM defence per Flare URL-parsing guidance).
        string memory url = proof.data.requestBody.url;
        if (!_startsWith(bytes(url), bytes(complianceUrlPrefix))) revert ComplianceUrlMismatch();

        // 3. Decode the attested verdict.
        ComplianceVerdict memory v = abi.decode(proof.data.responseBody.abiEncodedData, (ComplianceVerdict));
        if (v.verdict != 1) revert ComplianceVerdictNotClear();
        if (v.subject != msg.sender) revert ComplianceSubjectMismatch();
        if (block.timestamp > v.timestamp + complianceMaxAge) revert ComplianceStale();
    }

    function _getFdcVerification() internal view returns (address) {
        (bool ok, bytes memory data) = FLARE_CONTRACT_REGISTRY.staticcall(
            abi.encodeWithSignature("getContractAddressByHash(bytes32)", FDC_VERIFICATION_NAME)
        );
        require(ok, "registry call failed");
        return abi.decode(data, (address));
    }

    function _startsWith(bytes memory data, bytes memory prefix) internal pure returns (bool) {
        uint256 n = prefix.length;
        if (data.length < n) return false;
        for (uint256 i = 0; i < n; ) {
            if (data[i] != prefix[i]) return false;
            unchecked { ++i; }
        }
        return true;
    }

    // ---------------------------------------------------------------------
    // Redemption (unchanged commit-reveal flow)
    // ---------------------------------------------------------------------

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
