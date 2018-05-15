pragma solidity ^0.4.23;


// ----------------------------------------------------------------------------
// ERC Token Standard #223 Interface
// https://github.com/ethereum/EIPs/issues/223
// ----------------------------------------------------------------------------
contract ERC223Interface {
    function transfer(address _to, uint _value, bytes _data) public returns (bool success);

    // ignoring the lint error for Transfer function
    event Transfer(address indexed _from, address indexed _to, uint _value, bytes _data);
}