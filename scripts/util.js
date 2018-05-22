const awaitHandler = promise => promise.then(data => [data, null]).catch(err => [null, err]);

const STAGES = {
  AuctionDeployed: { enum: '0', name: 'AuctionDeployed' },
  Setup: { enum: '1', name: 'Setup' },
  AuctionStarted: { enum: '2', name: 'AuctionStarted' },
  AuctionEnded: { enum: '3', name: 'AuctionEnded' },
  TokensDistributed: { enum: '4', name: 'TokensDistributed' },
};

module.exports = { awaitHandler, STAGES };
