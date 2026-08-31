// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DisasterLedger
 * @dev Prototype Smart Contract for DisasterChain Transparency & Resource Verification.
 * This contract enables immutable logging of relief donations and shelter distributions.
 */
contract DisasterLedger {
    address public admin;

    enum EntityType { Donation, Distribution, ShelterAllocation, EmergencySupply }

    struct ReliefTransaction {
        string transactionId;
        string entityId;
        EntityType entityType;
        string donorOrSource;
        string destination;
        string resourceName;
        uint256 quantity;
        string unit;
        string status;
        uint256 timestamp;
    }

    ReliefTransaction[] public transactions;
    mapping(string => bool) public transactionExists;

    event TransactionRecorded(
        string indexed transactionId,
        string indexed entityId,
        string donorOrSource,
        string destination,
        uint256 quantity,
        uint256 timestamp
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "DisasterLedger: Only authorized admin can record transactions");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Record a relief transaction immutably to the blockchain
     */
    function recordTransaction(
        string memory _transactionId,
        string memory _entityId,
        EntityType _entityType,
        string memory _donorOrSource,
        string memory _destination,
        string memory _resourceName,
        uint256 _quantity,
        string memory _unit,
        string memory _status
    ) public onlyAdmin {
        require(!transactionExists[_transactionId], "DisasterLedger: Transaction ID already exists");

        transactions.push(ReliefTransaction({
            transactionId: _transactionId,
            entityId: _entityId,
            entityType: _entityType,
            donorOrSource: _donorOrSource,
            destination: _destination,
            resourceName: _resourceName,
            quantity: _quantity,
            unit: _unit,
            status: _status,
            timestamp: block.timestamp
        }));

        transactionExists[_transactionId] = true;

        emit TransactionRecorded(_transactionId, _entityId, _donorOrSource, _destination, _quantity, block.timestamp);
    }

    /**
     * @dev Get total transaction count recorded in the ledger
     */
    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }
}
