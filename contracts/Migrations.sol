pragma solidity ^0.4.23;

contract Migrations {
    address public owner;
    uint public last_completed_migration;

    modifier restricted() {
        if (msg.sender == owner) _;
    }

    constructor() public {
        owner = msg.sender;
    }

    function setCompleted(uint _completed) public restricted {
        last_completed_migration = _completed;
    }

    function upgrade(address _new_address) public restricted {
        Migrations upgraded = Migrations(_new_address);
        upgraded.setCompleted(last_completed_migration);
    }
}
