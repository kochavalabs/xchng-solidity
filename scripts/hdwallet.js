const Web3 = require('web3');
const auction = require('../build/contracts/DutchAuction.json');
const token = require('../build/contracts/XchngToken.json');
const HDWalletProvider = require("truffle-hdwallet-provider");
const { awaitHandler, STAGES } = require('./util');

// Read the environment variables
const MNEMONIC = process.env.MNEMONIC; // This must be set
const NODE_ADDR = process.env.NODE_ADDR || 'http://localhost:7545' ;
const AUCTION_ADDRESS = process.env.AUCTION_ADDRESS || '';
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || '';
// How many tokens to start with (Optional environment viarable or 600 Million*10^18)
const NUM_TOKENS_AVAILABLE = process.env.NUM_TOKENS_AVAILABLE || '600000000000000000000000000';

// Sets the hdwallet based on environment variables (Generate 10 account addresses from mnemonic for testing)
hdwallet = new HDWalletProvider(MNEMONIC, NODE_ADDR, 0, 10);

// Setup the provider
const web3 = new Web3(hdwallet);

// build the contract using the ABI
const dutchAuction = new web3.eth.Contract(auction.abi, AUCTION_ADDRESS);
const xchngToken = new web3.eth.Contract(token.abi, TOKEN_ADDRESS);

const getAccounts = async () => {
    let accounts;
    let err;
  
    // Get the list of accounts
    [accounts, err] = await awaitHandler(web3.eth.getAccounts());
    if (err != null) {
      console.log('Error getting accounts: ', err);
      process.exit(1);
    }

    return accounts;
};

const getStage = async () => {
    let stage;
    let err;
  
    // Get the current auction stage
    [stage, err] = await awaitHandler(dutchAuction.methods.stage().call());
    if (err != null) {
      console.log('Error getting auction stage: ', err);
      process.exit(1);
    }
  
    switch (stage) {
      case '0':
        return STAGES.AuctionDeployed;
      case '1':
        return STAGES.Setup;
      case '2':
        return STAGES.AuctionStarted;
      case '3':
        return STAGES.AuctionEnded;
      case '4':
        return STAGES.TokensDistributed;
      default:
        // It should be impossible to get here, but just in-case
        return { enum: '-1', name: 'Unknown' };
    }
};

const getBalance = async (address) => {
    let wei;
    let err;
  
    [wei, err] = await awaitHandler(web3.eth.getBalance(address));
    if (err != null) {
      console.log('Error getting address balance: ', err);
      process.exit(1);
    }
  
    return web3.utils.fromWei(wei);
  };

const whitelist = async (address, owner) => {
    let _;
    let err;
  
    [_, err] = await awaitHandler(dutchAuction.methods.addAddressToWhitelist(address).send({ from: owner, gas: 1000000 }));
    if (err != null) {
      console.log('Error whitelisting address: ', err);
      process.exit(1);
    }
  
    return true;
};
  

module.exports = {
    web3, dutchAuction, xchngToken, NUM_TOKENS_AVAILABLE, AUCTION_ADDRESS, TOKEN_ADDRESS, getAccounts, getStage, getBalance, whitelist,
}