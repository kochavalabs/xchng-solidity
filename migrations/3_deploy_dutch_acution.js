var XchngToken = artifacts.require("./token/XchngToken.sol");
var DutchAuction = artifacts.require("./crowdsale/DutchAuction.sol");

module.exports = function (deployer) {
  deployer.link(XchngToken, DutchAuction);
  deployer.deploy(DutchAuction,
    '0x8ef797325f65aa636027bb13ae4abcf32f5a7ec9', // Wallet used to collect funds
    2000000000000000000,  // Price start
    174640000, // Price Constant
    3  // Price Exponent
  );
};