// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title SimpleSwap — minimal constant-product AMM for Flare Terminal
/// @notice Supports multiple token pairs with 0.3% fee, no LP tokens (donation-based liquidity)
contract SimpleSwap is Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant FEE_BIPS = 30; // 0.3%

    struct Pair {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        bool exists;
    }

    mapping(bytes32 => Pair) public pairs;
    bytes32[] public pairIds;

    event PairCreated(bytes32 indexed pairId, address tokenA, address tokenB);
    event LiquidityAdded(bytes32 indexed pairId, address provider, uint256 amountA, uint256 amountB);
    event SwapExecuted(bytes32 indexed pairId, address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);

    error PairNotFound();
    error InsufficientOutput();
    error InsufficientLiquidity();
    error IdenticalTokens();
    error ZeroAmount();

    constructor() Ownable(msg.sender) {}

    function pairId(address tokenA, address tokenB) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(tokenA < tokenB ? tokenA : tokenB, tokenA < tokenB ? tokenB : tokenA));
    }

    function createPair(address tokenA, address tokenB) external onlyOwner returns (bytes32 id) {
        if (tokenA == tokenB) revert IdenticalTokens();
        id = pairId(tokenA, tokenB);
        if (!pairs[id].exists) {
            pairs[id] = Pair({tokenA: tokenA < tokenB ? tokenA : tokenB, tokenB: tokenA < tokenB ? tokenB : tokenA, reserveA: 0, reserveB: 0, exists: true});
            pairIds.push(id);
            emit PairCreated(id, tokenA, tokenB);
        }
    }

    function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) external {
        if (amountA == 0 || amountB == 0) revert ZeroAmount();
        bytes32 id = pairId(tokenA, tokenB);
        Pair storage p = pairs[id];
        if (!p.exists) revert PairNotFound();

        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountB);

        // Track reserves by matching token addresses
        if (tokenA == p.tokenA) {
            p.reserveA += amountA;
            p.reserveB += amountB;
        } else {
            p.reserveA += amountB;
            p.reserveB += amountA;
        }

        emit LiquidityAdded(id, msg.sender, amountA, amountB);
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256) {
        if (amountIn == 0) revert ZeroAmount();
        if (reserveIn == 0 || reserveOut == 0) revert InsufficientLiquidity();
        uint256 amountInWithFee = (amountIn * (10000 - FEE_BIPS)) / 10000;
        return (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
    }

    function getQuote(address tokenIn, address tokenOut, uint256 amountIn) external view returns (uint256) {
        bytes32 id = pairId(tokenIn, tokenOut);
        Pair storage p = pairs[id];
        if (!p.exists) revert PairNotFound();
        (uint256 reserveIn, uint256 reserveOut) = tokenIn == p.tokenA ? (p.reserveA, p.reserveB) : (p.reserveB, p.reserveA);
        return getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external returns (uint256 amountOut) {
        if (amountIn == 0) revert ZeroAmount();
        bytes32 id = pairId(tokenIn, tokenOut);
        Pair storage p = pairs[id];
        if (!p.exists) revert PairNotFound();

        (uint256 reserveIn, uint256 reserveOut) = tokenIn == p.tokenA ? (p.reserveA, p.reserveB) : (p.reserveB, p.reserveA);
        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        if (amountOut < minAmountOut) revert InsufficientOutput();

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);

        if (tokenIn == p.tokenA) {
            p.reserveA += amountIn;
            p.reserveB -= amountOut;
        } else {
            p.reserveB += amountIn;
            p.reserveA -= amountOut;
        }

        emit SwapExecuted(id, msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    function getReserves(address tokenA, address tokenB) external view returns (uint256 reserveA, uint256 reserveB) {
        bytes32 id = pairId(tokenA, tokenB);
        Pair storage p = pairs[id];
        if (!p.exists) return (0, 0);
        return (p.reserveA, p.reserveB);
    }

    function pairCount() external view returns (uint256) {
        return pairIds.length;
    }

    function getPairAt(uint256 index) external view returns (address tokenA, address tokenB, uint256 reserveA, uint256 reserveB) {
        Pair storage p = pairs[pairIds[index]];
        return (p.tokenA, p.tokenB, p.reserveA, p.reserveB);
    }

    // Owner can withdraw tokens (for migration / emergency)
    function withdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
