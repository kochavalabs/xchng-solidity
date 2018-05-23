import assertRevert from "./helpers/assertRevert.js"
const XchngToken = artifacts.require("XchngToken");

//Xchng Token contract ...takes a list of accounts ( supply from truffle test env)
contract('XchngToken', async ([ownerAddress,recipient,anotherAccount,approver]) => {
    // zero address for sending transactions to
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    // 5Billion * 10^18 Xti tokens as iniaitial supply
    const PREALLOCATED_SUPPLY = 5000000000000000000000000000;

    // Reinitialize XchngToken before each test ( Runs befor each test )
    beforeEach(async function (){
        // Create the token with the preallocated supply and add all the tokens to 
        // account 0 ( owner for testing )
        this.token = await XchngToken.new(ownerAddress,PREALLOCATED_SUPPLY);
    });

    // --------------
    //  XchngToken tests 
    // --------------
    describe('constructor()', function () {
        it('should require a valid owner address', async function () {
            // Revert if zero address is provided as owner
            await assertRevert(XchngToken.new(ZERO_ADDRESS, PREALLOCATED_SUPPLY));
        });
    });

    describe('burn()', function () {
        it('should revert if submitted with value 0', async function () {
            await assertRevert(this.token.burn(0));
        });

        it('should revert if value is greater than senders balance', async function () {
            let num = new web3.BigNumber(PREALLOCATED_SUPPLY);

            // Try to burn more than the supply
            await assertRevert(this.token.burn(num.add(1)));
        });

        it('should update the balance of sender', async function () {
            let num = new web3.BigNumber(PREALLOCATED_SUPPLY);
            let burnAmount = new web3.BigNumber(1000000000000000000); // Burn 1 XCHNG

            // Before burn
            let result = await this.token.totalSupply();
            assert.equal(num.toNumber(), result.toNumber());

            await this.token.burn(burnAmount);

            // After burn
            result = await this.token.totalSupply();
            assert.equal(num.sub(burnAmount).toNumber(), result.toNumber());
        });

        it('should update the totalSupply', async function () {
            let num = new web3.BigNumber(PREALLOCATED_SUPPLY);
            let burnAmount = new web3.BigNumber(1000000000000000000); // Burn 1 XCHNG

            await this.token.burn(burnAmount);
            // Owner should now have 1 less token
            let result = await this.token.balanceOf(ownerAddress);
            assert.equal(num.sub(burnAmount).toNumber(), result.toNumber());
        });

        it('should emit events', async function () {
            let num = new web3.BigNumber(PREALLOCATED_SUPPLY);
            let burnAmount = new web3.BigNumber(1000000000000000000); // Burn 1 XCHNG

            const { logs } = await this.token.burn(burnAmount);
            assert.equal(logs.length, 2);
            assert.equal(logs[0].event, 'Burnt');
            assert.equal(logs[0].args._receiver, ownerAddress);
            assert.equal(logs[0].args._num, burnAmount.toNumber());
            assert.equal(logs[0].args._total_supply, num.sub(burnAmount).toNumber());
            assert.equal(logs[1].event, 'Transfer');
            assert.equal(logs[1].args._from, ownerAddress);
            assert.equal(logs[1].args._to, ZERO_ADDRESS);
            assert.equal(logs[1].args._value, burnAmount.toNumber()); 
        });
    });

    // --------------
    //  ERC-223 tests 
    // --------------
    // Test ERC223 transfer with Data
    // Note: This is using a workaround call to test the overloaded transfer function
    // Cannot test reverts or check logs for events until Truffle fully supports overloaded functions.
    describe('ERC223 transfer()', function() {
        const to = recipient;
        const amount = 10;
        it('should transfer the requested amount to the recipient if the recipient is not the zero address', async function() {
            await this.token.contract.transfer['address,uint256,bytes'](to, amount, '', { from: ownerAddress });

            // check that the owner now has the updated balance 
            const ownerBalance = await this.token.balanceOf(ownerAddress);
            assert.equal(ownerBalance,(PREALLOCATED_SUPPLY-amount));
            // check that the recipient now has the amount transfered
            const recipientBalance = await this.token.balanceOf(to);
            assert.equal(recipientBalance, amount);
        });
    });
    
    // --------------
    //  ERC-20 tests 
    // --------------
    // Test the total supply function by callying totalSupply on the token contract and expecting the preallocated amount
    describe('totalSupply()', function () {
        it('should return the total amount of tokens', async function() {
            const totalSupply = await this.token.totalSupply();
            assert.equal(totalSupply, PREALLOCATED_SUPPLY);
        });
    });
    // Test balance of an account 
    describe('balanceOf()', function() {
        it('should return zero if account has no balance', async function() {
            const balance = await this.token.balanceOf(anotherAccount);
            assert.equal(balance, 0);
        });
        // Assume that the owners account has all the tokens allocated to it
        it('should return the balance of the account if there is a balance', async function() {
            const balance = await this.token.balanceOf(ownerAddress);
            assert.equal(balance,PREALLOCATED_SUPPLY);
        });
    });
    // Test transfer from an account to anotherAccount
    describe('transfer()', function() {
        // valid address
        describe('when the recipient is the not the zero address', function(){
            const to = recipient;
            const amount = 10;
            it('should revert if recipient is the address of the Xchng contract', async function() {
                await assertRevert(this.token.transfer(this.token.address, amount, {from: ownerAddress}))
            });
            it('should revert if the sender does not have enough of a balance', async function() {
                await assertRevert(this.token.transfer(to, amount, {from: anotherAccount}))
            });
            it('should transfer the requested amount to the recipient and emits a transfer event if the sender has enough of a balance', async function() {
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
        // Zero address 
        describe('when the recipient is the zero address', function () {
            const to = ZERO_ADDRESS;
            const amount = 10;
            it('should revert', async function() {
                await assertRevert(this.token.transfer(to, amount, {from: ownerAddress}));
                // check that the owner did not lose the transfer tokens on on a revert
                const ownerBalance = await this.token.balanceOf(ownerAddress);
                assert.equal(ownerBalance, PREALLOCATED_SUPPLY);
            });
        });
    });
    // Test approve from one account to another
    describe('approve()', function () {
        // valid address  
        describe('when the spender is not the zero address', function () {
            const spender = recipient;
            const amount  = 10;
            // no account balance, assuming "anotherAccount" has no account balance
            describe('when the sender does not have enough of a balance', function() {
                // parse the emit event sent from the approve call
                it('should emit an approval event', async function() {
                    const { logs } = await this.token.approve(spender, amount, {from: anotherAccount});
                    assert.equal(logs.length, 1);
                    assert.equal(logs[0].event, 'Approval');
                    assert.equal(logs[0].args._tokenOwner, anotherAccount);
                    assert.equal(logs[0].args._spender,spender);
                    assert(logs[0].args._value.eq(amount));
                 });
                // approve the requested amount and see if the allowance is set
                it('should approve the requested amount if not approved amount exists', async function() {
                    await this.token.approve(spender,amount, { from: anotherAccount }); 
                    const allowance = await this.token.allowance(anotherAccount,spender);
                    assert.equal(allowance, amount);
                });
                // approve the requested amount and replace any previously set amount 
                it('should approve the requested amount and replaces the previous one if an approval exists', async function() {
                    // set the first approved amount to 1
                    await this.token.approve(spender,1, {from: anotherAccount});
                    // check to make sure the first approval is set
                    const allowance1 = await this.token.allowance(anotherAccount, spender);
                    assert.equal(allowance1,1);
                    // then replace the approve with a new value 
                    await this.token.approve(spender,amount,{from: anotherAccount});
                    const allowance2 = await this.token.allowance(anotherAccount, spender);
                    assert.equal(allowance2,amount);
                });
            });
            // account balance, assuming "ownerAddress" contains an account balance
            describe('when the sender has enough of a balance', function() {
                // parse the emit event sent from the approve call
                it('should emit an approval event', async function() {
                    const { logs } = await this.token.approve(spender, amount, {from: anotherAccount});
                    assert.equal(logs.length, 1);
                    assert.equal(logs[0].event, 'Approval');
                    assert.equal(logs[0].args._tokenOwner, anotherAccount);
                    assert.equal(logs[0].args._spender,spender);
                    assert(logs[0].args._value.eq(amount));
                });
                // approve the requested amount and see if the allowance is set
                it('should approve the requested amount if not approved amount exists', async function() {
                    await this.token.approve(spender,amount, { from: anotherAccount }); 
                    const allowance = await this.token.allowance(anotherAccount,spender);
                    assert.equal(allowance, amount);
                });
                // approve the requested amount and replace any previously set amount 
                it('should approve the requested amount and replaces the previous one if an approval exists', async function() {
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
        // invalid address 
        describe('when the spender is the zero address', function () {
            const spender = ZERO_ADDRESS;
            const amount = 10;
            it('should approve the requested amount and emits an approval event', async function() {
                const { logs } = await this.token.approve(spender, amount, { from: ownerAddress });
                assert.equal(logs.length, 1);
                assert.equal(logs[0].event, 'Approval');
                assert.equal(logs[0].args._tokenOwner, ownerAddress);
                assert.equal(logs[0].args._spender,spender);
                assert(logs[0].args._value.eq(amount)); 
                const allowance = await this.token.allowance(ownerAddress, spender);
                assert.equal(allowance, amount);
            });
        });
    });
    // Test tranfers from one account to another 
    describe('transferFrom()', function() {
        const spender = recipient;
        beforeEach(async function () {
            // Give the approver a balance of 100 and approve spender for 100 before each test
            await this.token.transfer(approver, 100, { from: ownerAddress });
            await this.token.approve(spender, 100, { from: approver });
        });

        describe('when the recipient is not the zero address', function () {
            const to = anotherAccount;
            const amount = 100;

            it('should transfers the requested amount if the spender is approved and the approver has enough balance', async function () {
                await this.token.transferFrom(approver, to, amount, { from: spender });

                const senderBalance = await this.token.balanceOf(approver);
                assert.equal(senderBalance, 0);

                const recipientBalance = await this.token.balanceOf(to);
                assert.equal(recipientBalance, amount);
            });

            it('should decreases the spender allowance if the spender is approved and the approver has enough balance', async function () {
                await this.token.transferFrom(approver, to, amount, { from: spender });
                const allowance = await this.token.allowance(approver, spender);
                assert.equal(allowance, 0);
            });

            it('should emit a transfer event if the spender is approved and the approver has enough balance', async function () {
                const { logs } = await this.token.transferFrom(approver, to, amount, { from: spender });
                assert.equal(logs.length, 1);
                assert.equal(logs[0].event, 'Transfer');
                assert.equal(logs[0].args._from, approver);
                assert.equal(logs[0].args._to, to);
                assert.equal(logs[0].args._value, amount);
            });

            it('should revert if the approver does not have enough balance', async function () {
                const amount = 101;
                await assertRevert(this.token.transferFrom(approver, to, amount, { from: spender }));
            });
                
            it('should revert if the approver is the zero address', async function () {
                const amount = 100;
                await assertRevert(this.token.transferFrom(ZERO_ADDRESS, to, amount, { from: spender }));
            });

            it('should reverts if the spender does not have an approved balance', async function () {
                const amount = 100;
                // Override the spenders approved amount
                await this.token.approve(spender, 99, { from: approver });

                await assertRevert(this.token.transferFrom(approver, to, amount, { from: spender }));
            });

            it('reverts if the spender does not have an approved balance and the approver does not have enough balance', async function () {
                const amount = 101;
                await assertRevert(this.token.transferFrom(approver, to, amount, { from: spender }));
            });
        });

        describe('when the recipient is the zero address', function () {
            const amount = 100;
            const to = ZERO_ADDRESS;
            it('should revert', async function () {
                await assertRevert(this.token.transferFrom(approver, to, amount, { from: spender }));
            });
        });

        describe('when the recipient is the Xchng contract address', function () {
            const amount = 100;
            it('should revert', async function () {
                await assertRevert(this.token.transferFrom(approver, this.token.address, amount, { from: spender }));
            });
        });
    });
});
