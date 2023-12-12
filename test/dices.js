const Web3 = require('web3');
const ganache = require('ganache-cli');
const { BN } = require('bn.js'); // big number
const MainContract = artifacts.require('Main');
const DicesContract = artifacts.require('Dices');
const { expectRevert } = require('@openzeppelin/test-helpers');
const truffleAssert = require('truffle-assertions');

const {getCardName} = require('../distributed-casino/src/cards')

contract('Dices', (accounts) => {
    let mainInstance;
    let dicesInstance;
    let deployer = accounts[0];
    let player1 = accounts[3];
    let player2 = accounts[4];
    let players = [player1, player2];
    const numberOfRounds = 3;
    const roundBet = 10;
    const maxPlayers = 8;
    before(async () => {
        // Deploy Main contract
        mainInstance = await MainContract.new({ from: deployer });

        // Deploy Game contract, pass parameters and addr of Main Contract
        dicesInstance = await DicesContract.new(numberOfRounds, roundBet, maxPlayers, mainInstance.address, { from: deployer });

        // Add blackjack contract to game contract list on main
        await mainInstance.addGameContract(dicesInstance.address, { from: deployer });
        console.log("main instance: " + mainInstance.address)
        console.log("dices instance: " + dicesInstance.address)
    });
    
    // Test correct initialization of Main-Game contract relationship
    it('Should set the Game contract address on Main', async () => {
        assert.equal(await mainInstance.isGameContract(dicesInstance.address), true, 'Main contract should have Dices registered as game contract')
        assert.equal(await dicesInstance.mainContractAddr(), mainInstance.address, 'Dices contract should have Main contract registered')
    });

    // Test correct fund adding
    const funds = [];
    it('Should let the players add money to the casino and start betting', async() => {
        // player 1: put amount smaller than min bet
        let initialFunds = await mainInstance.getFunds(player1, { from: player1 });
        assert.equal(initialFunds, 0, 'Initial funds should be 0');
        let amountToSend = roundBet * numberOfRounds - 1;
        await mainInstance.addFunds({ from: player1, value: amountToSend });

        let newFunds = await mainInstance.getFunds(player1, { from: player1 });
        
        // Calculate the expected new funds
        let expectedNewFunds = new BN(initialFunds.toString()).add(new BN(amountToSend));

        // Check that the new funds match the expected value
        assert(newFunds.toString() === expectedNewFunds.toString(), 'Funds are not added correctly');
        funds.push(newFunds.toString())

        // player 1: put amount bigger than min bet
        initialFunds = await mainInstance.getFunds(player2, { from: player2 });
        assert.equal(initialFunds, 0, 'Initial funds should be 0');
        amountToSend = roundBet * numberOfRounds + 1;
        await mainInstance.addFunds({ from: player2, value: amountToSend });

        newFunds = await mainInstance.getFunds(player2, { from: player2 });
        
        // Calculate the expected new funds
        expectedNewFunds = new BN(initialFunds.toString()).add(new BN(amountToSend));

        // Check that the new funds match the expected value
        assert(newFunds.toString() === expectedNewFunds.toString(), 'Funds are not added correctly');
        funds.push(newFunds.toString())    
    });

    it('Should let players only enter the game when they have enough funds', async() => {
        await expectRevert(
            dicesInstance.joinGame({from: player1}),
            "You don't have enough funds to join"
        );
        dicesInstance.joinGame({from: player2});
        // add more funds
        await mainInstance.addFunds({ from: player1, value: 2 });
        await dicesInstance.joinGame({from: player1});
    })

    it('Should not let a not registered player start the game', async() => {
        await expectRevert(
            dicesInstance.voteStart({from: accounts[8]}),
            "You are not a participant in the current game"
        );
    })

    it('Should let players vote for the game start correctly', async() => {
        const initialPhase = await dicesInstance.phase();
        await dicesInstance.voteStart({from: player1}),
        await expectRevert(
            dicesInstance.voteStart({from: player1}),
            "User has already voted for the start of the game"
        );
        await dicesInstance.voteStart({from: player2});
        const newPhase = await dicesInstance.phase();
        assert(initialPhase.toString() !== newPhase.toString(), 'The game phase should have changed');
    })
});