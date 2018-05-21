pragma solidity ^0.4.23;

/**
 * @title Contract for testing the ERC223 token fallback
 * @dev This just sets the values passed in on the contract state
 * It would be nice to emit an event instead, but Truffle does not currently
 * support checking internal events in tests: https://github.com/trufflesuite/truffle/issues/555
 */
contract TokenFallbackMock {
    address public from;
    uint public value;
    bytes public data;

    /**
     * @dev Set state when fallback is called
     * @param _from address The address that is transferring the tokens
     * @param _value uint the amount of the specified token
     * @param _data Bytes The data passed from the caller.
     */
    function tokenFallback(address _from, uint _value, bytes _data) external {
        from = _from;
        value = _value;
        data = _data;
    }
}