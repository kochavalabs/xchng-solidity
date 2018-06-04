/* eslint no-unused-vars: "off", prefer-const: "off" */
const { awaitHandler } = require('./util')
const {
  dutchAuction,
} = require('./hdwallet')

async function pricecheck() {
  console.log('Checking price')

  // Check the price Wei per XT of the dutch auction
  let price
  [price, err] = await awaitHandler(dutchAuction.methods.price().call())
  if (err != null) {
    console.log('Error checking price: ', err)
    process.exit(1)
  }

  console.log('Current Price (Wei per XCHNG):', price)

  console.log('Checking missing funds')

  let missing
  [missing, err] = await awaitHandler(dutchAuction.methods.missingFundsToEndAuction().call())
  if (err != null) {
    console.log('Error checking missing funds: ', err)
    process.exit(1)
  }

  console.log('Missing Funds To End Auction (Wei):', missing)

  process.exit()
}

pricecheck()