# Skeuomorphia
Making Web 3 payments familar to reluctant boomers who are still using physical cash.
As the project name suggests, this app is specifically designed to be 'skeuomorphic'. That is, it applies a legacy experience to a new technology. This is usually viewed with disdain, as it does not provide the efficiency and improved experience that the technology offers. However, the goal is not to make this experience the norm, but to smooth the path for reluctant participants.

# Why?
Mobile apps and Web 3 digital Wallets are mysterious to many older people.  We need a way to create a sense of familiarity to Web 3 payments by using familiar workflows and terminology. This may seem backwards and nullifies the usefulness of Web 3 payments. However, it does highlight the parralel between the old notion of cash and Web 3 payments in that they are both permissionless diintermediated peer to peer.
The intent is not that this becomes the ubiquitous form of payment. It simply demonstrates that an alternative monetary system is not totally novel nor is it something to be afraid of. A wallet could be created that supports these features as a beginner mode, with a more Web3 native mode as a progression.

# How
## Legacy case
We need to use a workflow that everyone can understand.  For cash, this is very well understood:
1. User goes to a Bank or ATM 
2. User presents identity information to the Bank Teller or ATM
3. ATM or Teller authenticates the user
4. ATM or Teller asks for withdrawal ammount
5. User selects withdrawal amount
6. Teller or ATM verifies that there is sufficient balance in the user's account
7. Teller or ATM delivers the correct amount in notes
8. User puts it in their wallet
9. User goes to merchant and selects goods
10. User presents Merchant to notes
11. Merchant takes notes
12. Merchant returns change
13. Merchant gives the user a receipt
14. Merchant deposits notes into their bank account

In this flow, we are adding many extra steps to a digital wallet experience, but it does mean that the user does not need a mobile phone, nor do they need to be connected to spend. Spending simply involves handing over the notes. The extra steps have analogs in the real world, so we can use the same language.

## Web 3 equivalent
The Skeuomorphia solution will map the legacy journey to a Web 3 model as follows:
1. User goes to virtual ATM which is presented as a realistic image
2. User presents identity information to the virtual ATM - this is simulated using Web3Auth
3. ATM verifies the user
4. ATM shows a screen offering different amounts (rationale: the primary function is almost always 'Withdraw')
5. User selects a withdrawal denomination (only one note at a time to maximise simplicity)
6. ATM verifies that there is sufficient balance in the user's account (error if not enough)
7. ATM asks for confirmation, which is also a signal to print.
8. ATM 'delivers' the correct note as a pdf and navigates to the print dialog automatically
9. User prints note and puts in in their physical wallet
10. User goes to merchant and selects goods
11. User presents printed note to merchant
12. Merchant takes note
13. Merchant DOES NOT return change (this is a slight divergance from the fiat model)
14. Merchant deposits notes into their bank by scanning QR code with an app
15. The app uses information from the QR code and the Account of the merchant to construct a transaction that releases the funds in a way that cannot be front-run. 
16. The contract sends to amount of the transaction to the Merchant and releases the change back to the user.
17. The contract generates an attestation as a receipt
18. Merchant displays the transaction details to the user (including the amount taken and any change returned to the user's account).

In this flow, we simulate the ATM using a web site and simulate notes using a document with a printed QR code.  Spenending is close to the real cash experience in that the user hands over paper. However, the Merchant does not keep the paper note. Instead, the note is redeemed when the Merchant submits the transaction and the merchant must do that to ensure that it is not already spent. In essence it is more like a single use ticket.

We could extend this to online transactions by showing QR code information as a number that can be pasted into a merchant web site. However, this make less sense because the user needs to be internet savvy enough to use a web site, so then so we would probably want to make it look a lot more like internet banking, which not that different from a Web 3 contract wallet.

# What do we need to build?
## Stable coin ERC20 contract
This contract will support the standard ERC20 interface. It could be a real coin, but for simplicity we will create our own so we can easily mint into our wallet.
## Cash escrow contract
Could this be an NFT?
This contract holds the funds that back the tokens that have been minted as notes.
Each note in the contract will store: 
- the denomination (eg 100, 50, 20...),
- a unique noteID,
- a commitment of a secret that can be used to release the cash 
The note itself will display a QR code that encodes the secret and banknote Id. 

Any User that owns the stablecoin can mint banknotes by calling a function on the contract. 
The user must first create a secret that will only be chared on the banknote.
The user mints the banknote by calling a function on the Cash escrow contract, the ERC20 tokens are transferred into the cash escrow contract. The function will save the denomination and commitment (hash) of the secret.The function will return an ID referring to the note.
The banknote can be printed. It will contain a compressed code containing the banknoteID, the secret.

The Merchant can redeem banknotes by submitting a transaction containing proof that it owns the secret.  The proof is also bound to the Merchaing to prevent front-running.
The proof is the commitment on the chain hashed with the The banknote is identified using the noteID. The Merchant also supplies the value of the goods and the Merchant's real address so it can receive the amount. 
The redeem function will check that msg.sender is the address of the burner wallet associated with the noteID. If so it will transfer the correct amount of ERC20 tokens to the merchant account and return any change to the User's account.
Optionally, the function can contain a short description of the goods.
The redeem function will also create an onchain Attestation to serve as a receipt (and guarantee) for the goods.

## ATM simulation Web portal
The web site could use Web3Auth to authenticate the user - somehow???
The web portal will show a realistic ATM interface.
The user can only print one note at a time.
UX would make the workflow look and feel like the real thing (e.g. delivering a note in the tray). 
## Merchant app
If possible, this should be a mobile implementation using the camera.
The secret is obtained from the note.
The merchant app calls a function of the cash escrow contract to redeem the note.  This requires the secret and the amount **CAN THIS BE FRONT-RUN??**

![image](https://github.com/user-attachments/assets/10403d2c-0d7a-4482-a523-c3f738517169)

----
# Thoughts
I think the if we use Kinto, we have abstract accounts already - how does that help?
If we use xxxx then we can make the note represented by a secret 256 bit number.
Picture of ATM with PIN pad + ??? 
User selects note by note 100, 50, 20, 10, 5
Simplify, user can only select one at a time.  E.g. 80 is not allowed.
Notes are printed (to PDF) with a QR code, which is a secret that mujst be used in the redeem function.
The merchant calls the redeem function with secret + amount
Contract checks secret, destroys the note, returns (dedmonimation - amount) to user 

### Contracts

vault sep eth testnet: 0xbf26b234f3e48b32cfdad055b31a99c19cb45557
nzdt sep eth testnet: 0xaB0e2aEF0d236E0754E79eD34380a0Ec9700fE02