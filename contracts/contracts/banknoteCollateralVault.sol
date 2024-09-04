//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

// Use openzeppelin to inherit battle-tested implementations (ERC20, ERC721, etc)
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * A smart contract that mints and redeems banknotes.  The web app is responsible for printing the notes.
 * Before calling the mint function the Dapp must create a random secret and hashes it.
 * The mint function locks the amount in the vault, stores a hash of the secret and returns the Id of the banknote.
 * The app must print the Id as well as the private key of the redeemer.
 * Using the printed Id and the secret the receiver can prove they know the secret without revealing it
 * The redemption process requires that the receiver hashes the secret and then hashes it with its own pubkey.
 * The contract already has the hashed secret and can hash it with the msg.sender to check they are the same.
 * The funds are relesed to the msg.sender.
 * The minter of the banknote receives any change from the transaction as surplus
 * The minter can skim the surplus using a separate function.
 * @author LenOfTawa, .....
 */

// 9/3 gaffney - added ReentrancyGuard and SafeERC20
contract BanknoteCollateralVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Banknote {
        address minter;
        address erc20;
        uint256 hashedSecret;
        uint8 denomination;
    }

    address private owner;
    uint32 private nextId = 0;
    mapping(uint32 => Banknote) private banknotes; // registry of banknotes
    mapping(address => mapping(address => uint)) private surplusFunds; // registry of ERC20 balances belonging to a minter
    uint8[] private denominations = [1, 2, 5, 10, 50, 100]; //valid denominations.

event banknoteMinted(
    address indexed minter,
    address erc20,
    uint32 id,
    uint8 denomination
);

    event banknoteRedeemed(
        address indexed minter,
        address erc20,
        uint256 amount,
        uint256 discount,
        uint32 id
    );

    event surplusFundsSkimmed(address indexed _erc20, uint _amount);

    constructor(address _owner) {
        owner = _owner;
    }

    // Modifier: used to define a set of rules that must be met before or after a function is executed
    // Check the withdraw() function
    modifier isOwner() {
        // msg.sender: predefined variable that represents address of the account that called the current function
        require(msg.sender == owner, "Not the Owner");
        _;
    }

    // Getters
    function getBanknoteInfo(
        uint32 _id
    ) public view returns (address, uint256, address, uint8) {
        return (
            banknotes[_id].minter,
            banknotes[_id].hashedSecret,
            banknotes[_id].erc20,
            banknotes[_id].denomination
        );
    }

    function getSurplus(
        address _owner,
        address _erc20
    ) public view returns (uint) {
        return (surplusFunds[address(_owner)][address(_erc20)]);
    }

    function getNextId() public view returns (uint32) {
        return (nextId);
    }

    // Main functions
    // 9/3 gaffney - added approveAndMint
    function approveAndMint(
        address _erc20,
        uint256 _hash1,
        uint8 _denomination
    ) external nonReentrant returns (uint32) {
        uint256 amount = _denomination * 10 ** 18; // Assuming 18 decimals
        IERC20 token = IERC20(_erc20);

        // Approve and transfer in one transaction
        token.safeApprove(address(this), amount);
        return mintBanknote(_erc20, _hash1, _denomination);
    }

    function mintBanknote(
        address _erc20,
        uint256 _hash1,
        uint8 _denomination
    ) public nonReentrant returns (uint32 id) {
        require(isDenominationValid(_denomination), "Invalid denomination");

        Banknote memory tBanknote = Banknote({
            minter: msg.sender,
            erc20: _erc20,
            hashedSecret: _hash1,
            denomination: _denomination
        });

        id = nextId++;
        banknotes[id] = tBanknote;

        uint256 amount = uint256(_denomination) * 10 ** 18; // Assuming 18 decimals

        if (surplusFunds[msg.sender][_erc20] >= amount) {
            surplusFunds[msg.sender][_erc20] -= amount;
        } else {
            IERC20(_erc20).safeTransferFrom(msg.sender, address(this), amount);
        }

        emit banknoteMinted(msg.sender, _erc20, id, _denomination);
    }

    //         //TODO - make the denominations defined by the ATM app. Why check it here?
    //         for (uint8 i = 0; i < denominations.length; i++) {
    //             if (_denomination == denominations[i]) {
    //                 Banknote memory tBanknote;
    //                 tBanknote.minter = address(msg.sender);
    //                 tBanknote.erc20 = _erc20;
    //                 tBanknote.hashedSecret = _hash1;
    //                 tBanknote.denomination = _denomination;
    //                 banknotes[nextId++] = tBanknote;

    //                 /*
    //                 console.log(
    //                     "Minting to %s id= %s  %s tokens",
    //                     _hash1,
    //                     nextId-1,
    //                     _denomination*10**18
    //                 );
    // */
    //                 // THIS IS NOT WORKING - WHY???  We will approve instead!
    //                 //(bool success, ) = address(_erc20).delegatecall(
    //                 //    abi.encodeWithSignature("transfer(address,uint256)",
    //                 //    address(this),
    //                 //    _denomination*10**18));
    //                 //require(success, "Token transfer failed");

    //                 //TODO - check/use surplus funds before transfering more funds.

    //                 //NOTE: the app should use the ERC20 currency symbol so we can use any currency.

    //                 //TODO -
    //                 uint8 decimals = 18; // TODO - get this from the erc20 contract.
    //                 require(
    //                     IERC20(_erc20).transferFrom(
    //                         msg.sender,
    //                         address(this),
    //                         _denomination * 10 ** decimals
    //                     ),
    //                     "Token transfer failed"
    //                 );
    //                 emit banknoteMinted(
    //                     msg.sender,
    //                     _erc20,
    //                     nextId - 1,
    //                     _denomination
    //                 );

    //                 return nextId - 1;
    //             }
    //         }
    //         revert("Bad denomination");
    //     }

    function redeemBanknote(
        uint32 _banknote,
        uint _amount,
        uint256 _hash2,
        uint256 _discount
    ) public nonReentrant {
        uint8 _denomination = banknotes[_banknote].denomination; // 0 if there is no valid banknote
        Banknote memory note = banknotes[_banknote];
        require(_denomination != 0, "Bad banknote");
        
 bytes32 calculatedHash = keccak256(abi.encodePacked(note.hashedSecret, msg.sender));
    require(uint256(calculatedHash) == _hash2, "Redemption denied");

        // require(
        //     uint256(
        //         keccak256(
        //             abi.encodePacked(
        //                 banknotes[_banknote].hashedSecret,
        //                 msg.sender
        //             )
        //         )
        //     ) == _hash2,
        //     "Redemption denied"
        // );

        // uint8 _decimals = 18; ///TODO get this from the erc20 contract

        // require(
        //     (_discount + _amount) <= _denomination * 10 ** _decimals,
        //     "Amount too large"
        // );

        uint256 maxAmount = uint256(note.denomination) * 10 ** 18;
        require(_amount <= maxAmount, "Amount too large");
        require((_discount + _amount) <= maxAmount, "Total amount too large");

        // address _minter = banknotes[_banknote].minter;
        // address _erc20 = banknotes[_banknote].erc20;

        uint256 change = maxAmount - _amount;
        surplusFunds[note.minter][note.erc20] += change;

        // surplusFunds[_minter][_erc20] += (_denomination *
        //     10 ** _decimals +
        //     _discount -
        //     _amount);
        /*
        console.log(
            "Redeeming note %s amount %s  change %s ",
			_banknote,
			_amount,
            _denomination*10**18 - _amount
        );
*/
        //require (IERC20(_erc20).approve(address(this), _amount), "Token approval refused");
        // require(
        //     IERC20(_erc20).transfer(msg.sender, (_amount - _discount)),
        //     "Token transfer failed"
        // );

        IERC20(note.erc20).safeTransfer(msg.sender, _amount - _discount);

        emit banknoteRedeemed(
            note.minter,
            note.erc20,
            _amount,
            _discount,
            _banknote
        );
        // emit banknoteRedeemed(_minter, _erc20, _amount, _discount, _banknote);

        banknotes[_banknote].minter = address(0);
        banknotes[_banknote].hashedSecret = 0;
        banknotes[_banknote].erc20 = address(0);
        banknotes[_banknote].denomination = 0;
        delete (banknotes[_banknote]);
    }

    function skimSurplus(address _erc20, uint _amount) public nonReentrant {
        // uint _withdrawal = surplusFunds[msg.sender][_erc20]; // assume skim all
        uint256 availableSurplus = surplusFunds[msg.sender][_erc20];
        uint256 _withdrawal = _amount == 0 ? availableSurplus : _amount;

        if (_amount != 0) {
            _withdrawal = _amount;
        } // if there is an amount then skim that

        require(_withdrawal > 0, "No funds to skim");
        require(_withdrawal > _amount, "Over limit");
        require(
            _withdrawal > 0 && _withdrawal <= availableSurplus,
            "Invalid withdrawal amount"
        );
        /*
        console.log(
            "Skimming surplus to %s amount %s  remaining %s ",
			msg.sender,
            _amount,
            surplusFunds[msg.sender][_erc20]
        );
*/
        //require (IERC20(_erc20).approve(address(this), _amount), "Token approval refused");
        require(
            IERC20(_erc20).transfer(msg.sender, _withdrawal),
            "Token transfer failed"
        );

        surplusFunds[msg.sender][_erc20] -= _withdrawal;
        IERC20(_erc20).safeTransfer(msg.sender, _withdrawal);

        emit surplusFundsSkimmed(_erc20, _amount);
    }

    function isDenominationValid(
        uint8 _denomination
    ) internal view returns (bool) {
        for (uint8 i = 0; i < denominations.length; i++) {
            if (_denomination == denominations[i]) {
                return true;
            }
        }
        return false;
    }
    /**
     * Function that allows the contract to receive ETH
     */
    receive() external payable {}
}
