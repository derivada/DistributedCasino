// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Structs.sol";

// Main contract interface
interface Main {

    // The neccesary functions from the Main contract
    function getFunds() external view returns (uint256);
    function getCasinoFunds() external view returns (uint256);
    function modifyFunds(Structs.Payment[] memory payments, bool zero_sum) external;
}

contract Blackjack {
    address public owner;
    Main mainContract;
    uint256 public minimumBet;
    uint8 public maxPlayers;
    uint256 public totalBets; // The sum of bets across all players

    // Possible game phases
    enum GamePhase { Betting, Playing }
    
    // Player info. structure
    struct Player {
        // Basic player data
        uint256 bet;
        bool hasVoted;
        bool isDealer;

        // Blackjack specific user data
        uint8[] playerCards; 
        uint8 playerTotal;
        bool hasStood;
    }

    // Mapping with players and list of them
    mapping(address => Player) public players;
    address[] public playerAddresses;

    // Phase of the game
    GamePhase public phase;
    
    // A player joined this game
    event PlayerJoined(address indexed player, uint256 amount);
    
    // A card was dealt to a player
    event CardDealt(address indexed player, uint8 card);

    // A player has stood
    event PlayerStood(address indexed player, uint8 total);

    // What was the result of the player
    event GameResult(address indexed player, bool hasWon, bool hasBlackjack);


    // Modifiers for access to functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    modifier inBettingPhase() {
        require(phase == GamePhase.Betting, "The game is not in the betting phase");
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


    constructor(uint256 _minimumBet, uint8 _maxPlayers, address main_contract_addr) {
        owner = msg.sender;
        minimumBet = _minimumBet;
        maxPlayers = _maxPlayers;
        mainContract = Main(main_contract_addr);
        phase = GamePhase.Betting;

        // Insert the dealer player
        playerAddresses.push(address(0));
        players[address(0)].isDealer = true;
        players[address(0)].hasVoted = true;
    }

    function joinGame(uint256 bet) external inBettingPhase {
        require(playerAddresses.length - 1 >= maxPlayers, "The maximum number of players was reached");
        
        require(bet >= minimumBet, "You need to bet more than the minimum bet");

        require(totalBets + bet <= mainContract.getCasinoFunds(), "The casino can't afford your bet");

        // Check in main contract if funds are enough
        uint256 userFunds = mainContract.getFunds();
        require(userFunds < bet, "You don't have enough funds");
        
        // Check if user has already betted
        require(players[msg.sender].bet == 0, "You've already placed a bet");

        // Register player in the game
        players[msg.sender].bet = bet;
        playerAddresses.push(msg.sender);
        totalBets += bet;

        // Emit bet placed event
        emit PlayerJoined(msg.sender, bet);
    }

    function voteStart() external onlyPlayers inBettingPhase {
        // Check if player is registered for the game and has not voted
        require(players[msg.sender].bet == 0, "User is not registered");
        require(players[msg.sender].hasVoted, "User has already voted for the start of the game");
        
        // Check if all played have voted, then start the game
        bool allVoted = true;
        // Skip the dealer by starting at 1
        for (uint8 i = 1; i < playerAddresses.length; i++) {
            if(!players[playerAddresses[i]].hasVoted) {
                allVoted = false;
                break;
            }
        }

        // Start the game
        if(allVoted)
            startGame();
    }
    
    function startGame() internal inBettingPhase {
        // Require there is at least one non-dealer user in the game
        require(playerAddresses.length > 1, "No players have placed bets");

        // Deal two cards to each player and the dealer (the contract is the dealer)
        for (uint256 i = 0; i < 2; i++) {
            for (uint8 j = 0; j < playerAddresses.length; j++) {
                if(i == 1 && playerAddresses[j] == address(0)) // dont emit second dealer card
                    dealCard(playerAddresses[j], false);
                else
                    dealCard(playerAddresses[j], true);
            }
        }

        phase = GamePhase.Playing;
    }

    function dealCard(address _player, bool emitCard) internal {
        // Player receives a card
        uint8 card = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, _player, players[_player].playerCards.length))) % 52) + 1;
        players[_player].playerCards.push(card);
        
        if (emitCard)
            emit CardDealt(_player, card);

        calculatePlayerTotal(_player);
    }

    function calculatePlayerTotal(address _player) internal {
        uint8 total = 0;
        uint8 numAces = 0;

        for (uint256 i = 0; i < players[_player].playerCards.length; i++) {
            uint8 cardValue = (players[_player].playerCards[i] % 13) + 1;

            if (cardValue == 1) {
                // Ace
                numAces++;
                total += 11;
            } else if (cardValue >= 10) {
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
        if (total == 21) {
            // Player got 21, stood automatically
            players[_player].hasStood = true;
            emit PlayerStood(_player, players[_player].playerTotal);
            endPlayerTurn();
        } else if (total > 21) {
            // Player busted
            players[_player].hasStood = true;
            emit PlayerStood(_player, players[_player].playerTotal);
            endPlayerTurn();
        }
    }

    // User turn actions
    function hit() external onlyPlayers inPlayingPhase {
        // Ensure the player has not stood or busted
        require(!players[msg.sender].hasStood, "You have already stood or busted.");

        // Deal a new card to the player
        dealCard(msg.sender, true);
    }

    function stand() external onlyPlayers inPlayingPhase {
        // Ensure the player has not stood or busted
        require(!players[msg.sender].hasStood, "You have already stood or busted.");

        // Stand and end turn
        players[msg.sender].hasStood = true;
        emit PlayerStood(msg.sender, players[msg.sender].playerTotal);
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
            uint8 dealerTotal = players[address(0)].playerTotal;
            // Reveal second dealer card
            emit CardDealt(address(0), players[address(0)].playerCards[1]);
            while (dealerTotal < 17) {
                // Deal with emiting reveal of all other cards
                dealCard(address(0), true);
            }

            // Determine the winner
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
                if (playerBlackjack) {
                   winnings[i - 1] = Structs.Payment({
                        addr: playerAddr,
                        amount: int256(players[playerAddr].bet * 3 / 2)
                    });
                } else if (playerWon) {
                    winnings[i - 1] = Structs.Payment({
                        addr: playerAddr,
                        amount: int256(players[playerAddr].bet)
                    });
                } else {
                    winnings[i - 1] = Structs.Payment({
                        addr: playerAddr,
                        amount:  -int256(players[playerAddr].bet)
                    });
                }
                emit GameResult(playerAddresses[i], playerWon, playerBlackjack);
            }
            // Pay out users
            mainContract.modifyFunds(winnings, false);

            // Reset game
            resetGame();
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
        
        // Set the phase to betting
        phase = GamePhase.Betting;
        totalBets = 0;
    }
}