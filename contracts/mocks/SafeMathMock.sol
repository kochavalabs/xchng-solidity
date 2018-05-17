pragma solidity ^0.4.23;

import "../lib/SafeMath.sol";

contract SafeMathMock {

    function add(uint _a, uint _b) public pure returns (uint) {
        return SafeMath.add(_a, _b);
    }

    function sub(uint _a, uint _b) public pure returns (uint) {
        return SafeMath.sub(_a, _b);
    }

    function mul(uint _a, uint _b) public pure returns (uint) {
        return SafeMath.mul(_a, _b);
    }

    function div(uint _a, uint _b) public pure returns (uint) {
        return SafeMath.div(_a, _b);
    }
}