# DisasterChain — Blockchain Transparency Layer ⛓️

## Overview
In disaster relief operations, millions of dollars in supplies (medicines, drinking water, thermal blankets, and food rations) are donated. However, tracking whether these resources reach ground-level victims transparently is often difficult.

**DisasterChain** integrates a cryptographic transparency ledger into emergency logistics:

1. **Donation Registration**: Donors or NGO agencies record incoming relief shipments.
2. **Cryptographic Proof Minting**: Each donation generates a SHA-256 block hash and signature representing its origin and destination.
3. **Distribution Audit**: When resources move from warehouses to shelters or flood zones, the movement is logged to the Transparency Ledger.
4. **Public Verification**: Students, volunteers, and donors can view cryptographic receipts and trace the exact **Resource Journey** from donor to beneficiary.

## Smart Contract Structure
- **`contracts/DisasterLedger.sol`**: Solidity smart contract demonstrating how transaction records can be immutably recorded on EVM-compatible testnets (such as Sepolia or local Hardhat/Ganache testnets).
- **Academic Prototype Mode**: The DisasterChain web application uses a server-side cryptographic ledger service that generates genuine SHA-256 block hashes and stores verifiable transaction records in MongoDB.
