/* eslint no-unused-vars: "off", prefer-const: "off" */
const { awaitHandler, STAGES } = require('./util');
const {
  web3, dutchAuction, xchngToken, AUCTION_ADDRESS, TOKEN_ADDRESS, NUM_TOKENS_AVAILABLE, getStage, getAccounts, getBalance, whitelist, estimateGas,
} = require('./web3');

let address = process.env.FROM_ADDRESS || 'None';
const amount = process.env.BID_AMOUNT || '1';

async function bid() {
  let stage = await getStage();
  const accounts = await getAccounts();

  if (stage !== STAGES.AuctionStarted) {
    console.log('The auction must be started to submit a bid, please run the setup script first.');
    process.exit(1);
  }

  // If we weren't given an address pick a random one from ganache
  if (address === 'None') {
    // generate a random int [0,8], then add one to get [1,9] this way we skip
    // account 0 which owns the auction and is the eth recipient for bids
    const index = Math.floor(Math.random() * 9) + 1;
    address = accounts[index];
  }

  console.log('The auction has been started, continuing');
  console.log('From address', address);
  console.log('Bid amount', amount);

  console.log('Whitelisting', address);
  await whitelist(address, accounts[0]);

  console.log('Submitting Bid');
  let transaction;
  let err;
  [transaction, err] = await awaitHandler(dutchAuction.methods.bid().send({ from: address, value: web3.utils.toWei(amount), gas: 1000000 }));
  if (err != null) {
    console.log('Error submitting bid to auction: ', err);
    process.exit(1);
  }

  console.log('Bid was successful with transaction:', transaction.transactionHash);

  // Get the balance of the sender, the owner, and the value the auction is tracking as a status dump
  const senderBalance = await getBalance(address);
  const ownerBalance = await getBalance(accounts[0]);

  let receivedWei;
  [receivedWei, err] = await awaitHandler(dutchAuction.methods.auction_received_wei().call());
  if (err != null) {
    console.log('Error getting auction received wei: ', err);
    process.exit(1);
  }

  console.log('');
  console.log('After bidding, current status');
  console.log(`Sender ${address} balance (ETH): ${senderBalance}`);
  console.log(`Owner ${accounts[0]} balance (ETH): ${ownerBalance}`);
  console.log('Contract received wei:', receivedWei);
}

console.log('Running bid submission');
bid();
