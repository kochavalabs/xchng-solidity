require('babel-register');
require('babel-polyfill');

module.exports = {
networks: {
    ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777" // matching any id
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
