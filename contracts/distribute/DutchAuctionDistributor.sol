pragma solidity ^0.4.23;

import "../crowdsale/DutchAuction.sol";

/// @title Distributor contract - distribution of tokens after an auction has ended.
contract DutchAuctionDistributor { 
    /* 
     * Storage
     */

    DutchAuction public auction;

    /*
     * Events
     */

    event Deployed();

    /*
     * Public functions
     */
    /// @dev Contract constructor function, sets the auction contract address.
    /// @param _auction_address Address of auction contract.
    constructor(address _auction_address) public {
        require(_auction_address != 0x0); 

        auction = DutchAuction(_auction_address);
        emit Deployed();
    }

    /// @notice Claim tokens in behalf of the following token owners: `addresses`.
    /// @dev Function that is called with an array of addresses for claiming tokens in their behalf.
    /// @param _addresses Addresses of auction bidders that will be assigned tokens.
    function distribute(address[] _addresses) public {
        for (uint32 i = 0; i < _addresses.length; i++) {
            if (auction.bids(_addresses[i]) > 0) {
                auction.proxyClaimTokens(_addresses[i]);
            }
        }
    }
}