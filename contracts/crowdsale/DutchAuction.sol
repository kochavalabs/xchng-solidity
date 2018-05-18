pragma solidity ^0.4.23;

import "../token/XchngToken.sol";
import "../lib/SafeMath.sol";
import "../ownership/Ownable.sol";
import "../lifecycle/Pausable.sol";
import "../ownership/Whitelist.sol";
 
/// @title Dutch auction contract - distribution of a fixed number of tokens using a dutch auctiion.
/// Addresses must be whitelisted to participate in auction
contract DutchAuction is Ownable, Pausable, Whitelist {
    using SafeMath for uint; // wrapper around basic math functions 

    /*
     *  Constants
     */
    // Minimum amount of Ether that can be sent in a bid
    uint constant public MIN_INVESTMENT = 1 ether;

    // Wait 7 days after end of auction before anyone can claim tokens
    uint constant public WAITING_PERIOD = 7 days;

    /*
     *  Storage
     */
    XchngToken public token;

    // Address where funds are collected
    address public wallet_address;

    // Address that has allowed token transfer for this auction
    address public token_wallet;

    // Price decay function parameters
    // Starting price in WEI
    uint public price_start;
    // Divisor constant; e.g. 524880000
    uint public price_constant; 
    // Divisor exponent; e.g. 3
    uint32 public price_exponent;

    // For calculating elapsed time for price
    uint public auction_start_time;
    uint public auction_end_time;
    uint public auction_start_block;

    // Hold the number of tokens that are being auctioned
    uint public num_tokens_auctioned;
    // Keep track of all Wei received in the bids
    uint public auction_received_wei;
    // Keep track of cumulative Wei funds for which the tokens have been claimed
    uint public auction_funds_claimed;

    // Multiplier for token denomination XCHNG to XEI based on the decimals of the token (i.e. 10 ** decimals)
    uint public token_multiplier; // 18 decimals

    // Wei per XCHNG
    uint public final_price;

    // Wei balance of the auction bidders to be withdrawn after the waiting period has ended
    mapping (address => uint) public bids;

    Stages public stage;
    enum Stages {
        AuctionDeployed,
        Setup,
        AuctionStarted,
        AuctionEnded,
        TokensDistributed
    }

    /*
     *  Modifiers
     */
    modifier atStage(Stages _stage) {
        require(stage == _stage);
        _;
    }

    /*
     *  Events
     */
    event Deployed(uint indexed _price_start, uint indexed _price_constant, uint32 indexed _price_exponent);
    event Setup();
    event AuctionStarted(uint indexed _start_time, uint indexed _block_number);
    event BidSubmission(address indexed _sender, uint _amount, uint _missing_funds);
    event ClaimedTokens(address indexed _recipient, uint _sent_amount);
    event AuctionEnded(uint _final_price);
    event TokensDistributed();

    /*
     *  Public functions
     */
    
    /// @dev Contract constructor function sets the starting price, divisor constant and
    /// divisor exponent for calculating the Dutch Auction price.
    /// @param _wallet_address Wallet address to which all contributed ETH will be forwarded.
    /// @param _price_start High price in WEI at which the auction starts.
    /// @param _price_constant Auction price divisor constant.
    /// @param _price_exponent Auction price divisor exponent.
    constructor(address _wallet_address, uint _price_start, uint _price_constant, uint32 _price_exponent) public {
        require(_wallet_address != 0x0);
        wallet_address = _wallet_address;

        stage = Stages.AuctionDeployed;
        changeSettings(_price_start, _price_constant, _price_exponent);
        emit Deployed(_price_start, _price_constant, _price_exponent);
    }

    /// @dev Fallback function for the contract, which calls bid() if the auction has started.
    function () public payable atStage(Stages.AuctionStarted) {
        bid();
    }

    /// @notice Set `_token_address` as the token address to be used in the presale and auction.
    /// @dev Setup function sets external contracts addresses.
    /// @param _token_address Token address.
    /// @param _token_wallet Address holding the tokens which has approved allowance to the auction.
    function setup(address _token_address, address _token_wallet) public onlyOwner whenNotPaused atStage(Stages.AuctionDeployed) {
        require(_token_address != 0x0);

        token = XchngToken(_token_address);

        // Set the number of the token multiplier for its decimals
        token_multiplier = 10 ** uint(token.decimals());

        token_wallet = _token_wallet;

        // Determine how many tokens have been allowed for the auction
        num_tokens_auctioned = token.allowance(token_wallet, this);
        require(num_tokens_auctioned > 0);

        stage = Stages.Setup;
        emit Setup();
    }

    /// @notice Set `_price_start`, `_price_constant` and `_price_exponent` as
    /// the new starting price, price divisor constant and price divisor exponent.
    /// @dev Changes auction price function parameters before auction is started.
    /// @param _price_start Updated start price.
    /// @param _price_constant Updated price divisor constant.
    /// @param _price_exponent Updated price divisor exponent.
    function changeSettings(uint _price_start, uint _price_constant, uint32 _price_exponent) internal {
        require(stage == Stages.AuctionDeployed || stage == Stages.Setup);
        require(_price_start > 0);
        require(_price_constant > 0);
        require(_price_exponent > 0);

        price_start = _price_start;
        price_constant = _price_constant;
        price_exponent = _price_exponent;
    }

    /// @notice Start the auction.
    /// @dev Starts auction and sets start_time after the presale is over.
    function startAuction() public onlyOwner whenNotPaused atStage(Stages.Setup) {
        stage = Stages.AuctionStarted;
        // solium-disable-next-line security/no-block-members
        auction_start_time = block.timestamp;
        auction_start_block = block.number;
        emit AuctionStarted(auction_start_time, auction_start_block);
    }

    /// @notice Finalize the auction - sets the final Xchng token price and changes the auction
    /// stage after no bids are allowed anymore.
    /// @dev Finalize auction and set the final XCHNG token price.
    /// @dev There must be less than the minimum bid value missing to end the auction to call this.
    /// With a price floor this means the auction must raise at least enough Ether to set a final
    /// token price at the floor value or it will not end.
    function finalizeAuction() public onlyOwner whenNotPaused atStage(Stages.AuctionStarted) {
        // Missing funds should be 0 at this point
        uint missing_funds = missingFundsToEndAuction();
        require(missing_funds < MIN_INVESTMENT);

        // Calculate the final price = WEI / XCHNG = WEI / ( XEI / token_multiplier)
        // Reminder: MAX_TOKENS_SOLD is the number of XEI (XCHNG * token_multiplier) that are auctioned
        final_price = token_multiplier.mul(auction_received_wei).div(num_tokens_auctioned);

        // solium-disable-next-line security/no-block-members
        auction_end_time = block.timestamp;
        stage = Stages.AuctionEnded;
        emit AuctionEnded(final_price);

        assert(final_price > 0);
    }

    /// --------------------------------- Auction Functions ------------------

    /// @notice Send `msg.value` WEI to the auction from the `msg.sender` account.
    /// @dev Allows to send a bid to the auction.
    function bid() public payable isWhitelisted whenNotPaused atStage(Stages.AuctionStarted) {
        require(msg.value >= MIN_INVESTMENT); // Bid must be greater than or equal to the minimum investment

        // Missing funds without the current bid value
        uint missing_funds = missingFundsToEndAuction();

        // We require bid values to be less than the funds missing to end the auction
        // at the current price.
        require(msg.value <= missing_funds);

        bids[msg.sender] = bids[msg.sender].add(msg.value);
        auction_received_wei = auction_received_wei.add(msg.value);

        emit BidSubmission(msg.sender, msg.value, missing_funds);

        // Send bid amount to wallet
        wallet_address.transfer(msg.value);
    }

    /// @notice Claim tokens for `msg.sender` after the auction has ended.
    /// @dev Claims tokens for `msg.sender` after auction. To be used if tokens can
    /// be claimed by beneficiaries, individually.
    function claimTokens() public whenNotPaused atStage(Stages.AuctionEnded) returns (bool) {
        return proxyClaimTokens(msg.sender);
    } 

    /// @notice Claim tokens for `receiver_address` after the auction has ended.
    /// @dev Claims Presale and Auction tokens for `receiver_address` after auction has ended.
    /// Requires that the address has either bids or presale balance and sets both to 0 with claim.
    /// @param _receiver_address Tokens will be assigned to this address if eligible.
    function proxyClaimTokens(address _receiver_address) public whenNotPaused atStage(Stages.AuctionEnded) returns (bool) {
        // Waiting period after the end of the auction, before anyone can claim tokens
        // Ensures enough time to check if auction was finalized correctly
        // before users start transacting tokens
        require(waitingPeriodOver());
        require(_receiver_address != 0x0);

        // This address has no bids or presale balance to claim
        if (bids[_receiver_address] == 0) {
            return false;
        }

        // Number of XEI for bid = bid_wei / XEI = bid_wei / (wei_per_XCHNG * token_multiplier)
        uint num_claimed = (token_multiplier.mul(bids[_receiver_address])).div(final_price);

        // Due to final_price floor rounding, the number of assigned tokens may be higher
        // than expected. Therefore, the number of remaining unassigned auction tokens
        // may be smaller than the number of tokens needed for the last claimTokens call
        uint auction_tokens_balance = token.allowance(token_wallet, address(this));
        if (num_claimed > auction_tokens_balance) {
            num_claimed = auction_tokens_balance;
        }

        // Update the total amount of funds for which tokens have been claimed
        auction_funds_claimed = auction_funds_claimed.add(bids[_receiver_address]);

        // Set receiver balances to 0 before assigning tokens
        bids[_receiver_address] = 0;

        emit ClaimedTokens(_receiver_address, num_claimed);

        // After the last tokens are claimed, we change the auction stage
        // Due to the above logic, rounding errors will not be an issue
        if (auction_funds_claimed == auction_received_wei) {
            stage = Stages.TokensDistributed;
            emit TokensDistributed();
        }

        // Transfer tokens from the token wallet
        require(token.transferFrom(token_wallet, _receiver_address, num_claimed));
        
        return true;
    }

    /// @notice Determine if the auction claim waiting period is over
    /// returns true if the Auction has ended and the current block time is 
    /// past the WAITING_PERIOD for this auction.
    function waitingPeriodOver() public view atStage(Stages.AuctionEnded) returns (bool){
        // solium-disable-next-line security/no-block-members
        require(block.timestamp > auction_end_time.add(WAITING_PERIOD));
        return true;
    }

    /// @notice Get the XCHNG price in WEI during the auction, at the time of
    /// calling this function. Returns `0` if auction has ended.
    /// Returns `price_start` before auction has started.
    /// @dev Calculates the current XCHNG token price in WEI.
    /// @return Returns WEI per XCHNG (token_multiplier * XEI).
    function price() public view returns (uint) {
        if (stage == Stages.AuctionEnded ||
            stage == Stages.TokensDistributed) {
            return 0;
        }
        return calcTokenPrice();
    }

    /// @notice Get the missing funds needed to end the auction,
    /// calculated at the current XCHNG price in WEI.
    /// @dev The missing funds amount necessary to end the auction at the current XCHNG price in WEI.
    /// @return Returns the missing funds amount in WEI.
    function missingFundsToEndAuction() view public returns (uint) {
        require(stage != Stages.AuctionDeployed); // Can't calculate missing funds until auction is setup

        // NUM_TOKENS_AVAILABLE = total number of XEI (XCHNG * token_multiplier) that is auctioned (600M XCHNG)
        uint required_wei_at_price = num_tokens_auctioned.mul(price()).div(token_multiplier);
        if (required_wei_at_price <= auction_received_wei) {
            return 0;
        }

        return required_wei_at_price.sub(auction_received_wei);
    }

    /*
     *  Private functions
     */

    /// @dev Calculates the token price (WEI / XCHNG) at the current timestamp
    /// during the auction; elapsed time = 0 before auction starts.
    /// Based on the provided parameters, the price does not change in the first
    /// `price_constant^(1/price_exponent)` seconds due to rounding.
    /// Rounding in `decay_rate` also produces values that increase instead of decrease
    /// in the beginning; these spikes decrease over time and are noticeable
    /// only in first hours. This should be calculated before usage.
    /// @return Returns the token price - Wei per XCHNG.
    function calcTokenPrice() view private returns (uint) {
        uint elapsed;
        if (stage == Stages.AuctionStarted) {
            // solium-disable-next-line security/no-block-members
            elapsed = block.timestamp.sub(auction_start_time);
        }

        // uint decay_rate = elapsed ** price_exponent / price_constant;
        // return price_start * (1 + elapsed) / (1 + elapsed + decay_rate);
        uint decay_rate = (elapsed ** price_exponent).div(price_constant);
        uint calcprice = price_start.mul(elapsed.add(1)).div(elapsed.add(1).add(decay_rate));

        return calcprice;
    }
}