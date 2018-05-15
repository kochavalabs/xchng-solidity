import assertRevert from "./helpers/assertRevert.js"
const XchngToken = artifacts.require("XchngToken");

//Xchng Token contract ...takes a list of accounts ( supply from truffle test env)
contract('XchngToken', async (accounts) => {
    // zero address for sending transactions to
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    // 5Billion * 10^18 Xti tokens as iniaitial supply
    const PREALLOCATED_SUPPLY = 5000000000000000000000000000;
    // Set of user accounts to send tokens to / from 
    const ownerAddress = accounts[0];
    const recipient = accounts[1];
    const anotherAccount = accounts[2];

    // Reinitialize XchngToken before each test ( Runs befor each "it" )
    beforeEach(async function (){
        // Create the token with the preallocated supply and add all the tokens to 
        // account 0 ( owner for testing )
        this.token = await XchngToken.new(ownerAddress,PREALLOCATED_SUPPLY);
    });
    
    // --------------
    //  ERC-20 tests 
    // --------------
    // Test the total supply function by callying totalSupply on the token contract and expecting the preallocated amount
    describe('totalSupply()', function () {
        it('returns the total amount of tokens', async function() {
            const totalSupply = await this.token.totalSupply();
            assert.equal(totalSupply, PREALLOCATED_SUPPLY);
        });
    });
    // Test balance of an account 
    describe('balanceOf()', function() {
        describe('when the requested account has no tokens ', function() {
            it('returns zero', async function() {
                const balance = await this.token.balanceOf(anotherAccount);
                assert.equal(balance, 0);
            });
        });
        // Assume that the owners account has all the tokens allocated to it
        describe('when the requested account has tokens ', function() {
            it('returns the balance of the account', async function() {
                const balance = await this.token.balanceOf(ownerAddress);
                assert.equal(balance,PREALLOCATED_SUPPLY);
            });
        });
    });
    // Test transfer from an account to anotherAccount
    describe('transfer()', function() {
        // valid address
        describe('when the recipient is the not the zero address', function(){
            const to = recipient;
            const amount = 10;
            describe('when the sender does not have enough of a balance', function() {
                it('reverts', async function() {
                    await assertRevert(this.token.transfer(to, amount, {from: anotherAccount}))
                });
            });
            // Assume that the owner has the PREALLOCATED_SUPPLY
            describe('when the sender does have enough of a balance', function() {
                const to = recipient;
                const amount = 10; 
                it('transfers the requested amount from the sender to the recipient and emits a transfer event', async function() {
                    const { logs } =  await this.token.transfer(to, amount, {from:ownerAddress});
                    // check that we have an event from our transfer call
                    assert.equal(logs.length, 1);
                    assert.equal(logs[0].event, 'Transfer');
                    assert.equal(logs[0].args._from, ownerAddress);
                    assert.equal(logs[0].args._to, to);
                    assert(logs[0].args._value.eq(amount)); 
                    // check that the owner now has the updated balance 
                    const ownerBalance = await this.token.balanceOf(ownerAddress);
                    assert.equal(ownerBalance,(PREALLOCATED_SUPPLY-amount));
                    // check that the recipient now has the amount transfered
                    const recipientBalance = await this.token.balanceOf(to);
                    assert.equal(recipientBalance, amount);
                });
            });
        });
        // Zero address 
        describe('when the recipient is the zero address', function () {
            const to = ZERO_ADDRESS;
            const amount = 10;
            it('reverts', async function() {
                await assertRevert(this.token.transfer(to, amount, {from: ownerAddress}));
                // check that the owner did not lose the transfer tokens on on a revert
                const ownerBalance = await this.token.balanceOf(ownerAddress);
                assert.equal(ownerBalance, PREALLOCATED_SUPPLY);
            });
        });
    });
    // Test approve from one account to another
    describe('approve()', function () {
        const spender = recipient;
        const amount  = 10;
        // valid address  
        describe('when the spender is not the zero address', function () {
            describe('when the sender does not have enough of a balance', function() {
                it('emits an approval event', async function() {
                    const { logs } = await this.token.approve(spender, amount, {from: anotherAccount});
                    assert.equal(logs.length, 1);
                    assert.equal(logs[0].event, 'Approval');
                    assert.equal(logs[0].args._tokenOwner, anotherAccount);
                    assert.equal(logs[0].args._spender,spender);
                    assert(logs[0].args._value.eq(amount));
                });
            });
            describe('when there was no approved amount before', function() {
                it('approves the requested amount', async function() {
                    await this.token.approve(spender,amount, { from: ownerAddress }); 
                    const allowance = await this.token.allowance(ownerAddress,spender);
                    assert.equal(allowance, amount);
                });
            });
            describe('when the spender had an approved amount', function() {
                it('approves the requested amount and replaces the previous one', async function() {
                    // set the first approved amount to 1
                    await this.token.approve(spender,1, {from: ownerAddress});
                    // check to make sure the first approval is set
                    const allowance1 = await this.token.allowance(ownerAddress, spender);
                    assert.equal(allowance1,1);
                    // then replace the approve with a new value 
                    await this.token.approve(spender,amount,{from: ownerAddress});
                    const allowance2 = await this.token.allowance(ownerAddress, spender);
                    assert.equal(allowance2,amount);
                });
            });
        });
        describe('when the spender is the zero address', function () {
            const spender = ZERO_ADDRESS;
            const amount = 10;
        });

    });
});
