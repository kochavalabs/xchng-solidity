const Pausable = artifacts.require("Pausable");

require('chai').use(require('chai-as-promised')).should();

// Pausable contract ...takes a list of accounts ( supply from truffle test env)
contract('Pausable', async ([owner, other]) => {
    // Reinitialize Ownable before each test
    beforeEach(async function (){
        // Call constructor from accounts[0]
        this.pausable = await Pausable.new({from: owner});
    });

    // Should start contract in unpaused state
    describe('constructor()', function () {
        it('should start unpaused', async function () {
            let paused = await this.pausable.paused();
            assert.isFalse(paused);
        });
    });

    describe('pause()', function () {
        it('should only be callable when not already paused', async function () {
            // First call to pause should be fine
            await this.pausable.pause().should.be.fulfilled;

            // Second call rejected as it should be paused now
            await this.pausable.pause().should.be.rejected;
        });

        it('should change state to paused', async function () {
            await this.pausable.pause().should.be.fulfilled;
            let paused = await this.pausable.paused();
            assert.isTrue(paused);
        });

        it('should emit Pause event', async function () {
<<<<<<< HEAD
            const { logs } =  await this.pausable.pause();
            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Pause');
=======
            await this.pausable.pause();
            
            // TODO: 
>>>>>>> test(Pausable): added test file for Pausable contract
        });
    });

    describe('unpause()', function () {
        // Start off paused for these tests
        beforeEach(async function (){
            await this.pausable.pause();
        });

        it('should only be callable when not already paused', async function () {
            // First call to unpause should be fine
            await this.pausable.unpause().should.be.fulfilled;

            // Second call rejected as it should be unpaused now
            await this.pausable.unpause().should.be.rejected;
        });

        it('should change state to unpaused', async function () {
            await this.pausable.unpause().should.be.fulfilled;
            let paused = await this.pausable.paused();
            assert.isFalse(paused);
        });

        it('should emit Unpause event', async function () {
<<<<<<< HEAD
            const { logs } = await this.pausable.unpause();
            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Unpause');
=======
            await this.pausable.unpause();
            
            // TODO: 
>>>>>>> test(Pausable): added test file for Pausable contract
        });
    });
});
