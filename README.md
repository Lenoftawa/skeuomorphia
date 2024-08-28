# Skeuomorphia
Making Web 3 payments familar to reluctant boomers who are still using physical cash.
As the project name suggests, this app is specifically designed to mirror the application of a legacy experience to a new technology. This is usually viewed with disdain as it does not provide the efficiency and improved experience that the technology offers.  This is true for this application also. However, the goal is not that this system becomes the norm, but that it smoothes the path for reluctant participants who can be exposed to its full potential progressively.

# Why?
Mobile apps and Web 3 digital Wallets are mysterious to many older people.  We need a way to create a sense of familiarity to Web 3 payments by using familiar workflows and terminology. This may seem backwards and nullifies the usefulness of Web 3 payments. However, it does highlight the parralel between the old notion of cash and Web 3 payments in that they are both permissionless diintermediated peer to peer payment methods.
The intent is not that this becomes the ubiquitous form of payment. It simply demonstrates that an alternative monetary system is not totally novel nor is it something to be afraid of. A wallet could be created that supports these features as a beginner mode, with a more Web3 native mode as a progression.

# How
## Legacy case
We need to use a workflow that everyone can understand.  For cash, this is very well understood:
1. User goes to a Bank or ATM | user goes to bank web site
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
2. User presents identity information to the virtual ATM (account nuimber and Password)
3. ATM verifies the user
4. ATM shows a screen offering different amounts
5. User selects a withdrawal amount (Assume only one note at a time for demo)
6. ATM verifies that there is sufficient balance in the user's account (error if not enough)
7. ATM 'delivers' the correct note as a screen that the user can print
8. User prints note and puts in in their physical wallet
9. User goes to merchant and selects goods
10. User presents printed note to merchant
11. Merchant takes note
12. Merchant DOEs NOT return change
13. Merchant deposits notes into their bank by scanning QR code with an app and signing a message with the amount of the transaction. (Assume only one note for demo)
14. The contract sends to amount of the transaction to the Merchant and releases the change back to the user.
15. The contract generates an attestation as a receipt
16. Merchant displays the transaction details to the user (including the amount taken and any change returned to the user's account).

In this flow, we simulate the ATM using a web site and simulate notes using a document with a printed QR code.  Spenending is close to the real cash in that the user hands over paper, but the Merchant does not keep the paper note. Instead, the note is redeemed when the Merchant submits the transaction and the merchant must do that to ensure that it is not already spent. In essence it is more like a single use ticket.

We could extend this to online merchants by also printing the QR code as a number that can be pasted into a merchant web site. However, this make less sense because the user needs to be internet savvy enough to use a web site, so then so we would probably want to make it look a lot more like internet banking, which not that different from a Web 3 contract wallet.

# What do we need to build?
## stable coin ERC20 contract
This contract will support the standard ERC20 interface. It could be a real coin, but for simplicity we will create our own so we can easily mint into our wallet.
## cash escrow contract
Could this be an NFT?
This contract holds the funds that back the tokens that have been minted as notes.
Each note will store: 
- the denomination (eg 100, 50, 20...),
- a unique noteID,
- the new owner's address and
- the current owner's address
Any User that owns the stablecoin can mint notes by calling a function on the contract. 
The user must first create a new burner account which will become the new user.
The user mints the note by calling a function, the ERC20 tokens are transferred into the cash escrow contract. The function will save the User's address and set the new owner of note as the address of the burner account created by the user.
the function will return an ID referring to the note.
The note will contain a compressed code containing the noteID, denomination and the privKey for the burner account.
The Merchant can redeem notes by submitting a transaction using the privKey of the burner account. The note is identified using the noteID. The Merchant also supplies the value of the goods and the Merchat's real address so it can receive the amount. 
The redeem function contract will check that msg.sender is the address of the burner wallet associated with the noteID. If so it will transfer the correct amount of ERC20 tokens to the merchant account and return any change to the User's account.
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

