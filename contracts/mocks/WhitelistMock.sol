pragma solidity ^0.4.23;

import "../ownership/Whitelist.sol";

contract WhitelistMock is Whitelist {
    // Should only be callable by whitelisted addresses
    function isWhitelistedFunction() isWhitelisted view external {
    }
}