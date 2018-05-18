import increaseTime from "./helpers/increaseTime.js"

// Need to install chai package to easily check revert tests
// npm install --save-dev chai
require('chai').use(require('chai-as-promised')).should();

const DutchAuction = artifacts.require("DutchAuction")
const XchngToken = artifacts.require("XchngToken"); // Requires XchngToken for auction

// accounts[0] will be the owner of XchngToken and the DutchAuction
// NOTE: With the current Price floor of 37000000000000 Wei it would take 22000 Ether minimum to end the auction
// with 600M tokens allocated. For tests requiring the auction to end for now I am using a smaller token supply.
// The ganache test network default generates 10 accounts with 100 Ether each.
contract('DutchAuction', async (accounts) => {
    const PREALLOCATED_SUPPLY = 5000000000000000000000000000;  // 5Billion * 10^18 XEI tokens as initial supply of XCHNG
    const NUM_TOKENS_AVAILABLE = 600000000000000000000000000;  // 600 Million * 10^18 XEI tokens as available auction supply

    const PRICE_START = 2000000000000000000; // Price start for decay formula (2 Ether)
    const PRICE_CONSTANT = 174640000; // Price constant for decay formula
    const PRICE_EXPONENT = 3; // Price exponent for decay formula

    const ONE_WEEK_IN_SECONDS = 604800; // Using for testing time passing during auction

    // Constants for testing payments
    const MIN_BID = 1000000000000000000; // 1 Ether min bid
    const LESS_THAN_MIN = 900000000000000000;

    // Reinitialize XchngToken before each test (Runs before each "it")
    // Use the Xchng token when creating the DutchAuction
    // Opening time and closing time must be calculated based on the latest epoch time
    beforeEach(async function (){
        // Create the token with the Preallocated supply, with accounts[0] as owner
        this.token = await XchngToken.new(accounts[0],PREALLOCATED_SUPPLY);

        // Create the auction with the necessary parameters using accounts[0] as the wallet to hold funds
        this.auction = await DutchAuction.new(accounts[0], PRICE_START, PRICE_CONSTANT, PRICE_EXPONENT);

        // Using default approval of 600 Million tokens, but this can be overwritten in individual test by calling approve before setup
        await this.token.approve(this.auction.address, NUM_TOKENS_AVAILABLE, { from: accounts[0] });
    });

    describe('constructor()', function () {
        it('should not allow zero address', async function () {
            // Create the auction with the necessary parameters using accounts[0] as the wallet to hold funds
            await DutchAuction.new(0, PRICE_START, PRICE_CONSTANT, PRICE_EXPONENT).should.be.rejected;
        });

        it('should not allow zero value for price start', async function () {
            await DutchAuction.new(accounts[0], 0, PRICE_CONSTANT, PRICE_EXPONENT).should.be.rejected;
        });

        it('should not allow zero value for price constant', async function () {
            await DutchAuction.new(accounts[0], PRICE_START, 0, PRICE_EXPONENT).should.be.rejected;
        });

        it('should not allow zero value for price exponent', async function () {
            await DutchAuction.new(accounts[0], PRICE_START, PRICE_CONSTANT, 0).should.be.rejected;
        });
    });

    describe('setup()', function () {
        it('should not allow zero token address', async function () {
            await this.auction.setup(0, accounts[0]).should.be.rejected;
        });

        it('should require a token wallet with allowance greater than zero', async function () {
            // Account 1 has not created an allowance for tokens to be transferred by auction
            await this.auction.setup(this.token.address, accounts[1]).should.be.rejected;
        });

        it('should correctly initialize variables', async function () {
            let stage = await this.auction.stage(); 
            assert.equal(0, stage); // AuctionDeployed

            let wallet = await this.auction.wallet_address();
            assert.equal(accounts[0], wallet); // Owner is wallet address

            let priceStart = await this.auction.price_start();
            assert.equal(PRICE_START, priceStart); 

            let priceConstant = await this.auction.price_constant();
            assert.equal(PRICE_CONSTANT, priceConstant);

            let priceExponent = await this.auction.price_exponent();
            assert.equal(PRICE_EXPONENT, priceExponent);
        });

        it('should only be able to be called once', async function () {
            await this.auction.setup(this.token.address, accounts[0]).should.be.fulfilled;

            await this.auction.setup(this.token.address, accounts[0]).should.be.rejected;
        });

        it('should update variables', async function () {
            await this.auction.setup(this.token.address, accounts[0]);

            let stage = await this.auction.stage(); 
            assert.equal(1, stage); // Setup

            // Auction holds mutliplier for tokens
            let multiplier = await this.auction.token_multiplier();
            let decimals = await this.token.decimals();
            assert.equal(Math.pow(10, decimals), multiplier);

            let tokenWallet = await this.auction.token_wallet();
            assert.equal(accounts[0], tokenWallet); // Owner account is the token wallet
        });
    });

    describe('price()', function () {
        it('should return the PRICE_START constant before auction starts', async function () {
            let beforePrice = await this.auction.price();
            assert.equal(beforePrice.toNumber(), PRICE_START); // beforePrice is returned as BigNumber so convert to number to compare
        });

        it('should return the calculated value during the auction', async function () {
            // Skip all stages to the start of the auction
            await this.auction.setup(this.token.address, accounts[0]);
           
            // Start the auction
            await this.auction.startAuction();

            // Tricky to pinpoint what the exact price will be depending on time that has passed (Simulate 1 week of elapsed time)
            // NOTE: Currrently comparing exact values works most of the time, but can sometimes be slighly off due to the increase time call
            let elapsed = ONE_WEEK_IN_SECONDS
            await increaseTime(elapsed);

            // uint decay_rate = elapsed ** price_exponent / price_constant;
            // return price_start * (1 + elapsed) / (1 + elapsed + decay_rate);
            let decay_rate = Math.floor(Math.pow(elapsed, PRICE_EXPONENT) / PRICE_CONSTANT);
            let calcPrice = Math.floor(PRICE_START * (elapsed + 1) / (elapsed + 1 + decay_rate));

            // Should be close to this value at least
            let actualPrice = await this.auction.price();
            assert.equal(calcPrice, actualPrice.toNumber());
        });

        it('should return 0 after the auction', async function () {
            // Overwrite the approval before setup to only auction 40 tokens (80 ETH at price Start) to end auction and check price
            await this.token.approve(this.auction.address, 40000000000000000000, { from: accounts[0] });
            await this.auction.setup(this.token.address, accounts[0]);

            // Start the auction and bid enough to end auction
            await this.auction.startAuction();
            let missingFunds = await this.auction.missingFundsToEndAuction();
            await this.auction.addAddressToWhitelist(accounts[2]);

            // console.log(missingFunds.toNumber()); // Debug print out missing funds amount

            await this.auction.bid({value: missingFunds.toNumber(), from: accounts[2] }).should.be.fulfilled;

            await this.auction.finalizeAuction();

            // Price should be 0 after auction is finalized
            let afterPrice = await this.auction.price();
            assert.equal(0, afterPrice);

            // Check after claimed tokens
            // Skip 1 week to get past the waiting period
            let elapsed = ONE_WEEK_IN_SECONDS
            await increaseTime(elapsed + 1); // Add 1 to make sure time is actually past waiting period

            await this.auction.claimTokens({ from: accounts[2] }).should.be.fulfilled;

            // Make sure the stage is tokensDistributed
            let stage = await this.auction.stage();
            assert.equal(4, stage);

            // Check that the price is 0
            afterPrice = await this.auction.price();
            assert.equal(0, afterPrice);
        });
    });

    describe('missingFundsToEndAuction()', function () {
        it('should revert before auction setup', async function () {
            await this.auction.missingFundsToEndAuction().should.be.rejected;
        });
    });

    describe('auction_received_wei()', function () {
        // Enter the Auction stage before the tests here and whitelist bidders
        beforeEach(async function () {
            // Bidders
            await this.auction.addAddressToWhitelist(accounts[2]);
            await this.auction.addAddressToWhitelist(accounts[3]);
            await this.auction.addAddressToWhitelist(accounts[4]);

            // Params are the token address, token wallet (accounts[0])
            await this.auction.setup(this.token.address, accounts[0]);
            await this.auction.startAuction();
        });

        it('should correctly report with multiple bids',async function () {
            // Bids
            await this.auction.bid({value: MIN_BID, from: accounts[2]}).should.be.fulfilled;
            await this.auction.bid({value: MIN_BID*5, from: accounts[3]}).should.be.fulfilled;
            await this.auction.bid({value: MIN_BID*20, from: accounts[4]}).should.be.fulfilled;

            let receivedWei = await this.auction.auction_received_wei();
            assert.equal(receivedWei, MIN_BID*26); // Total amount of bids made
        });
    });

    describe('bid()', function () {
        // Setup and start auction  with whitelisted accounts for testing
        beforeEach(async function () {
            // Params are the token address, token wallet (accounts[0]) and exchange rate
            await this.auction.setup(this.token.address, accounts[0]);

            // Start the auction
            await this.auction.startAuction();

            // Whitelist several accounts for testing
            await this.auction.addAddressesToWhitelist([accounts[1], accounts[2], accounts[3], accounts[4]]);
        });

        it('should be called by the fallback', async function() {
            await this.auction.sendTransaction({value: MIN_BID, from: accounts[1]}).should.be.fulfilled;

            // Check if account 1 now has a bid balance
            let bid = await this.auction.bids(accounts[1]);
            assert.equal(MIN_BID, bid.toNumber());
        });

        it('should require bid equal to or greater than 1 ETH', async function () {
            // 0 rejected
            await this.auction.bid({value: 0, from: accounts[1]}).should.be.rejected;

            // Less than min bid rejected
            await this.auction.bid({value: LESS_THAN_MIN, from: accounts[1]}).should.be.rejected;
        });

        it('should reject bids greater than funds missing to end the auction', async function () {
            // Bid 1 Wei greater than funds required to end auction
            let missingFunds = await this.auction.missingFundsToEndAuction();
            await this.auction.bid({value: missingFunds.toNumber() + 1, from: accounts[1] }).should.be.rejected;
        });

        it('should put the submitted ETH into the auction wallet address', async function () {
            // Check wallet eth balance before bids
            let balanceBeforeBids = await web3.eth.getBalance(accounts[0]);

            // Place 4 MIN_BID Bids
            await this.auction.bid({value: MIN_BID, from: accounts[1]}).should.be.fulfilled;
            await this.auction.bid({value: MIN_BID, from: accounts[2]}).should.be.fulfilled;
            await this.auction.bid({value: MIN_BID, from: accounts[3]}).should.be.fulfilled;
            await this.auction.bid({value: MIN_BID, from: accounts[4]}).should.be.fulfilled;

            // Check wallet eth balance after buys
            let balanceAfterBids = await web3.eth.getBalance(accounts[0]);

            // Balance should be increased by exact amount of buys
            assert.equal(balanceBeforeBids.toNumber()+MIN_BID*4, balanceAfterBids.toNumber());
        });
    });

    describe('finalizeAuction()', function () {
        beforeEach(async function () {
            // Overwrite the approval before setup to only auction 40 tokens (80 ETH at price Start) to easily end the auction
            await this.token.approve(this.auction.address, 40000000000000000000, { from: accounts[0] });
            await this.auction.setup(this.token.address, accounts[0]);
            
            // Start the auction
            await this.auction.startAuction();

            // Whitelist several accounts for testing
            await this.auction.addAddressesToWhitelist([accounts[6]]);
        });

        it('should not allow finalize until missing funds is less than the MIN INVESTMENT', async function () {
            // No bids yet
            await this.auction.finalizeAuction().should.be.rejected;

            // Account 6 bids "Almost" enough to end auction
            let missingFunds = await this.auction.missingFundsToEndAuction();
            await this.auction.bid({value: missingFunds.toNumber() - MIN_BID, from: accounts[6] }).should.be.fulfilled;

            // Still fail as we are right at min bid left, but need to be under to end
            await this.auction.finalizeAuction().should.be.rejected;
        });
    });

    describe('claimTokens()', function () {
        // Setup and start auction with whitelisted accounts for testing
        beforeEach(async function () {
            // Overwrite the approval before setup to only auction 40 tokens (80 ETH at price Start) to easily end the auction
            await this.token.approve(this.auction.address, 40000000000000000000, { from: accounts[0] });
            await this.auction.setup(this.token.address, accounts[0]);
            
            // Start the auction
            await this.auction.startAuction();

            // Whitelist several accounts for testing
            await this.auction.addAddressesToWhitelist([accounts[1], accounts[2], accounts[3], accounts[4], accounts[5], accounts[7]]);
        });

        it('should not allow claims until waiting period is over', async function () {
            await this.auction.bid({value: MIN_BID, from: accounts[1]}).should.be.fulfilled;
            await this.auction.bid({value: MIN_BID, from: accounts[2]}).should.be.fulfilled;

            // Auction still running, should fail
            await this.auction.claimTokens({from: accounts[1]}).should.be.rejected;
            await this.auction.claimTokens({from: accounts[2]}).should.be.rejected;

            // Account 3 bids enough to end auction
            let missingFunds = await this.auction.missingFundsToEndAuction();
            await this.auction.bid({value: missingFunds.toNumber(), from: accounts[3] }).should.be.fulfilled;

            // Finalize auction
            await this.auction.finalizeAuction().should.be.fulfilled;

            // Still can't claim as waiting period is not over
            await this.auction.claimTokens({from: accounts[1]}).should.be.rejected;
            await this.auction.claimTokens({from: accounts[2]}).should.be.rejected;
            await this.auction.claimTokens({from: accounts[3]}).should.be.rejected;

            // Advance past the waiting period (1 Week)
            await increaseTime(ONE_WEEK_IN_SECONDS + 1);

            // Now all should be able to claim
            await this.auction.claimTokens({from: accounts[1]}).should.be.fulfilled;
            await this.auction.claimTokens({from: accounts[2]}).should.be.fulfilled;
            await this.auction.claimTokens({from: accounts[3]}).should.be.fulfilled;
        });

        it('should not allow duplicate claims or claims for no bid', async function () {
            // Account 1 bids minimum
            await this.auction.bid({value: MIN_BID, from: accounts[1]}).should.be.fulfilled;

            // Account 5 bids enough to end auction
            let missingFunds = await this.auction.missingFundsToEndAuction();
            await this.auction.bid({value: missingFunds.toNumber(), from: accounts[5] }).should.be.fulfilled;

            // End auction
            await this.auction.finalizeAuction().should.be.fulfilled;
            // Advance past the waiting period (1 Week)
            await increaseTime(ONE_WEEK_IN_SECONDS + 1);

            // Account 1 can claim tokens for min bid
            await this.auction.claimTokens({from: accounts[1]}).should.be.fulfilled;
            // Check Account 1's token supply
            let tokenBalance = await this.token.balanceOf(accounts[1]);
            // Another claim for account 1 will return false and not add tokens to account
            let result = await this.auction.claimTokens({from: accounts[1]}).should.be.fulfilled;
            // TODO: Check result is false?

            let newTokenBalance = await this.token.balanceOf(accounts[1]);
            assert.equal(newTokenBalance.toNumber(), tokenBalance.toNumber());

            // Account 2 cannot claim any tokens as they had no bid
            result = await this.auction.claimTokens({from: accounts[2]}).should.be.fulfilled;

            // token Balance should be 0 after
            let balance = await this.token.balanceOf(accounts[2]);
            assert.equal(balance.toNumber(), 0);
        });
    });

    describe('proxyClaimTokens()', function () {
        // Setup and start auction with whitelisted accounts for testing
        beforeEach(async function () {
            // Overwrite the approval before setup to only auction 40 tokens (80 ETH at price Start) to easily end the auction
            await this.token.approve(this.auction.address, 40000000000000000000, { from: accounts[0] });
            await this.auction.setup(this.token.address, accounts[0]);
            
            // Start the auction
            await this.auction.startAuction();

            // Whitelist several accounts for testing
            await this.auction.addAddressesToWhitelist([accounts[7]]);
        });

        it('should not allow zero receiver address', async function () {
            // Account 7 bids enough to end auction
            let missingFunds = await this.auction.missingFundsToEndAuction();
            await this.auction.bid({value: missingFunds.toNumber(), from: accounts[7] }).should.be.fulfilled;

            // End auction
            await this.auction.finalizeAuction().should.be.fulfilled;
            // Advance past the waiting period (1 Week)
            await increaseTime(ONE_WEEK_IN_SECONDS + 1);

            // 0 account claim
            await this.auction.proxyClaimTokens(0).should.be.rejected;
        });
    });


    // ------- Inherited contract checks ------- //

    // Test adding user to whitelist features
    describe('adding users to whitelists', function () {
        // Before each of these tests add accounts to the whitelists
        beforeEach(async function () {
            await this.auction.addAddressToWhitelist(accounts[2]); // accounts[2] whitelisted for auction

            // Add multiple addresses at same time
            await this.auction.addAddressesToWhitelist([accounts[5], accounts[6]]); // accounts 5 and 6 whitelisted for auction
        });

        describe('checking whitelists', function () {
            it('should correctly report whitelisted addresses', async function () {
                // Account 2 should be auction whitelisted but account 1 is not
                let isAuthorized = await this.auction.whitelist(accounts[2]);
                assert.equal(isAuthorized, true);
                let isntAuthorized = await this.auction.whitelist(accounts[1]);
                assert.equal(isntAuthorized, false);
            });
        });

        describe('duplicate entries', function () {
            it('should ignore duplicate addresseses added to the whitelist', async function () {
                // Add an address that has already been added
                await this.auction.addAddressToWhitelist(accounts[2]);
                await this.auction.addAddressesToWhitelist([accounts[5], accounts[6]]);

                // Check that they are still authorized
                let isAuthorized = await this.auction.whitelist(accounts[2]);
                assert.equal(isAuthorized, true);
                isAuthorized = await this.auction.whitelist(accounts[6]);
                assert.equal(isAuthorized, true);
            });

            it('should ignore duplicate addresseses removed from the whitelist', async function () {
                // Remove addresses that were never added
                await this.auction.removeAddressFromWhitelist(accounts[3]);
                await this.auction.removeAddressesFromWhitelist([accounts[7], accounts[8]]);

                // Check that they are not on list 
                let isntAuthorized = await this.auction.whitelist(accounts[3]);
                assert.equal(isntAuthorized, false);
                isntAuthorized = await this.auction.whitelist(accounts[8]);
                assert.equal(isntAuthorized, false);
            });
        });

        describe('accepting auction bids', function () {
            // Enter the Auction stage before the tests here
            beforeEach(async function () {
                // Params are the token address, token wallet (accounts[0])
                await this.auction.setup(this.token.address, accounts[0]);
                await this.auction.startAuction();
            });

            it('should accept bids from whitelisted', async function () {
                await this.auction.bid({value: MIN_BID, from: accounts[2]}).should.be.fulfilled; // Bid from whitelisted account
                await this.auction.bid({value: MIN_BID, from: accounts[5]}).should.be.fulfilled; // Bid from whitelisted account
            });

            it('should reject bids from not whitelisted', async function () {
                await this.auction.bid({value: MIN_BID, from: accounts[1]}).should.be.rejected; // Bid from non-whitelisted account 
                await this.auction.bid({value: MIN_BID, from: accounts[7]}).should.be.rejected; // Bid from non-whitelisted account
            });
        });

        describe('removing from auction whitelist', function () {
            // Enter the Auction stage before the tests here
            beforeEach(async function () {
                // Params are the token address, token wallet (accounts[0])
                await this.auction.setup(this.token.address, accounts[0]);
                await this.auction.startAuction();
            });

            it('should not accept bids from single removed whitelisted', async function () {
                // Remove account 1 from the whitelist
                await this.auction.removeAddressFromWhitelist(accounts[2]);
                await this.auction.bid({value: MIN_BID, from: accounts[2]}).should.be.rejected; // Bid from removed whitelisted account
            });

            it('should not accept bids from multiple removed whitelisted', async function () {
                // Remove account 1 from the whitelist
                await this.auction.removeAddressesFromWhitelist([accounts[5],accounts[6]]);

                await this.auction.bid({value: MIN_BID, from: accounts[5]}).should.be.rejected; // Bid from removed whitelisted account
                await this.auction.bid({value: MIN_BID, from: accounts[6]}).should.be.rejected; // Bid from removed whitelisted account
            });
        });
    });

    // Owner of DutchAuction is accounts[0] which is the msg.sender when contract is created
    describe('ownership and transfer of ownership', function () {

        it('should have an owner', async function () {
            let owner = await this.auction.owner();
            assert.isTrue(owner !== 0);
        });

        it('should only allow owner to change stages', async function () {
            // Reject setup by non-owner
            await this.auction.setup(this.token.address, accounts[0], {from: accounts[1]}).should.be.rejected;
            // Allow setup from owner
            await this.auction.setup(this.token.address, accounts[0], {from: accounts[0]}).should.be.fulfilled;
            // Reject auction start from non-owner
            await this.auction.startAuction({from: accounts[1]}).should.be.rejected;
            // Allow auction start from owner
            await this.auction.startAuction({from: accounts[0]}).should.be.fulfilled;
            // TODO: Auction can only be finalized when missing funds to end auction is less than min bid
            // Reject auction finalize from non-owner
            // await this.auction.finalizeAuction({from: accounts[1]}).should.be.rejected;
            // Allow auction finalize from owner
            // await this.auction.finalizeAuction({from: accounts[0]}).should.be.fulfilled;
        });

        it('should change owner after transfer', async function () {
            let other = accounts[1];
            await this.auction.transferOwnership(other);
            let owner = await this.auction.owner();
        
            assert.isTrue(owner === other);
        });

        it('should prevent non-owners from transfering', async function () {
            const other = accounts[2];
            const owner = await this.auction.owner();
            assert.isTrue(owner !== other);

            await this.auction.transferOwnership(other, { from: other }).should.be.rejected;
        });

        it('should guard ownership against stuck state', async function () {
            let originalOwner = await this.auction.owner();
            this.auction.transferOwnership(0).should.be.rejected;
          });
    });

    describe('pausing auction', function () {
        it('should only be pausable by owner', async function () {
            // Not pausable by non-owner
            await this.auction.pause({from: accounts[1]}).should.be.rejected;

            // Pause the contract
            await this.auction.pause().should.be.fulfilled;

            // Not unpausable by non-owner
            await this.auction.unpause({from: accounts[1]}).should.be.rejected;

            // UnPause the contract
            await this.auction.unpause().should.be.fulfilled;
        });

        it('should reject duplicate calls', async function () {
            // Pause when unpaused
            await this.auction.pause().should.be.fulfilled;

            // Can't pause as contract is already paused
            await this.auction.pause().should.be.rejected;

            // Unpause when paused
            await this.auction.unpause().should.be.fulfilled;

            // Can't unpause as contract is already unpaused
            await this.auction.unpause().should.be.rejected;
        });

        it('should prevent bids when paused', async function () {
            // Move stage to auction with a whitelisted account
            await this.auction.addAddressToWhitelist(accounts[1]); // accounts[1] whitelisted for auction
            await this.auction.setup(this.token.address, accounts[0]);
            await this.auction.startAuction();
            
            // Pause the contract
            await this.auction.pause();
            // Should not allow purchase
            await this.auction.bid({value: MIN_BID, from: accounts[1]}).should.be.rejected;
            // Unpause
            await this.auction.unpause();
            // Should allow purchase now
            await this.auction.bid({value: MIN_BID, from: accounts[1]}).should.be.fulfilled;
        });
    }); 
});