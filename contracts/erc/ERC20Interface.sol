pragma solidity ^0.4.23;


// ----------------------------------------------------------------------------
// ERC Token Standard #20 Interface
// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20-token-standard.md
// ----------------------------------------------------------------------------
contract ERC20Interface {
    /*
     * This is a slight change to the ERC20 base standard.
     * function totalSupply() constant returns (uint256 supply);
     * is replaced with:
     * uint256 public totalSupply;
     * This automatically creates a getter function for the totalSupply.
     */
    uint public totalSupply;
    function allowance(address _owner, address _spender) public view returns (uint remaining);
    function approve(address _spender, uint _value) public returns (bool success);
    function balanceOf(address _owner) public view returns (uint balance);
    function transfer(address _to, uint _value) public returns (bool success);
    function transferFrom(address _owner, address _to, uint _value) public returns (bool success);

    // ignoring the lint error for Transfer function
    event Transfer(address indexed _from, address indexed _to, uint _value);
    event Approval(address indexed _tokenOwner, address indexed _spender, uint _value);
}