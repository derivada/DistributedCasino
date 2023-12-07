// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Structs.sol";

contract Main {
    
    struct Users {
        uint256 funds;
        bool exists;
    }

    address public owner;
    mapping(address => bool) gameContracts;

    address[] public userList;
    mapping(address => Users) public userFunds;

    constructor() {
        owner = msg.sender;
    }
    
    // Access modifiers for owner and game contracts
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyGameContracts() {
        require(gameContracts[msg.sender], "Only game contracts can call this function");
        _;
    }

    // Add addresses of game contracts, can only be invoked by owner
    function addGameContract(address game_contract) external onlyOwner {
        gameContracts[game_contract] = true;
    }

    // Removes addresses of game contracts, can only be invoked by owner
    function removeGameContract(address game_contract) external onlyOwner {
        gameContracts[game_contract] = false;
    }

    // Adds the user to the list of userss
    function registerUser() external {
        userList.push(msg.sender);
        userFunds[msg.sender].exists = true;
    }
    
    // Adds funds to the user account
    function addFunds() external payable {
        userFunds[msg.sender].funds = msg.value + userFunds[msg.sender].funds;
    }


    // Let's a user retrieve his funds from the casino
    function retrieveFunds() external {
        payable(msg.sender).transfer(userFunds[msg.sender].funds); 
        userFunds[msg.sender].funds = 0;
    }

    // Gets the user funds
    function getFunds() external view returns (uint256) {
        return userFunds[msg.sender].funds;
    }

    function getCasinoFunds() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * Receives an array of Payment[] objects representing the payouts from the result of a game
     * ensures that:
     * 1. the sum of the amounts is 0, that is, no money enters or leaves the system here (fair betting)
     * 2. all users exist and have enough money in case they are losing money here
     */
    function modifyFunds(Structs.Payment[] memory payments, bool zero_sum) external onlyGameContracts {
        int256 result = 0;

        for(uint256 i = 0; i < payments.length; i++) {
            Structs.Payment memory aux = payments[i];
            if (!userFunds[aux.addr].exists)
                revert("One of the users does not exist");
            if(aux.amount >= 0 ){
                userFunds[aux.addr].funds += uint256(aux.amount);
            } else {
                require((int256(userFunds[aux.addr].funds) - aux.amount) >= 0, 
                    "One of the users has insuficient funds");
                userFunds[aux.addr].funds -= uint256(-aux.amount);
            }
            result += aux.amount;
        }
        
        if (result != 0 && zero_sum)
            revert("Unconsistent payments with 0-sum game policy (sum of payouts was not 0)");
    }
    
}   