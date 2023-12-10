// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Structs.sol";

// Main contract interface
interface Main {

    // The neccesary functions from the Main contract
    function getFunds(address user) external view returns (uint256);
    function getCasinoFunds() external view returns (uint256);
    function modifyFunds(Structs.Payment[] memory payments, bool zero_sum) external;
}

contract Blackjack {
    // Possible game phases
    enum GamePhase { Ended, Betting, Playing }

    // Public variables
    address public owner;
    address public mainContractAddr;
    uint256 public minimumBet;
    uint8 public maxPlayers;
    uint256 public totalBets; // The sum of bets across all players
    GamePhase public phase = GamePhase.Ended;

    // Player info. structure
    struct Player {
        // Basic player data
        address addr;
        uint256 bet;
        bool hasVoted;
        bool isDealer;

        // Blackjack specific user data
        uint8[] playerCards; 
        uint8 playerTotal;
        bool hasStood;
        int256 betResult;
    }

    // Private variables
    mapping(address => Player) players;
    address[] playerAddresses;
    Main mainContract;

    // Fired on state changes in the game, sends the information
    event GameStateChanged(Player[] players, GamePhase phase);

    // Modifiers for access to functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    modifier notInPlayingPhase() {
        require(phase != GamePhase.Playing, "The game has already started");
        _;
    }

    modifier inPlayingPhase() {
        require(phase == GamePhase.Playing, "The game is not in the playing phase");
        _;
    }

    modifier onlyPlayers() {
        require(players[msg.sender].bet > 0, "You are not a participant in the current game");
        _;
    }

    constructor(uint256 _minimumBet, uint8 _maxPlayers, address _main_contract_addr) {
        owner = msg.sender;
        minimumBet = _minimumBet;
        maxPlayers = _maxPlayers;
        mainContractAddr = _main_contract_addr;
        mainContract = Main(_main_contract_addr);
        phase = GamePhase.Betting;

        // Insert the dealer player
        playerAddresses.push(address(0));
        players[address(0)].isDealer = true;
        players[address(0)].hasVoted = true;
    }

        
    // Get player information, only available at betting phase to not reveal dealer cards
    function getPlayers() external view returns (Player[] memory) {
        return getPlayersInternal();
    } 

    function getPlayersInternal() internal view returns (Player[] memory) {
        Player[] memory allPlayers = new Player[](playerAddresses.length);
        for(uint256 i = 0; i < playerAddresses.length; i++ ) {
            allPlayers[i] = players[playerAddresses[i]];
            allPlayers[i].addr = playerAddresses[i]; // also add the address of the player to the emitted object
        }
        return allPlayers;
    }

    function joinGame(uint256 bet) external notInPlayingPhase {
        require(playerAddresses.length - 1 <= maxPlayers, "The maximum number of players was reached");
        
        require(bet >= minimumBet, "You need to bet more than the minimum bet");

        require(players[msg.sender].bet == 0, "You have already entered the game");

        // Check in main contract if funds are enough
        uint256 userFunds = mainContract.getFunds(msg.sender);
        require(bet < userFunds, "You don't have enough funds");
        
        require(uint256((totalBets + bet) * 3  / 2) <= mainContract.getCasinoFunds(), "The casino can't afford your bet");

        // Register player in the game
        players[msg.sender].bet = bet;
        playerAddresses.push(msg.sender);
        totalBets += bet;

        // Set phase to betting
        phase = GamePhase.Betting;
        emit GameStateChanged(getPlayersInternal(), phase);
    }

    function voteStart() external onlyPlayers notInPlayingPhase {
        // Check if player is registered for the game and has not voted
        require(!players[msg.sender].hasVoted, "User has already voted for the start of the game");
        players[msg.sender].hasVoted = true;
        
        // Check if all played have voted, then start the game
        uint8 votedCount;
        // Skip the dealer by starting at 1
        for (uint8 i = 1; i < playerAddresses.length; i++) {
            if(players[playerAddresses[i]].hasVoted)
                votedCount++;
        }
        // Start the game if all players have voted
        if(votedCount == playerAddresses.length - 1)
            startGame();
        if(phase != GamePhase.Ended)
            emit GameStateChanged(getPlayersInternal(), phase);
    }
    
    function startGame() internal {
        // Require there is at least one non-dealer user in the game
        require(playerAddresses.length > 1, "No players have placed bets");

        // Deal two cards to each player and the dealer (the contract is the dealer)
        for (uint256 i = 0; i < 2; i++) {
            for (uint8 j = 0; j < playerAddresses.length; j++) {
                if(i == 1 && playerAddresses[j] == address(0)) // dont create second dealer card
                    continue;
                else
                    dealCard(playerAddresses[j]);
            }
        }
        phase = GamePhase.Playing;
    }

    function dealCard(address _player) internal {
        // Player receives a card
        uint8 card = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, _player, players[_player].playerCards.length))) % 52) + 1;
        players[_player].playerCards.push(card);
        calculatePlayerTotal(_player);
    }

    function calculatePlayerTotal(address _player) internal {
        uint8 total = 0;
        uint8 numAces = 0;

        // Count nominal value
        for (uint256 i = 0; i < players[_player].playerCards.length; i++) {
            uint8 cardValue = (players[_player].playerCards[i] % 13);

            if (cardValue == 1) {
                // Ace
                numAces++;
                total += 11;
            } else if (cardValue >= 10 || cardValue == 0) { // a king is zero in modulo 13
                // Face cards and 10
                total += 10;
            } else {
                total += cardValue;
            }
        }

        // Adjust for aces
        while (total > 21 && numAces > 0) {
            total -= 10;
            numAces--;
        }

        players[_player].playerTotal = total;

        // Check if player has stood or busted
        if(_player != address(0)){
            if (total >= 21) {
                // Player got 21 or busted, stand and end turn
                players[_player].hasStood = true;
                endPlayerTurn();
            } else {
                // Notify about new card
                 emit GameStateChanged(getPlayersInternal(), phase);
            }
        }
    }

    // User turn actions
    function hit() external onlyPlayers inPlayingPhase {
        // Ensure the player has not stood or busted
        require(!players[msg.sender].hasStood, "You have already stood or busted.");

        // Deal a new card to the player
        dealCard(msg.sender);
    }

    function stand() external onlyPlayers inPlayingPhase {
        // Ensure the player has not stood or busted
        require(!players[msg.sender].hasStood, "You have already stood or busted.");

        // Stand and end turn
        players[msg.sender].hasStood = true;
        endPlayerTurn();
    }
    
    function endPlayerTurn() internal {
        // Check if all players have stood or busted
        bool allPlayersDone = true;
        for (uint256 i = 1; i < playerAddresses.length; i++) {
            if (!players[playerAddresses[i]].hasStood) {
                allPlayersDone = false;
                break;
            }
        }
        
        if (allPlayersDone) {
            // Dealer's turn
            // Reveal second dealer card
            while (players[address(0)].playerTotal < 17) {
                // Deal with emiting reveal of all other cards
                dealCard(address(0));
            }

            // Determine the winner
            uint8 dealerTotal = players[address(0)].playerTotal;
            bool dealerBusted = dealerTotal > 21;
            // Initialize winnings array
            Structs.Payment[] memory winnings = new Structs.Payment[](playerAddresses.length - 1);

            // Start at 1 to skip dealer
            for (uint256 i = 1; i < playerAddresses.length; i++) {
                address playerAddr = playerAddresses[i];
                uint8 playerTotal = players[playerAddr].playerTotal;
                bool busted = playerTotal > 21;

                // si dealerBusted ganas si estás stood y no busted
                // si no dealerBusted ganas si estás stood, no busted y tienes más puntos que el dealer
                bool playerWon = !busted && (dealerBusted || dealerTotal <= playerTotal);
                bool playerBlackjack = playerTotal == 21 && players[playerAddr].playerCards.length == 2;
    
    
                // Insert into winnings array
                int256 betResult;
                if (playerBlackjack) {
                    betResult = int256(players[playerAddr].bet * 3 / 2);
                     winnings[i - 1] = Structs.Payment({
                        addr: playerAddr,
                        amount: betResult
                    });
                } else if (playerWon) {
                    betResult = int256(players[playerAddr].bet);
                    winnings[i - 1] = Structs.Payment({
                        addr: playerAddr,
                        amount: int256(players[playerAddr].bet)
                    });
                } else {
                    betResult = -int256(players[playerAddr].bet);
                    winnings[i - 1] = Structs.Payment({
                        addr: playerAddr,
                        amount:  -int256(players[playerAddr].bet)
                    });
                }
                // Set the bet result in the player object
                players[playerAddr].betResult = betResult;
            }

            // Pay out users
            mainContract.modifyFunds(winnings, false);

            // Set the phase to ended
            phase = GamePhase.Ended;

            // Emit one last event with the game results
            emit GameStateChanged(getPlayersInternal(), phase);

            // Reset game state
            resetGame();
            return;
        } else { 
            emit GameStateChanged(getPlayersInternal(), phase);
        }
    }

    function resetGame() internal {
        // Delete players from previous game
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            delete players[playerAddresses[i]];
        }
        // Clear the players array
        delete playerAddresses;
        playerAddresses = new address[](0);

        // Insert the dealer player
        playerAddresses.push(address(0));
        players[address(0)].isDealer = true;
        players[address(0)].hasVoted = true;
        
        totalBets = 0;
    }
}