pragma solidity ^0.4.23;

import "../erc/ERC20Interface.sol";
import "../erc/ERC223Interface.sol";
import "../erc/ERC223ReceivingContract.sol";
import "../lib/SafeMath.sol";


// @title StandardToken - base token contract 
contract StandardToken is ERC20Interface, ERC223Interface {
    using SafeMath for uint; // wrapper around basic math functions 

    /* 
    * Data Structures
    */
    // _KeyValue address, _Value uint
    mapping (address => uint) public balances; 
    // _KeyValue address, _Value mapping of address to uint
    mapping (address => mapping (address => uint)) private allowed;

    /*
    * Public functions
    */
    /// @dev Returns number of allowed tokens that a spender can transfer on
    /// behalf of a token owner.
    /// @param _owner Address of token owner.
    /// @param _spender Address of token spender.
    /// @return Returns remaining allowance for spender.
    function allowance(address _owner, address _spender) public view returns (uint) {
        return allowed[_owner][_spender];
    }

    /// @notice Allows `_spender` to transfer `_value` tokens from `msg.sender` to any address.
    /// @dev Sets approved amount of tokens for spender. Returns success.
    /// @param _spender Address of allowed account.
    /// @param _value Number of approved tokens.
    /// @return Returns success of function call.
    function approve(address _spender, uint _value) public returns (bool){
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    /// @dev Returns number of tokens owned by the given address.
    /// @param _owner Address of token owner.
    /// @return Returns balance of owner.
    function balanceOf(address _owner) public view returns (uint) {
        // lookup _owner in balances map and return value 
        return balances[_owner];
    }

    /// @notice Send `_value` tokens to `_to` from `msg.sender`.
    /// @dev transfer sender's tokens to a given address, return sucess. 
    /// @param _to Address of token receiver. 
    /// @param _value Number of token to transer. 
    /// @return Returns success of function call.  
    function transfer(address _to, uint _value) public returns (bool) {
        // Standard function transfer similar to ERC20 transfer with no _data .
        // Added due to backwards compatibility reasons .

        // ensure certain conditions are met
        require(_to != 0x0); 
        require(_to != address(this));
        require(balances[msg.sender] >= _value);
        
        uint codeLength;
        bytes memory empty;
        
        // The recommended way to check whether the _to is a contract or an address is 
        // to assemble the code of _to. If there is no code in _to, then this is an externally
        // owned address, otherwise it's a contract.
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            // Retrieve the size of the code on target address, this needs assembly.
            codeLength := extcodesize(_to)
        }
        
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);

        if (codeLength > 0) {
            // address was contract
            ERC223ReceivingContract receiver = ERC223ReceivingContract(_to);
            receiver.tokenFallback(msg.sender, _value, empty);
        }
        
        emit Transfer(msg.sender, _to, _value);

        return true; 
    }

    /// @notice Send `_value` tokens to `_to` from `msg.sender`.
    /// @dev transfer sender's tokens to a given address, return sucess. 
    /// @param _to Address of token receiver. 
    /// @param _value Number of token to transer. 
    /// @param _data Data to be sent to tokenFallback
    /// @return Returns success of function call.  
    function transfer(address _to, uint _value, bytes _data ) public returns (bool) {
          // ensure certain conditions are met
        require(_to != 0x0); 
        require(_to != address(this));
        require(balances[msg.sender] >= _value);

        uint codeLength;
        
        // The recommended way to check whether the _to is a contract or an address is 
        // to assemble the code of _to. If there is no code in _to, then this is an externally
        // owned address, otherwise it's a contract.
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            // Retrieve the size of the code on target address, this needs assembly.
            codeLength := extcodesize(_to)
        }

        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
          
        if (codeLength > 0) {
            // address was contract
            ERC223ReceivingContract receiver = ERC223ReceivingContract(_to);
            receiver.tokenFallback(msg.sender, _value, _data);
        }
        
        emit Transfer(msg.sender, _to, _value, _data);

        return true;
    }

    /// @notice Transfer `_value` tokens from `_from` to `_to` if `msg.sender` is allowed.
    /// @dev Allows for an approved third party to transfer tokens from one
    /// address to another. Returns success.
    /// @param _from Address from where tokens are withdrawn.
    /// @param _to Address to where tokens are sent.
    /// @param _value Number of tokens to transfer.
    /// @return Returns success of function call
    function transferFrom(address _from, address _to, uint _value) public returns (bool) {
        require(_from != 0x0);
        require(_to != 0x0);
        require(_to != address(this));
        require(balances[_from] >= _value); 
        require(allowed[_from][msg.sender] >= _value);

        balances[_to] = balances[_to].add(_value);
        balances[_from] = balances[_from].sub(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);

        emit Transfer(_from, _to, _value);

        return true;
    }
}