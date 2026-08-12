// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AssetRegistry is Ownable {
    struct AssetPolicy {
        bool enabled;
        uint128 minimumNoteValue;
        uint128 maximumNoteValue;
    }

    mapping(address => AssetPolicy) private policies;

    error InvalidAsset();
    error InvalidPolicy();
    error UnsupportedAsset(address asset);
    error InvalidNoteValue(address asset, uint256 amount);

    event AssetPolicyUpdated(address indexed asset, bool enabled, uint256 minimumNoteValue, uint256 maximumNoteValue);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setAssetPolicy(
        address asset,
        bool enabled,
        uint128 minimumNoteValue,
        uint128 maximumNoteValue
    ) external onlyOwner {
        if (asset == address(0)) revert InvalidAsset();
        if (minimumNoteValue == 0 || maximumNoteValue < minimumNoteValue) revert InvalidPolicy();

        policies[asset] = AssetPolicy(enabled, minimumNoteValue, maximumNoteValue);
        emit AssetPolicyUpdated(asset, enabled, minimumNoteValue, maximumNoteValue);
    }

    function getAssetPolicy(address asset) external view returns (AssetPolicy memory) {
        return policies[asset];
    }

    function validate(address asset, uint256 amount) external view {
        AssetPolicy memory policy = policies[asset];
        if (!policy.enabled) revert UnsupportedAsset(asset);
        if (amount < policy.minimumNoteValue || amount > policy.maximumNoteValue) {
            revert InvalidNoteValue(asset, amount);
        }
    }
}
