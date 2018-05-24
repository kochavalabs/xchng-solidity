/* eslint no-unused-vars: "off", prefer-const: "off" */
const { awaitHandler, STAGES } = require('./util');
const {
  dutchAuction, xchngToken, AUCTION_ADDRESS, TOKEN_ADDRESS, NUM_TOKENS_AVAILABLE, getAccounts, getStage,
} = require('./hdwallet');

async function setup() {
  let err;
  let stage;
  let _;

  console.log('Getting a list of the accounts');
  // Get the accounts
  const accounts = await getAccounts();

  console.log('Approving the auction on the Token using account address:', accounts[0]);
  // Approve the dutch action for managing Xchng Token
  [_, err] = await awaitHandler(xchngToken.methods.approve(AUCTION_ADDRESS, NUM_TOKENS_AVAILABLE).send({ from: accounts[0], gas: 1000000 }));
  if (err != null) {
    console.log('Error approving the auction: ', err);
    process.exit(1);
  }

  console.log('Getting the current stage of the auction');
  // Get the current auction stage
  stage = await getStage();

  if (stage === STAGES.AuctionDeployed) {
    console.log('Setting up the auction');
    // Call setup on the auction now that it's approved in the token
    [_, err] = await awaitHandler(dutchAuction.methods.setup(TOKEN_ADDRESS, accounts[0]).send({ from: accounts[0], gas: 1000000 }));
    if (err != null) {
      console.log('Error setting up the auction: ', err);
      process.exit(1);
    }
  } else {
    console.log('Auction has already been setup');
  }

  console.log('Getting the current stage of the auction');
  // Get the current auction stage
  stage = await getStage();

  if (stage === STAGES.Setup) {
    console.log('Starting the auction');
    [_, err] = await awaitHandler(dutchAuction.methods.startAuction().send({ from: accounts[0], gas: 1000000 }));
    if (err != null) {
      console.log('Error starting auction: ', err);
      process.exit(1);
    }
  } else {
    console.log('The auction was already started or did not get setup correctly. Current stage:', stage);
  }

  console.log('Setup complete');
  process.exit()
}

console.log('Running setup');
setup();
