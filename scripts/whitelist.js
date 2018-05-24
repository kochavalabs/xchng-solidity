/* eslint no-unused-vars: "off", prefer-const: "off" */
const {
  getAccounts, whitelist,
} = require('./hdwallet');

async function addToWhitelist(address) {
    const accounts = await getAccounts();

    console.log('Whitelisting address', address);
    await whitelist(myArgs[0], address);

    console.log('Account Successfully whitelisted!');
    process.exit()
}

var myArgs = process.argv.slice(2);

if (myArgs.length != 1) {
  console.log('Usage: node whitelist.js [Address]');
  process.exit(1);
}

addToWhitelist(myArgs[0])