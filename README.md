# XCHNG Solidity Contracts 

This repository holds a set of solidity contracts that make up our XCHNG Token.  

Future contracts can be added to take advantage of existing implementations and tests. 

## Setting up Truffle 

[Truffle](http://truffleframework.com/docs/) is a development environment, testing framework and asset pipeline for Ethereum. 

A `truffle.js` and `truffle-config.js` will be created. You can set additional configurations for your truffle enviroment there. 

## Install Ganache 

[Ganache](http://truffleframework.com/ganache/) is a private blockchain for ethereum development. It allows you to easily deploy,tests, and debug contracts/applications. 

Install ganache by downloading the appropriate version for your OS 

or 

Install the ganache-cli through npm using `npm install -g ganache-cli`

## Setting up truffle with Metamask

Metamask is an easy to use browser extension. You can set up a private network by following [this setup guide](http://truffleframework.com/docs/advanced/truffle-with-metamask)

## Install dependencies

Dependencies are managed with `yarn`. If you do not already have `yarn` install you can run `npm install -G yarn`. 

To install the project dependencies run `yarn install` from the project root dir. 

## Compiling contracts with Truffle 

To compile the solidity contracts run `truffle compile` from the project root dir. 

The compiled artifacts will be placed under `prject_root_dir/build/contracts/`

**Note** : Truffle expects contracts to be located at `project_root_dir/contracts`

## Migrating contracts with Truffle 

To deploy/migrate contracts to a local ganache instance run `truffle migrate --network ganache` from the project root dir. 

## Running test with Truffle 

Our tests are written using [mocha](https://github.com/mochajs/mocha) and [chai](https://github.com/chaijs/chai) and assume you are using truffle to launch the tests. 

To test our smart contracts run `truffle test` from the project root dir. 

To execute a single test file run : `truffle test ./path/to/test/file.js`

**Note** : Truffle expects contract tests to be located at `project_root_dir/test`

## Solidity coverage report 

We are using [solidity-coverage](https://github.com/sc-forks/solidity-coverage) to view our test coverage. 

To generate the report run `./node_modules/.bin/solidity-coverage` from the project root dir. 








