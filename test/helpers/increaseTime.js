// reuseable function used to increase the ganache time
// Makes 2 calls to the development blockchain to increase the time and mine the next block.
export default function increaseTime (duration) {
    const id = Date.now();

    // evm_increaseTime is a ganache command to increase time that takes a duration
    // evm_mine forces a block to be mined and takes no parameters
    // https://github.com/trufflesuite/ganache-cli#usage
    return new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [duration],
        id: id,
      }, err1 => {
        if (err1) return reject(err1);
  
        web3.currentProvider.sendAsync({
          jsonrpc: '2.0',
          method: 'evm_mine',
          id: id + 1,
        }, (err2, res) => {
          return err2 ? reject(err2) : resolve(res);
        });
      });
    });
}