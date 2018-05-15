pragma solidity ^0.4.23;


// ----------------------------------------------------------------------------
// Safe maths
// ----------------------------------------------------------------------------
library SafeMath {
    function add(uint _a, uint _b) internal pure returns (uint) {
        uint c = _a + _b;
        require(c >= _a);
        return c;
    }

    function sub(uint _a, uint _b) internal pure returns (uint) {
        require(_b <= _a);
        uint c = _a - _b;
        return c;
    }

    function mul(uint _a, uint _b) internal pure returns (uint) {
        uint c = _a * _b;
        require(_a == 0 || c / _a == _b);
        return c;
    }

    function div(uint _a, uint _b) internal pure returns (uint) {
        require(_b > 0);
        uint c = _a / _b;
        return c;
    }
}
