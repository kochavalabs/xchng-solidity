const Web3 = require('web3');
const auction = require('../build/contracts/DutchAuction.json');
const token = require('../build/contracts/XchngToken.json');
const HDWalletProvider = require("truffle-hdwallet-provider");
const { awaitHandler, STAGES } = require('./util');

// Sets the hdwallet based on environment variables
const mnemonic = process.env.MNEMONIC;
const node = process.env.NODE_ADDR;

// How many tokens to start with
const NUM_TOKENS_AVAILABLE = process.env.NUM_TOKENS_AVAILABLE || '600000000000000000000000000';

hdwallet = new HDWalletProvider(mnemonic, node);

// Setup the provider
const web3 = new Web3(hdwallet);

// build the contract using the ABI
const AUCTION_ADDRESS = process.env.CONTRACT_ADDRESS || '';
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || '';
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
    dutchAuction, xchngToken, NUM_TOKENS_AVAILABLE, AUCTION_ADDRESS, TOKEN_ADDRESS, getAccounts, getStage, whitelist,
}