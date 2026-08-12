// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockFTSO is ERC20, Ownable {
    struct PriceFeed {
        string symbol;
        uint256 price;
        uint256 timestamp;
        uint8 decimals;
    }

    mapping(bytes4 => PriceFeed) public feeds;
    bytes4[] public feedIds;

    constructor() ERC20("Mock FTSO", "MFTSO") Ownable(msg.sender) {
        _addFeed("FLR", 0.025 * 1e5, 5);
        _addFeed("BTC", 65000 * 1e5, 5);
        _addFeed("ETH", 3500 * 1e5, 5);
        _addFeed("USD", 1 * 1e5, 5);
        _addFeed("XRP", 0.60 * 1e5, 5);
        _addFeed("DOGE", 0.15 * 1e5, 5);
    }

    function _addFeed(string memory symbol, uint256 price, uint8 decimals) internal {
        bytes4 id = bytes4(keccak256(bytes(symbol)));
        feeds[id] = PriceFeed(symbol, price, block.timestamp, decimals);
        feedIds.push(id);
    }

    function updatePrice(string memory symbol, uint256 price) external onlyOwner {
        bytes4 id = bytes4(keccak256(bytes(symbol)));
        require(feeds[id].decimals > 0, "Feed not found");
        feeds[id].price = price;
        feeds[id].timestamp = block.timestamp;
    }

    function getCurrentPrice(string memory symbol) external view returns (uint256 price, uint256 timestamp, uint8 decimals) {
        bytes4 id = bytes4(keccak256(bytes(symbol)));
        PriceFeed memory feed = feeds[id];
        return (feed.price, feed.timestamp, feed.decimals);
    }

    function getAllFeeds() external view returns (PriceFeed[] memory) {
        PriceFeed[] memory result = new PriceFeed[](feedIds.length);
        for (uint256 i = 0; i < feedIds.length; i++) {
            result[i] = feeds[feedIds[i]];
        }
        return result;
    }
}
