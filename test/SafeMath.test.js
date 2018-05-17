const SafeMathMock = artifacts.require("SafeMathMock");

require('chai').use(require('chai-as-promised')).should();

// Max Uint256 stored as BigNumber to test overflow operations
const MAX_UINT_256 = new web3.BigNumber(2).pow(256).sub(1);

// SafeMath library being tested
contract('SafeMath', async () => {

    // Initialize SafeMath contract once
    before(async function () {
        this.SafeMath = await SafeMathMock.new();
    });

    describe('add()', function () {
        it('should return added values', async function () {
            let result = await this.SafeMath.add(15, 10);
            assert.equal(result, 25);
        });

        it('should prevent overflow', async function () {
            await this.SafeMath.add(MAX_UINT_256, 1).should.be.rejected;
            await this.SafeMath.add(1, MAX_UINT_256).should.be.rejected;
        });
    });

    describe('sub()', function () {
        it('should return subtracted values', async function () {
            let result = await this.SafeMath.sub(15, 10);
            assert.equal(result, 5);
        });

        it('should prevent underflow', async function () {
            // Second param must be smaller than first param
            await this.SafeMath.sub(0, 1).should.be.rejected;
        });
    });

    describe('mul()', function () {
        it('should return multiplied values', async function () {
            let result = await this.SafeMath.mul(15, 10);
            assert.equal(result, 150);
        });

        it('should prevent overflow', async function () {
            await this.SafeMath.mul(MAX_UINT_256, 2).should.be.rejected;
        });

        it('should correctly multiply by zero', async function () {
            let result = await this.SafeMath.mul(15, 0);
            assert.equal(result, 0);

            result = await this.SafeMath.mul(0, 10);
            assert.equal(result, 0);
        });
    });

    describe('div()', function () {
        it('should return divided values (with floor rounding)', async function () {
            let result = await this.SafeMath.div(15, 10);
            assert.equal(result, 1);

            result = await this.SafeMath.div(15, 8);
            assert.equal(result, 1);

            result = await this.SafeMath.div(15, 7);
            assert.equal(result, 2);

            result = await this.SafeMath.div(0, 10);
            assert.equal(result, 0);
        });

        it('should prevent divide by zero', async function () {
            await this.SafeMath.div(15, 0).should.be.rejected;
        });
    });
});
