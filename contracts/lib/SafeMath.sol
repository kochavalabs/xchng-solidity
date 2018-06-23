pragma solidity ^0.4.23;


// ----------------------------------------------------------------------------
// Safe maths
// ----------------------------------------------------------------------------
library SafeMath {
    /**
    * @dev Adds two numbers, throws on overflow.
    */
    function add(uint _a, uint _b) internal pure returns (uint) {
        uint c = _a + _b;
        assert(c >= _a);
        return c;
    }
    
    /**
    * @dev Subtracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
    */
    function sub(uint _a, uint _b) internal pure returns (uint) {
        assert(_b <= _a);
        return _a - _b;
    }

    /**
    * @dev Multiples two numbers, throws on overflow
    */
    function mul(uint _a, uint _b) internal pure returns (uint) {
        // Gas optimization: this is cheaper than asserting 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        if (_a == 0) {
            return 0;
        }

        uint c = _a * _b;
        assert(c / _a == _b);
        return c;
    }

    /**
    * @dev Integer division of two numbers, truncating the quotient.
    */
    function div(uint _a, uint _b) internal pure returns (uint) {
        // assert(b > 0); // Solidity automatically throws when dividing by 0
        // uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold
        return _a / _b;
    }
}
