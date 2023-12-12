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

contract Dices {
    // The possible game phases
    enum GamePhase { Ended, Playing }

    // Constants, set in constructor
    address public owner;
    uint256 public roundBet;
    uint8 public maxPlayers;
    uint8 public numberOfRounds; // Total amount of rounds
    address public mainContractAddr;
    Main mainContract;

    // Game variables
    GamePhase public phase = GamePhase.Ended; 
    uint256 public currentRound; // Round number
    uint8 public playedCount; // Players that have played (or have already stood) this round
    uint8 maxTotal;

    struct Player {
        address addr;
        bool hasVoted;

        uint8 playerTotal;
        uint8[] dices;
        
        uint256 bet;
        bool hasPlayed;
        bool hasStood;
    }

    // Global mapping and list of players
    mapping(address => Player) players;
    address[] playerAddresses;

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

    constructor(uint8 _numberOfRounds, uint256 _roundBet, uint8 _maxPlayers, address _main_contract_addr) {
        owner = msg.sender;
        numberOfRounds = _numberOfRounds;
        roundBet = _roundBet;
        maxPlayers = _maxPlayers;
        mainContractAddr = _main_contract_addr;
        mainContract = Main(_main_contract_addr);
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

            // Remove the dices and total of players if the game is running, to avoid knowing what the others have
            if(phase == GamePhase.Playing) {
                delete allPlayers[i].dices;
                delete allPlayers[i].playerTotal;
            }
        }
        return allPlayers;
    }
    
    // Other useful getter functions
    function getDices() inPlayingPhase onlyPlayers internal view returns (uint8[] memory) {
        return players[msg.sender].dices;
    }

    function getPlayerTotal() inPlayingPhase onlyPlayers internal view returns (uint8) {
        return players[msg.sender].playerTotal;
    }

    function joinGame() external notInPlayingPhase {
        require(playerAddresses.length <= maxPlayers, "The maximum number of players was reached");

        // Check in main contract if funds are enough
        uint256 userFunds = mainContract.getFunds(msg.sender);
        require(roundBet * numberOfRounds <= userFunds, "You don't have enough funds to join");
        // Register player in the game
        players[msg.sender].bet = roundBet;
        playerAddresses.push(msg.sender);
    }

    // Users vote for the start of the game, when all users all ready, state switches and first dices are given
    function voteStart() external onlyPlayers notInPlayingPhase {
        // Check if player is registered for the game and has not voted
        require(!players[msg.sender].hasVoted, "User has already voted for the start of the game");
        players[msg.sender].hasVoted = true;
        
        // Check if all played have voted, then start the game
        uint8 votedCount;
        for (uint8 i = 0; i < playerAddresses.length; i++) {
            if(players[playerAddresses[i]].hasVoted)
                votedCount++;
        }
        // Start the game if all players have voted
        if(votedCount == playerAddresses.length){
            phase = GamePhase.Playing;
            giveDices();
        } else { 
            emit GameStateChanged(getPlayersInternal(), phase);
        }
    }
    
    // User bets for the round, adding the round bet to his total.
    function bet() external inPlayingPhase onlyPlayers {
        // Check if user has not stood or already played this round
        require(!players[msg.sender].hasStood, "You have already stood the game");
        require(!players[msg.sender].hasPlayed, "You have already bet this round");

        // Check in main contract if funds are enough (just in case funds were updated concurrently with the game)
        uint256 userFunds = mainContract.getFunds(msg.sender);
        require(roundBet <= userFunds, "You don't have enough funds to play");

        players[msg.sender].bet += roundBet;
        players[msg.sender].hasPlayed = true;
        playedCount++;

        if (playedCount == playerAddresses.length)
            giveDices();
        else
            emit GameStateChanged(getPlayersInternal(), phase);
    }

    // A user stands the game, they lose the money betted in previous rounds
    function stand() external onlyPlayers {
        require(phase == GamePhase.Playing, "The game is not in the playing phase");
        require(players[msg.sender].hasStood == false, "You have already stood this game");
        require(players[msg.sender].hasPlayed == false, "You can't stand in this round after having bet");
        
        // Find the index and remove that player from the game
        players[msg.sender].hasStood = true;
        playedCount++;

        if (playerAddresses.length == playedCount) // If only one player left, end the game
            endGame();
        else
            emit GameStateChanged(getPlayersInternal(), phase);
    }

    // Dices are given to the players randomly
    function giveDices() internal {
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            address player_addr = playerAddresses[i];
            playedCount = 0; // Reset the player count
            if(!players[player_addr].hasStood) {
                // Generate the dice, add it and set the played status to false
                uint8 dice = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, player_addr, players[player_addr].dices.length))) % 6) + 1;
                players[player_addr].dices.push(dice);
                players[player_addr].playerTotal += dice;
                players[player_addr].hasPlayed = false;
            } else {
                playedCount++; // count as this stood played has already played
            }
        }

        currentRound++;
       
        // Check if the game has ended
        if(currentRound == numberOfRounds)
            endGame();
        else
            emit GameStateChanged(getPlayersInternal(), phase);
    }

    // Finishes the game and calls the main contract for payouts
    function endGame() internal {
        phase = GamePhase.Ended;
        uint256[] memory winners = new uint256[](playerAddresses.length - 1);
        uint256 winnersCount;
        uint256 winnersPot;
        Structs.Payment[] memory winnings = new Structs.Payment[](playerAddresses.length - 1);
        
        for(uint256 i = 0; i < playerAddresses.length; i++) {
            if(players[playerAddresses[i]].playerTotal == maxTotal){
                winners[winnersCount++] = i;
            } else {
                winnersPot += players[playerAddresses[i]].bet;
                winnings[i] = Structs.Payment({
                    addr: playerAddresses[i],
                    amount: - int256(players[playerAddresses[i]].bet)
                });
            }
        }

        uint256 winAmount = winnersPot / winners.length;
        uint256 rem = winnersPot % winners.length; // should be a negligible amount of wei, just for 0-sum
        winnings[winners[0]] = Structs.Payment({
                addr: playerAddresses[winners[0]],
                amount: int256(winAmount + rem)
        });
        for(uint256 i = 1; i < winnersCount; i++) {
            winnings[winners[i]] = Structs.Payment({
                addr: playerAddresses[winners[i]],
                amount: int256(winAmount)
            });
        }
        
        // Pay out users
        mainContract.modifyFunds(winnings, true);

        // Emit one last event with the game results
        emit GameStateChanged(getPlayersInternal(), phase);

        // Reset the game
        resetGame();
    }

    function resetGame() internal {
        // Delete players from previous game
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            delete players[playerAddresses[i]];
        }
        // Clear the players array
        delete playerAddresses;
        playerAddresses = new address[](0);

        // Reset all other data
        currentRound = 0;        
        maxTotal = 0;
        phase = GamePhase.Ended;
        playedCount = 0;
    }
}