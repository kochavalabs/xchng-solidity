# Deploying to Testnet

Following the steps provided by Truffle to deploy to a live network.
http://truffleframework.com/tutorials/deploying-to-the-live-network

## Setting up Ethereum Client

Using [go-ethereum](https://github.com/ethereum/go-ethereum) to setup an Ethereum client connected to the [Ropsten](https://github.com/ethereum/ropsten) testnet.

Steps:
* Geth client installed on gcloud
* Client synced with the live testnet

## Configuring Truffle

Adding the following network to truffle.js

```
ropsten: {
  network_id: 3,  // ropsten network id
  host: "127.0.0.1",
  port: 8545   // Using 8545 default port in Geth client
}
```

## Deploying to the Live Network

On gcloud run the following command to deploy:

```
truffle migrate --network ropsten
```