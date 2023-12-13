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

contract CoinFlip {
    enum GamePhase { Ended, Playing }
    enum Coin { Tails, Heads }

    // Constants, set in constructor
    address public owner;
    uint256 public initialBet;
    address public mainContractAddr;
    Main mainContract;

    // Game variables
    GamePhase public phase = GamePhase.Ended; 
    address public lastWinner = address(0);
    uint256 public currentBet;
    struct Player {
        address addr;
        bool hasVoted;
        
        bool wantsDouble; // wants to do another round with double bet
        Coin side; // the side of the coin the user chose
        
        int256 betResult;
    }

    // In this game we only have 2 players
    mapping(address => Player) players;
    address player1 = address(0); address player2 = address(0);
    
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
        require(msg.sender == player1 || msg.sender == player2, "You are not a participant in the current game");
        _;
    }

    constructor(uint256 _initialBet, address _main_contract_addr) {
        owner = msg.sender;
        initialBet = _initialBet;
        currentBet = initialBet;
        mainContractAddr = _main_contract_addr;
        mainContract = Main(_main_contract_addr);
    }

    function getPlayers() external view returns (Player[] memory) {
        return getPlayersInternal();
    } 

    function getPlayersInternal() internal view returns (Player[] memory) {
        Player[] memory allPlayers = new Player[](2);
        allPlayers[0] = players[player1];
        allPlayers[0].addr = player1;
        allPlayers[1] = players[player2];
        allPlayers[1].addr = player2;
        return allPlayers;
    }


    function joinGame() external notInPlayingPhase {
        require(address(0) == player1 || address(0) == player2, "The maximum number of players was reached");
        require(msg.sender != player1 && msg.sender != player2, "The player has already entered the game");
        
        // Check in main contract if funds are enough
        uint256 userFunds = mainContract.getFunds(msg.sender);
        require(initialBet <= userFunds, "You don't have enough funds to join");
        // Register player in the game
        if(player1 == address(0)) {
            player1 = msg.sender;
        } else {
            player2 = msg.sender;
        }
        emit GameStateChanged(getPlayersInternal(), phase);
    }

    // if heads is true, get heads, otherwise get tails
    function chooseSide(bool heads) external onlyPlayers notInPlayingPhase {
        // Check if player is registered for the game and has not voted
        require(player1 != address(0) && player2 != address(0), "There are not 2 players in the game yet");
        require(!players[msg.sender].hasVoted, "You have already chosen a side");
        Coin side = heads ? Coin.Heads : Coin.Tails;
        require(
            (players[player1].side != side || !players[player1].hasVoted) && 
            (players[player2].side != side || !players[player2].hasVoted), 
            "Your coin side was already chosen");
        players[msg.sender].hasVoted = true;
        players[msg.sender].side = side;
        if(players[player1].hasVoted && players[player2].hasVoted) {
            startCoinflip();
            players[player1].hasVoted = false; // will be reused for double votes
            players[player2].hasVoted = false; 
        } else { 
            emit GameStateChanged(getPlayersInternal(), phase);
        }
    }
    
    function startCoinflip() internal {
        Coin coin = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 2 == 0 ? Coin.Tails : Coin.Heads;
        Structs.Payment[] memory winnings = new Structs.Payment[](2);
        if(players[player1].side == coin) {
            // p1 wins
            lastWinner = player1;
            players[player1].betResult = int256(currentBet);
            players[player2].betResult = -int256(currentBet);
            winnings[0] = Structs.Payment({
                addr: player1,
                amount: int256(currentBet)
            });
            winnings[1] = Structs.Payment({
                addr: player2,
                amount: -int256(currentBet)
            });
        } else {
            // p2 wins
            lastWinner = player2;
            players[player1].betResult = -int256(currentBet);
            players[player2].betResult = int256(currentBet);
            winnings[0] = Structs.Payment({
                addr: player1,
                amount: -int256(currentBet)
            });
            winnings[1] = Structs.Payment({
                addr: player2,
                amount: int256(currentBet)
            });
        }
        mainContract.modifyFunds(winnings, true);
        phase = GamePhase.Playing; // playing is basically asking for doubling phase
    }

    function voteDouble(bool vote) external onlyPlayers inPlayingPhase {
        require(!players[msg.sender].hasVoted, "You have already voted for doubling the bet");
        if(!vote) {
            resetGame();
            return;
        }
        // Check in main contract if funds are enough
        uint256 userFunds = mainContract.getFunds(msg.sender);
        require(currentBet * 2 <= userFunds, "You don't have enough funds to double the bet");
        players[msg.sender].wantsDouble = vote;
        players[msg.sender].hasVoted = true;
        if(players[player1].wantsDouble && players[player2].wantsDouble) {
            // double the bet
            currentBet = currentBet * 2;
            // reset the voting variables
            players[player1].hasVoted = false;
            players[player2].hasVoted = false;
            players[player1].wantsDouble = false;
            players[player2].wantsDouble = false;
            startCoinflip();
        } else {
            emit GameStateChanged(getPlayersInternal(), phase);
        }
    }

    function resetGame() internal {
        delete players[player1];
        delete players[player2];
        player1 = address(0);
        player2 = address(0);
        phase = GamePhase.Ended;
        currentBet = initialBet;
        emit GameStateChanged(getPlayersInternal(), phase);
    }
}