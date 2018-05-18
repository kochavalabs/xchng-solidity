const WhitelistMock = artifacts.require("WhitelistMock");

require('chai').use(require('chai-as-promised')).should();

// Whitelist contract being tested
contract('Whitelist', async ([owner, other, other2]) => {
    // Reinitialize Whitelist before each test
    beforeEach(async function (){
        // Call constructor from accounts[0]
        this.whitelist = await WhitelistMock.new({from: owner});
    });

    // Test adding user to whitelist features
    describe('addAddressToWhitelist()', function () {
        it('should only be callable by owner', async function () {
            // Other can't add to whitelist
            await this.whitelist.addAddressToWhitelist(other, {from: other}).should.be.rejected;
            // Make sure other is not whitelisted
            let isWhitelisted = await this.whitelist.whitelist(other);
            assert.equal(isWhitelisted, false);
        });

        it('should add an address to the whitelist and emit event', async function () {
            const { logs } = await this.whitelist.addAddressToWhitelist(other, {from: owner}).should.be.fulfilled;
            // Make sure other is now whitelisted
            let isWhitelisted = await this.whitelist.whitelist(other);
            assert.equal(isWhitelisted, true);

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'WhitelistedAddressAdded');
            assert.equal(logs[0].args._addr, other);
        });

        it('should not add an address already added to whitelist', async function () {
            // First add other to the whitelist
            await this.whitelist.addAddressToWhitelist(other, {from: owner});

            // Second add should not emit an event, but other should still be whitelisted
            const { logs } = await this.whitelist.addAddressToWhitelist(other, {from: owner});
            let isWhitelisted = await this.whitelist.whitelist(other);
            assert.equal(isWhitelisted, true);
            assert.equal(logs.length, 0);
        });

        it('should allow whitelisted address to call is whitelisted function', async function () {
            await this.whitelist.addAddressToWhitelist(other, {from: owner});
            await this.whitelist.isWhitelistedFunction({from: other}).should.be.fulfilled;
        });
    });

    describe('addAddressesToWhitelist()', function () {
        it('should only be callable by owner', async function () {
            // Other can't add to whitelist
            await this.whitelist.addAddressesToWhitelist([other, other2], {from: other}).should.be.rejected;
            // Make sure others are not whitelisted
            let isWhitelisted = await this.whitelist.whitelist(other);
            assert.equal(isWhitelisted, false);
            isWhitelisted = await this.whitelist.whitelist(other2);
            assert.equal(isWhitelisted, false);
        });

        it('should add addresses to the whitelist and emit events', async function () {
            const { logs } = await this.whitelist.addAddressesToWhitelist([other, other2], {from: owner}).should.be.fulfilled;
            // Make sure others are now whitelisted
            let isWhitelisted = await this.whitelist.whitelist(other);
            assert.equal(isWhitelisted, true);
            isWhitelisted = await this.whitelist.whitelist(other2);
            assert.equal(isWhitelisted, true);

            assert.equal(logs.length, 2);
            assert.equal(logs[0].event, 'WhitelistedAddressAdded');
            assert.equal(logs[0].args._addr, other);
            assert.equal(logs[1].event, 'WhitelistedAddressAdded');
            assert.equal(logs[1].args._addr, other2);
        });

        it('should not add addresses already added to whitelist', async function () {
            // First add other to the whitelist
            await this.whitelist.addAddressToWhitelist(other, {from: owner});

            // Second add should only emit an event for other2 as other was already whitelisted
            const { logs } = await this.whitelist.addAddressesToWhitelist([other, other2], {from: owner});
            let isWhitelisted = await this.whitelist.whitelist(other2);
            assert.equal(isWhitelisted, true);
            
            // Only 1 event emitted
            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'WhitelistedAddressAdded');
            assert.equal(logs[0].args._addr, other2);
        });
    });

    describe('removeAddressFromWhitelist()', function () {
        beforeEach(async function (){
            // Add address to whitelist for these tests
            await this.whitelist.addAddressToWhitelist(other, {from: owner}).should.be.fulfilled;
        });


        it('should only be callable by owner', async function () {
            // Other can't remove from whitelist
            await this.whitelist.removeAddressFromWhitelist(other, {from: other}).should.be.rejected;
            // Make sure other is still whitelisted
            let isWhitelisted = await this.whitelist.whitelist(other);
            assert.equal(isWhitelisted, true);
        });

        it('should add an address to the whitelist and emit event', async function () {
            const { logs } = await this.whitelist.removeAddressFromWhitelist(other, {from: owner}).should.be.fulfilled;
            // Make sure other is not whitelisted
            let isWhitelisted = await this.whitelist.whitelist(other);
            assert.equal(isWhitelisted, false);

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'WhitelistedAddressRemoved');
            assert.equal(logs[0].args._addr, other);
        });

        it('should not remove an address already removed from whitelist', async function () {
            // First remove other to the whitelist
            await this.whitelist.removeAddressFromWhitelist(other, {from: owner});

            // Second add should not emit an event, but other should still be whitelisted
            const { logs } = await this.whitelist.removeAddressFromWhitelist(other, {from: owner});
            let isWhitelisted = await this.whitelist.whitelist(other);
            assert.equal(isWhitelisted, false);
            assert.equal(logs.length, 0);
        });

        it('should not allow removed whitelisted address to call is whitelisted function', async function () {
            await this.whitelist.removeAddressFromWhitelist(other, {from: owner});
            await this.whitelist.isWhitelistedFunction({from: other}).should.be.rejected;
        });
    });

    describe('removeAddressesToWhitelist()', function () {
        beforeEach(async function (){
            // Add address to whitelist for these tests
            await this.whitelist.addAddressesToWhitelist([other, other2], {from: owner}).should.be.fulfilled;
        });

        it('should only be callable by owner', async function () {
            // Other can't add to whitelist
            await this.whitelist.removeAddressesFromWhitelist([other, other2], {from: other}).should.be.rejected;
            // Make sure others are still whitelisted
            let isWhitelisted = await this.whitelist.whitelist(other);
            assert.equal(isWhitelisted, true);
            isWhitelisted = await this.whitelist.whitelist(other2);
            assert.equal(isWhitelisted, true);
        });

        it('should remove addresses from the whitelist and emit events', async function () {
            const { logs } = await this.whitelist.removeAddressesFromWhitelist([other, other2], {from: owner}).should.be.fulfilled;
            // Make sure others are now whitelisted
            let isWhitelisted = await this.whitelist.whitelist(other);
            assert.equal(isWhitelisted, false);
            isWhitelisted = await this.whitelist.whitelist(other2);
            assert.equal(isWhitelisted, false);

            assert.equal(logs.length, 2);
            assert.equal(logs[0].event, 'WhitelistedAddressRemoved');
            assert.equal(logs[0].args._addr, other);
            assert.equal(logs[1].event, 'WhitelistedAddressRemoved');
            assert.equal(logs[1].args._addr, other2);
        });

        it('should not remove addresses already removed from whitelist', async function () {
            // First remove other to the whitelist
            await this.whitelist.removeAddressFromWhitelist(other, {from: owner});

            // Second remove should only emit an event for other2 as other was already removed from whitelisted
            const { logs } = await this.whitelist.removeAddressesFromWhitelist([other, other2], {from: owner});
            let isWhitelisted = await this.whitelist.whitelist(other2);
            assert.equal(isWhitelisted, false);
            
            // Only 1 event emitted
            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'WhitelistedAddressRemoved');
            assert.equal(logs[0].args._addr, other2);
        });
    });
});