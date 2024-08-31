//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

// Use openzeppelin to inherit battle-tested implementations (ERC20, ERC721, etc)
import "@openzeppelin/contracts/access/Ownable.sol";

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract NZDollar is ERC20 {
    constructor(uint256 initialSupply) ERC20("New Zealand Dollar", "NZDT") {
        _mint(msg.sender, initialSupply);
        transfer(0xD0E31F3Bd528b17DB25Af9a6014B56D2E3B6d773,1000*10**18);
    }
}
