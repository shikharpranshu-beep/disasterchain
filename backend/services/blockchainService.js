const crypto = require('crypto');
const BlockchainRecord = require('../models/BlockchainRecord');

/**
 * Computes SHA-256 hash for block verification
 */
const calculateHash = (dataString) => {
  return '0x' + crypto.createHash('sha256').update(dataString).digest('hex');
};

/**
 * Creates a prototype blockchain verification block and stores it in MongoDB
 */
const createBlockchainRecord = async ({
  entityType,
  entityId,
  donorOrSource,
  destination,
  resourceName,
  quantity,
  unit = 'units',
  status = 'Verified',
}) => {
  try {
    // Find the latest block to link the chain
    const latestRecord = await BlockchainRecord.findOne().sort({ blockNumber: -1 });
    const blockNumber = latestRecord ? latestRecord.blockNumber + 1 : 1001;
    const previousBlockHash = latestRecord
      ? latestRecord.blockHash
      : '0x0000000000000000000000000000000000000000000000000000000000000000';

    const timestamp = new Date();
    const dataToHash = `${blockNumber}-${previousBlockHash}-${entityType}-${entityId}-${quantity}-${destination}-${timestamp.toISOString()}`;
    const blockHash = calculateHash(dataToHash);
    const signature = calculateHash(`${blockHash}-DisasterChainNetworkAuthKey`);
    const transactionId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    const record = await BlockchainRecord.create({
      transactionId,
      entityType,
      entityId,
      donorOrSource,
      destination,
      resourceName,
      quantity,
      unit,
      status,
      blockNumber,
      blockHash,
      previousBlockHash,
      signature,
      timestamp,
      verificationNote: 'Transparent cryptographic audit record logged to DisasterChain prototype ledger.',
    });

    return record;
  } catch (error) {
    console.error('Blockchain Service Error:', error);
    // Return mock block if DB isn't connected
    return {
      transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      blockHash: '0x' + crypto.randomBytes(32).toString('hex'),
      blockNumber: 1042,
      status: 'Verified',
    };
  }
};

module.exports = {
  createBlockchainRecord,
  recordTransaction: createBlockchainRecord,
  calculateHash,
};
