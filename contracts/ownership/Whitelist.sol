pragma solidity ^0.4.23;


import "./Ownable.sol";

/**
 * @title Whitelists
 * @dev The Whitelists contract has a whitelist of addresses for Presale and Auction, 
 * and provides basic authorization control functions.
 * @dev This simplifies the implementation of "user permissions".
 * @dev Addresses must be added, removed, or checked for a specific whitelist and they are not shared.
 */
contract Whitelist is Ownable {
    mapping(address => bool) public whitelist;
    
    event WhitelistedAddressAdded(address _addr);
    event WhitelistedAddressRemoved(address _addr);

    /**
     * @dev Throws if called by any account that's not whitelisted.
     */
    modifier isWhitelisted() {
        require(whitelist[msg.sender]);
        _;
    }

    /**
     * @dev add an address to the whitelist
     * @param _addr address
     * @return true if the address was added to the whitelist, false if the address was already in the whitelist
     */
    function addAddressToWhitelist(address _addr) onlyOwner public returns(bool success) {
        if (!whitelist[_addr]) {
            whitelist[_addr] = true;
            emit WhitelistedAddressAdded(_addr);
            success = true;
        }
    }

   /**
     * @dev add addresses to the whitelist
     * @param _addrs addresses
     * @return true if at least one address was added to the whitelist,
     * false if all addresses were already in the whitelist
     */
    function addAddressesToWhitelist(address[] _addrs) onlyOwner public returns(bool success) {
        for (uint256 i = 0; i < _addrs.length; i++) {
            if (addAddressToWhitelist(_addrs[i])) {
                success = true;
            }
        }
    }

    /**
     * @dev remove an address from the whitelist
     * @param _addr address
     * @return true if the address was removed from the whitelist,
     * false if the address wasn't in the whitelist in the first place
     */
    function removeAddressFromWhitelist(address _addr) onlyOwner public returns(bool success) {
        if (whitelist[_addr]) {
            whitelist[_addr] = false;
            emit WhitelistedAddressRemoved(_addr);
            success = true;
        }
    }

    /**
     * @dev remove addresses from the whitelist
     * @param _addrs addresses
     * @return true if at least one address was removed from the whitelist,
     * false if all addresses weren't in the whitelist in the first place
     */
    function removeAddressesFromWhitelist(address[] _addrs) onlyOwner public returns(bool success) {
        for (uint256 i = 0; i < _addrs.length; i++) {
            if (removeAddressFromWhitelist(_addrs[i])) {
                success = true;
            }
        }
    }
}