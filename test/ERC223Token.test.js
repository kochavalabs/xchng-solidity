const XchngToken = artifacts.require("XchngToken");
const TokenFallbackMock = artifacts.require("TokenFallbackMock");

// ERC223 contract token test
contract('ERC223Token', async (accounts) => {
    // 5Billion * 10^18 Xti tokens as initial supply
    const PREALLOCATED_SUPPLY = 5000000000000000000000000000;
    const ownerAddress = accounts[0];

    // Create contract and token
    beforeEach(async function (){
        // Create the token with the preallocated supply and add all the tokens to ownerAddress
        this.token = await XchngToken.new(ownerAddress, PREALLOCATED_SUPPLY);
        this.tokenFallbackMock = await TokenFallbackMock.new();
    });

    describe('transfer()', function () {
        // Transfer to the contract address will call the token fallback
        it('should call token fallback and update mock state', async function () {
            let amount = 10;
            const to = this.tokenFallbackMock.address;

            // Transfer without data
            await this.token.transfer(to, 10);

            // Check that the mock fallback contract's state was updated
            let value = await this.tokenFallbackMock.value();
            assert.equal(value, amount);

            let from = await this.tokenFallbackMock.from();
            assert.equal(ownerAddress, from);

            // Change amount for second test
            amount = 100;

            // Workaround for overloaded function until Truffle adds support.
            // Must call contract with the function definition including parameters AND the from address included
            this.token.contract.transfer['address,uint256,bytes'](to, amount, '', { from: ownerAddress });
            // Check that the amount was updated
            value = await this.tokenFallbackMock.value();
            assert.equal(value, amount);
        });
    });
});
