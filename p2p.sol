// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract PeerToPeerExchange {
    struct Offer {
        address maker;
        address tokenToSell;
        address tokenToBuy;
        uint256 minAmountToSell;
        uint256 maxAmountToSell;
        uint256 exchangeRate; // expressed as tokenToBuy per unit of tokenToSell
        uint256 expiryTime;
        bool isFulfilled;
    }

    uint256 public offerCount;
    mapping(uint256 => Offer) public offers;

    event OfferCreated(
        uint256 offerId,
        address maker,
        address tokenToSell,
        address tokenToBuy,
        uint256 minAmountToSell,
        uint256 maxAmountToSell,
        uint256 exchangeRate,
        uint256 expiryTime
    );

    event OfferFulfilled(uint256 offerId, address taker, uint256 amountSold, uint256 amountBought);

    function createOffer(
        address tokenToSell,
        address tokenToBuy,
        uint256 minAmountToSell,
        uint256 maxAmountToSell,
        uint256 exchangeRate,
        uint256 expiryTime
    ) external {
        require(expiryTime > block.timestamp, "Expiry time must be in the future");
        require(maxAmountToSell >= minAmountToSell, "Max amount must be greater than or equal to min amount");

        offerCount++;
        offers[offerCount] = Offer({
            maker: msg.sender,
            tokenToSell: tokenToSell,
            tokenToBuy: tokenToBuy,
            minAmountToSell: minAmountToSell,
            maxAmountToSell: maxAmountToSell,
            exchangeRate: exchangeRate,
            expiryTime: expiryTime,
            isFulfilled: false
        });

        emit OfferCreated(
            offerCount,
            msg.sender,
            tokenToSell,
            tokenToBuy,
            minAmountToSell,
            maxAmountToSell,
            exchangeRate,
            expiryTime
        );
    }

    function fulfillOffer(uint256 offerId, uint256 amountToSell) external {
        Offer storage offer = offers[offerId];
        require(block.timestamp <= offer.expiryTime, "Offer has expired");
        require(!offer.isFulfilled, "Offer is already fulfilled");
        require(amountToSell >= offer.minAmountToSell, "Amount is below the minimum required");
        require(amountToSell <= offer.maxAmountToSell, "Amount exceeds the maximum allowed");

        uint256 amountToBuy = (amountToSell * offer.exchangeRate);
        IERC20(offer.tokenToSell).transferFrom(msg.sender, offer.maker, amountToSell);
        IERC20(offer.tokenToBuy).transferFrom(offer.maker, msg.sender, amountToBuy);

        offer.isFulfilled = true;

        emit OfferFulfilled(offerId, msg.sender, amountToSell, amountToBuy);
    }
}
