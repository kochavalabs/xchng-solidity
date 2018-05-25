/* eslint no-unused-vars: "off", prefer-const: "off" */
const { awaitHandler } = require('./util');
const {
  getAccounts, whitelist, dutchAuction,
} = require('./hdwallet');

async function addToWhitelist(address) {
  // Check if address needs to be whitelisted
  let err;
  let iswhitelisted;
  [iswhitelisted, err] = await awaitHandler(dutchAuction.methods.whitelist(address).call());
  if (err != null) {
    console.log('Error checking whitelist: ', err);
    process.exit(1);
  }

  if (iswhitelisted) {
    console.log('Address is already whitelisted');
    process.exit()
  }

  const accounts = await getAccounts();

  console.log('Whitelisting address', address);
  await whitelist(address, accounts[0]);

  console.log('Account Successfully whitelisted');
  process.exit()
}

var myArgs = process.argv.slice(2);

if (myArgs.length != 1) {
  console.log('Usage: node whitelist.js [Address]');
  process.exit(1);
}

addToWhitelist(myArgs[0])