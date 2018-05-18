import advanceBlock from "./helpers/advanceBlock.js"
import increaseTime from "./helpers/increaseTime.js"

// Need to install chai package to easily check revert tests
// npm install --save-dev chai
require('chai').use(require('chai-as-promised')).should();

const DutchAuctionDisributor = artifacts.require("DutchAuctionDistributor");
const DutchAuction = artifacts.require("DutchAuction"); // Testing disributor with the presale
const XchngToken = artifacts.require("XchngToken"); // Requires XchngToken for presale

// accounts[0] will be the owner of XchngToken and the Presale
// The ganache test network default generates 10 accounts with 100 Ether each.
contract('DutchAuctionDistributor', async (accounts) => {
    const PREALLOCATED_SUPPLY = 5000000000000000000000000000;  // 5Billion * 10^18 XEI tokens as initial supply of XCHNG
    const NUM_TOKENS_AVAILABLE = 40000000000000000000;  // 40 * 10^18 XEI tokens as available auction supply to be able to end it with few accounts

    const PRICE_START = 2000000000000000000; // Price start for decay formula (2 Ether)
    const PRICE_CONSTANT = 174640000; // Price constant for decay formula
    const PRICE_EXPONENT = 3; // Price exponent for decay formula

    const ONE_WEEK_IN_SECONDS = 604800; // Using for setting the opening and closing time of presale

    // Constants for testing payments
    const MIN_BID = 1000000000000000000; // 1 Ether min investment
    const MIN_TOKEN_CLAIM = 500000000000000000; // 1 ETH worth of tokens at very start of auction for testing (Price of 2 ETH/XCHNG)

    // Reinitialize XchngToken before each test (Runs before each "it")
    // Use the Xchng token when creating the Presale
    // Opening time and closing time must be calculated based on the latest epoch time
    beforeEach(async function (){
        // Create the token with the Preallocated supply, with accounts[0] as owner
        this.token = await XchngToken.new(accounts[0],PREALLOCATED_SUPPLY);

        // Create the auction with the necessary parameters using accounts[0] as the wallet to hold funds
        this.auction = await DutchAuction.new(accounts[0], PRICE_START, PRICE_CONSTANT, PRICE_EXPONENT);

        // Distributor constructed with address of auction contract
        this.distributor = await DutchAuctionDisributor.new(this.auction.address);

        // Using default approval of 600 Million tokens, but this can be overwritten in individual test by calling approve before setup
        await this.token.approve(this.auction.address, NUM_TOKENS_AVAILABLE, { from: accounts[0] });
    });

    describe('constructor()', function () {
        it('should not allow zero address', async function () {
            await DutchAuctionDisributor.new(0).should.be.rejected;
        });
    });

    describe('distribute()', function () {
        // Setup and start presale with whitelisted accounts for testing
        beforeEach(async function () {
            // Params are the token address, token wallet (accounts[0])
            await this.auction.setup(this.token.address, accounts[0]);

            // Start the auction
            await this.auction.startAuction();

            // Whiteliste several accounts for testing
            await this.auction.addAddressesToWhitelist([accounts[1], accounts[2], accounts[3], accounts[4]]);
        });

        it('should distribute tokens to accounts that made bids', async function () {
            await this.auction.bid({value: MIN_BID, from: accounts[1]}).should.be.fulfilled;
            await this.auction.bid({value: MIN_BID*2, from: accounts[2]}).should.be.fulfilled;
            // await this.presale.buyPresaleTokens({value: MIN_INVESTMENT*3, from: accounts[3]}).should.be.fulfilled; // One account that didn't buy

            // Account 4 bids enough to end auction
            let missingFunds = await this.auction.missingFundsToEndAuction();
            await this.auction.bid({value: missingFunds.toNumber(), from: accounts[4] }).should.be.fulfilled;

            // Finalize auction
            await this.auction.finalizeAuction().should.be.fulfilled;

            // Advance past the waiting period (1 Week)
            await increaseTime(ONE_WEEK_IN_SECONDS + 1);

            // Now distribute to the addresses
            await this.distributor.distribute([accounts[1], accounts[2], accounts[3], accounts[4]]).should.be.fulfilled;

            // token Balance should update for the accounts that bought tokens
            let balance = await this.token.balanceOf(accounts[1]);
            assert.equal(balance.toNumber(), MIN_TOKEN_CLAIM);

            balance = await this.token.balanceOf(accounts[2]);
            assert.equal(balance.toNumber(), MIN_TOKEN_CLAIM*2);

            // account 4 had to bid enough to end auction so its balance will be the remaining tokens
            balance = await this.token.balanceOf(accounts[4]);
            assert.equal(balance.toNumber(), NUM_TOKENS_AVAILABLE-MIN_TOKEN_CLAIM*3);

            // Account 3 included in claim, but did not buy tokens so should have 0
            balance = await this.token.balanceOf(accounts[3]);
            assert.equal(balance.toNumber(), 0);
        });
    });
});