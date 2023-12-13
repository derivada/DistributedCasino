// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Structs.sol";

/*
    Main contract for handling user founds and transfering money between them from their game results.
    The Game contracts that can call modifyFunds() are registered during the deployment phase, by the owner.
*/
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

    function isGameContract(address game_contract) external view returns (bool) {
        return gameContracts[game_contract];
    }

    // Add addresses of game contracts, can only be invoked by owner
    function addGameContract(address game_contract) external onlyOwner {
        gameContracts[game_contract] = true;
    }

    // Removes addresses of game contracts, can only be invoked by owner
    function removeGameContract(address game_contract) external onlyOwner {
        gameContracts[game_contract] = false;
    }

    // Registers the user as part of the casino
    function registerUser(address _user) internal {
        userList.push(_user);
        userFunds[_user].exists = true;
    }
    
    // Adds funds to the user account
    function addFunds() external payable {
        if(!userFunds[msg.sender].exists)
            registerUser(msg.sender);
        userFunds[msg.sender].funds = msg.value + userFunds[msg.sender].funds;
    }

    // Let's a user retrieve his funds from the casino
    function retrieveFunds(uint256 amount) external {
        require(amount <= userFunds[msg.sender].funds, "The user doesn't have anough funds");
        payable(msg.sender).transfer(amount); 
        userFunds[msg.sender].funds -= amount;
    }

    // Gets the user funds
    function getFunds(address user) external view returns (uint256) {
        return userFunds[user].funds;
    }

    // Gets the total casino funds
    function getCasinoFunds() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * Receives an array of Payment[] objects representing the payouts from the result of a game
     * If zero_sum is set to true, also ensures that the payouts equal zero, in order to not remove any money from the casino.
     * If zero_sum is set to false and the casino can lose money in the round, game contracts must previously ensure that the 
     * maximum amount to lose is smaller than the total casino funds. 
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