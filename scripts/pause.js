/* eslint no-unused-vars: "off", prefer-const: "off" */
const { awaitHandler, STAGES } = require('./util');
const {
  getAccounts, dutchAuction, xchngToken
} = require('./hdwallet');

async function pause(isToken) {
  let contract = dutchAuction;
  if(isToken){
      contract = xchngToken;
  }

  // Get the accounts
  const accounts = await getAccounts();

  let transaction;
  let err;
  [transaction, err] = await awaitHandler(contract.methods.pause().send({ from: accounts[0], gas: 1000000 }));
  if (err != null) {
    console.log('Error pausing contract: ', err);
    process.exit(1);
  }

  console.log('Pause was successful with transaction:', transaction.transactionHash);

  // Check the pause value
  let isPaused;
  [isPaused, err] = await awaitHandler(contract.methods.paused().call());
  if (err != null) {
    console.log('Error getting paused value: ', err);
    process.exit(1);
  }

  console.log('');
  console.log('Contract paused?:', isPaused);
}

async function unpause(isToken) {
    let contract = dutchAuction;
    if(isToken){
      contract = xchngToken;
    }

    // Get the accounts
    const accounts = await getAccounts();
  
    let transaction;
    let err;
    [transaction, err] = await awaitHandler(contract.methods.unpause().send({ from: accounts[0], gas: 1000000 }));
    if (err != null) {
      console.log('Error pausing contract: ', err);
      process.exit(1);
    }
  
    console.log('Pause was successful with transaction:', transaction.transactionHash);
  
    // Check the pause value
    let isPaused;
    [isPaused, err] = await awaitHandler(contract.methods.paused().call());
    if (err != null) {
      console.log('Error getting paused value: ', err);
      process.exit(1);
    }
  
    console.log('');
    console.log('Contract paused?:', isPaused);
}

// Check for pause or unpause
var myArgs = process.argv.slice(2);
const usage = 'Usasge: node pause.js [pause | unpause] [token | auction]';

// Interpret arguments
switch (myArgs[0]) {
  case 'pause':
    switch (myArgs[1]) {
      case 'token':
        console.log('Pausing token');
        pause(true);
        break;
      case 'auction':
        console.log('Pausing Dutch Auction');
        pause(false);
        break;
      default:
        console.log(usage);
    }
    break;
  case 'unpause':
    switch (myArgs[1]) {
      case 'token':
        console.log('Unpausing token');
        unpause(true);
        break;
      case 'auction':
        console.log('Unpausing Dutch Auction');
        unpause(false);
        break;
      default:
        console.log(usage);
    }
    break;
  default:
    console.log(usage);
}
