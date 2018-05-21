var XchngToken = artifacts.require("./XchngToken.sol");
var DutchAuction = artifacts.require("./DutchAuction.sol");

module.exports = function (deployer) {
  deployer.link(XchngToken, DutchAuction);
  deployer.deploy(DutchAuction,
    '0x8EF797325F65aa636027Bb13ae4aBcF32F5a7ec9', // Wallet used to collect funds
    2000000000000000000,  // Price start
    174640000, // Price Constant
    3  // Price Exponent
  );
};