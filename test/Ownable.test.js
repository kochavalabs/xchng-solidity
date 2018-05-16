const Ownable = artifacts.require("Ownable");

require('chai').use(require('chai-as-promised')).should();

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Owneable contract ...takes a list of accounts ( supply from truffle test env)
contract('Ownable', async ([owner, other]) => {
    // Reinitialize Ownable before each test
    beforeEach(async function (){
        // Call constructor from accounts[0]
        this.ownable = await Ownable.new({from: owner});
    });

    // Test that owner was set on construction
    describe('constructor()', function () {
        it('should set msg.sender as the owner', async function () {
            let checkedOwner = await this.ownable.owner();
            assert.equal(checkedOwner, owner);
        });
    });

    describe('transferOwnership()', function () {
        it('should only be callable by owner', async function () {
            // Other can't transfer ownership
            await this.ownable.transferOwnership(other, {from: other}).should.be.rejected;
            // Make sure owner is still owner
            let checkedOwner = await this.ownable.owner();
            assert.equal(checkedOwner, owner);
        });

        it('should not allow transfer to zero address', async function (){
            await this.ownable.transferOwnership(ZERO_ADDRESS, {from: owner}).should.be.rejected;
            // Make sure owner is still owner
            let checkedOwner = await this.ownable.owner();
            assert.equal(checkedOwner, owner);
        });

        it('should change owner after transfer', async function () {
            // Other can't transfer ownership
            await this.ownable.transferOwnership(other, {from: owner}).should.be.fulfilled;
            // Make sure other is new owner
            let checkedOwner = await this.ownable.owner();
            assert.equal(checkedOwner, other);
        });
    });
});
