pragma solidity ^0.4.23;

import "./StandardToken.sol";
import "../lib/SafeMath.sol";
import "../ownership/Ownable.sol";
import "../lifecycle/Pausable.sol";

/// @title Xchng Token 
contract XchngToken is Ownable, StandardToken, Pausable {
    using SafeMath for uint;
    /*
     *  Terminology:
     *  1 token unit = XEI
     *  1 token = XCHNG = XEI * multiplier
     *  multiplier set from token's number of decimals (i.e. 10 ** decimals)
     */

    /*
     *  Token metadata
     */
    string constant public name = "Xchng Token";
    string constant public symbol = "XCHNG";
    uint8 constant public decimals = 18;
    uint constant multiplier = 10 ** uint(decimals);

    /*
    * Events 
    */
    event Deployed(uint indexed _total_supply);
    event Burnt(address indexed _receiver, uint indexed _num, uint indexed _total_supply);

    /*
    * Public Functions 
    */
    /// @dev Contract constructor function sets dutch auction contract address
    /// and assigns all tokens to dutch auction.
    /// @param _owner_address Address of owners wallet.
    /// @param _preallocated Number of initially provided token units for preallocation (XEI).
    constructor(address _owner_address, uint _preallocated) public {
        require(_owner_address != 0x0);

        totalSupply = _preallocated;

        balances[_owner_address] = _preallocated;

        emit Transfer(0x0, _owner_address, balances[_owner_address]);

        emit Deployed(totalSupply);

        assert(totalSupply == balances[_owner_address]);

    }

    // Override the Standard functions to implement pausable
    function transfer(address _to, uint256 _value) public whenNotPaused returns (bool) {
        return super.transfer(_to, _value);
    }

    function transfer(address _to, uint _value, bytes _data ) public whenNotPaused returns (bool) {
        return super.transfer(_to, _value, _data);
    }

    function transferFrom(address _from, address _to, uint256 _value) public whenNotPaused returns (bool) {
        return super.transferFrom(_from, _to, _value);
    }

    function approve(address _spender, uint256 _value) public whenNotPaused returns (bool) {
        return super.approve(_spender, _value);
    }

    /// @notice Allows `msg.sender` to simply destroy `num` token units (XEI). This means the total
    /// token supply will decrease.
    /// @dev Allows to destroy token units (XEI).
    /// @param _num Number of token units (XEI) to burn.
    function burn(uint _num) public whenNotPaused {
        require(_num > 0);
        require(balances[msg.sender] >= _num);
        // Don't need to require num <= totalSupply since sender's balance 
        // must be less than or equal to total supply

        uint pre_balance = balances[msg.sender];

        balances[msg.sender] = balances[msg.sender].sub(_num);
        totalSupply = totalSupply.sub(_num);
        emit Burnt(msg.sender, _num, totalSupply);
        emit Transfer(msg.sender, 0x0, _num);

        assert(balances[msg.sender] == pre_balance.sub(_num));
    }
}