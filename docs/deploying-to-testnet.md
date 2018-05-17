# Deploying to Testnet

Following the steps provided by Truffle to deploy to a live network.
http://truffleframework.com/tutorials/deploying-to-the-live-network

## Setting up Ethereum Client

Using [go-ethereum](https://github.com/ethereum/go-ethereum) to setup an Ethereum client connected to the [Ropsten](https://github.com/ethereum/ropsten) testnet.

Install Geth for testnet

```
geth --testnet
```

Sync geth client with network

```
geth --testnet --fast --bootnodes "enode://20c9ad97c081d63397d7b685a412227a40e23c8bdc6688c6f37e97cfbc22d2b4d1db1510d8f61e6a8866ad7f0e17c02b14182d37ea7c3c8b9c2683aeb6b733a1@52.169.14.227:30303,enode://6ce05930c72abc632c58e2e4324f7c7ea478cec0ed4fa2528982cf34483094e9cbc9216e7aa349691242576d552a2a56aaeae426c5303ded677ce455ba1acd9d@13.84.180.240:30303"
```

Then, unlock that geth account with the following commands:

```
geth attach http://127.0.0.1:8545
``

personal.unlockAccount(eth.accounts[0])

## Configuring Truffle

Updating the truffle.js file to setup the Ropsten network configuration.

This uses the [HD Wallet Provider](https://github.com/trufflesuite/truffle-hdwallet-provider) to set the provider with the mnemonic and address set as environment variables.

```
const HDWalletProvider = require("truffle-hdwallet-provider");

const mnemonic = process.env.MNEMONIC;
const node = process.env.NODE_ADDR;

module.exports = {
  networks: {
    ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777"
    },
    ropsten: {
      provider: function () {
        return new HDWalletProvider(mnemonic, node)
      },
      network_id: 3,
      gas: 4700000
    }
  }
};
```

## Deploying to the Live Network

Run the following command to deploy:

```
truffle migrate --network ropsten
```