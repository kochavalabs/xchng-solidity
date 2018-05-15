var XchngToken = artifacts.require("./token/XchngToken.sol");

module.exports = function (deployer) {
  deployer.deploy(XchngToken, 0xbEb76878E0910348eEf77308A7C567bdF417A8C6, 5000000000000000000000000000); // Owner Address, and 5 Billion * 10^18 preallocated tokens
};
