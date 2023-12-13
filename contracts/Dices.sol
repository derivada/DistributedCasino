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

/*
    Contract for the "Krazy Dices" game. This game consists on multiple players betting the same amount on each round (predefined on constructor)
    and choosing whether to continue or to stand depending on their dice sum. The players with the biggest sum win the game.
*/
contract Dices {
    // The possible game phases
    enum GamePhase { Ended, Playing }

    // Constants, set in constructor
    address public owner;
    uint256 public roundBet;
    uint8 public minPlayers;
    uint8 public maxPlayers;
    uint8 public numberOfRounds; // Total amount of rounds
    address public mainContractAddr;
    Main mainContract;

    // Game variables
    GamePhase public phase = GamePhase.Ended; 
    uint8 public currentRound; // Round number
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
        int256 betResult;
    }

    // Global mapping and list of players
    mapping(address => Player) players;
    address[] playerAddresses;

    // Fired on state changes in the game, sends the public information of the game
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

    constructor(uint8 _numberOfRounds, uint256 _roundBet, uint8 _minPlayers, uint8 _maxPlayers, address _main_contract_addr) {
        owner = msg.sender;
        numberOfRounds = _numberOfRounds;
        roundBet = _roundBet;
        minPlayers = _minPlayers;
        maxPlayers = _maxPlayers;
        mainContractAddr = _main_contract_addr;
        mainContract = Main(_main_contract_addr);
    }

    function getPlayers() external view returns (Player[] memory) {
        return getPlayersInternal();
    } 

    function getPlayersInternal() internal view returns (Player[] memory) {
        Player[] memory allPlayers = new Player[](playerAddresses.length);
        for(uint256 i = 0; i < playerAddresses.length; i++ ) {
            allPlayers[i] = players[playerAddresses[i]];
            allPlayers[i].addr = playerAddresses[i]; // Also add the address of the player to the emitted object

            // Remove the dices and total of players if the game is running, to avoid knowing what the others have
            if(phase == GamePhase.Playing) {
                delete allPlayers[i].dices;
                delete allPlayers[i].playerTotal;
            }
        }
        return allPlayers;
    }
    
    // Other useful getter functions for the players
    function getDices() inPlayingPhase onlyPlayers external view returns (uint8[] memory) {
        return players[msg.sender].dices;
    }

    function getPlayerTotal() inPlayingPhase onlyPlayers external view returns (uint8) {
        return players[msg.sender].playerTotal;
    }

    /*
        Joins a game, betting the first round amount
    */
    function joinGame() external notInPlayingPhase {
        require(playerAddresses.length <= maxPlayers, "The maximum number of players was reached");
        require(players[msg.sender].bet == 0, "The player has already entered the game");
        
        // Check in main contract if funds are enough
        uint256 userFunds = mainContract.getFunds(msg.sender);
        require(roundBet * numberOfRounds <= userFunds, "You don't have enough funds to join");
        // Register player in the game
        players[msg.sender].bet = roundBet;
        playerAddresses.push(msg.sender);
        emit GameStateChanged(getPlayersInternal(), phase);
    }

    /*
     Users vote for the start of the game, when all users all ready, state switches and first dices are given
    */
    function voteStart() external onlyPlayers notInPlayingPhase {
        // Check if player is registered for the game and has not voted
        require(playerAddresses.length >= minPlayers, "The number of minimum players hasn't been reached yet");
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
    
    /*
        User bets for the round, adding the round bet to his total and allowing them to get a new dice. 
        This is called Hit in the frontend.
    */
    function bet() external inPlayingPhase onlyPlayers {
        // Check if user has not stood or already played this round
        require(!players[msg.sender].hasStood, "You have already stood this game");
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

    /*
        A user stands the game, they won't have to bet more money but will not receive more dices.
    */
    function stand() external inPlayingPhase onlyPlayers {
        require(players[msg.sender].hasStood == false, "You have already stood this game");
        require(players[msg.sender].hasPlayed == false, "You can't stand in this round after having bet");
        
        // Find the index and remove that player from the game
        players[msg.sender].hasStood = true;
        playedCount++;

        if (playerAddresses.length == playedCount)
            giveDices();
        else
            emit GameStateChanged(getPlayersInternal(), phase);
    }

    // Gives dices to players randomly
    function giveDices() internal {
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            address player_addr = playerAddresses[i];
            playedCount = 0; // Reset the player count
            if(!players[player_addr].hasStood) {
                // Generate the dice, add it and set the played status to false
                uint8 dice = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, player_addr, players[player_addr].dices.length))) % 6) + 1;
                players[player_addr].dices.push(dice);
                players[player_addr].playerTotal += dice;
                //  Set the new maximum total
                if(maxTotal < players[player_addr].playerTotal) 
                    maxTotal = players[player_addr].playerTotal;
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
        uint256[] memory winners = new uint256[](playerAddresses.length);
        uint256 winnersCount;
        uint256 winnersPot;
        int256 betResult;
        Structs.Payment[] memory winnings = new Structs.Payment[](playerAddresses.length);
        
        for(uint256 i = 0; i < playerAddresses.length; i++) {
            if(players[playerAddresses[i]].playerTotal == maxTotal){
                winners[winnersCount] = i;
                winnersCount++;
            } else {
                winnersPot += players[playerAddresses[i]].bet;
                betResult = -int256(players[playerAddresses[i]].bet);
                winnings[i] = Structs.Payment({
                    addr: playerAddresses[i],
                    amount: betResult
                });
                players[playerAddresses[i]].betResult = betResult;
            }
        }

        uint256 winAmount = winnersPot / winnersCount;
        uint256 rem = winnersPot % winnersCount; // should be a negligible amount of wei, just for 0-sum
        betResult = int256(winAmount + rem);
        winnings[winners[0]] = Structs.Payment({
                addr: playerAddresses[winners[0]],
                amount: betResult
        });
        players[playerAddresses[winners[0]]].betResult = betResult;
        for(uint256 i = 1; i < winnersCount; i++) {
            betResult = int256(winAmount);
            winnings[winners[i]] = Structs.Payment({
                addr: playerAddresses[winners[i]],
                amount: betResult
            });
            players[playerAddresses[winners[0]]].betResult = betResult;
        }
        
        // Pay out users
        mainContract.modifyFunds(winnings, true);

        // Emit one last event with the game results
        phase = GamePhase.Ended;
        emit GameStateChanged(getPlayersInternal(), phase);

        // Reset the game
        resetGame();
    }

    // Resets the state of the game
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