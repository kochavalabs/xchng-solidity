const Web3 = require('web3');
const auction = require('../build/contracts/DutchAuction.json');
const token = require('../build/contracts/XchngToken.json');
const HDWalletProvider = require("truffle-hdwallet-provider");
const { awaitHandler } = require('./util');

// Sets the hdwallet based on environment variables
const mnemonic = process.env.MNEMONIC;
const node = process.env.NODE_ADDR;

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

module.exports = {
    getAccounts, dutchAuction, xchngToken,
}