require('babel-register');
require('babel-polyfill');

const HDWalletProvider = require("truffle-hdwallet-provider");

const mnemonic = process.env.MNEMONIC;
const node = process.env.NODE_ADDR;

module.exports = {
networks: {
    ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777" // matching any id
    },
    ropsten: {
      provider: function () {
        return new HDWalletProvider(mnemonic, node)
      },
      network_id: 3,
      gas: 4700000
    },
    coverage: {
      host: "127.0.0.1",
      port: 8555,
      network_id: "*", // matching any id
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
  }
};
