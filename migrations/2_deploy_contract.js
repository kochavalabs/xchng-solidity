var XchngToken = artifacts.require("./token/XchngToken.sol");

module.exports = function (deployer) {
  deployer.deploy(XchngToken, '0x8ef797325f65aa636027bb13ae4abcf32f5a7ec9', 5000000000000000000000000000); // Owner Address, and 5 Billion * 10^18 preallocated tokens
};
