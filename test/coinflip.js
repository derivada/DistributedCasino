const Web3 = require('web3');
const ganache = require('ganache-cli');
const { BN } = require('bn.js'); // big number
const MainContract = artifacts.require('Main');
const CoinflipContract = artifacts.require('Coinflip');
const { expectRevert } = require('@openzeppelin/test-helpers');
const truffleAssert = require('truffle-assertions');

const {getCardName} = require('../distributed-casino/src/cards')

contract('Dices', (accounts) => {
    let mainInstance;
    let coinflipInstance;
    let deployer = accounts[0];
    let player1 = accounts[3];
    let player2 = accounts[4];

    const initialBet = 10;
    before(async () => {
        // Deploy Main contract
        mainInstance = await MainContract.new({ from: deployer });

        // Deploy Game contract, pass parameters and addr of Main Contract
        coinflipInstance = await CoinflipContract.new(initialBet, mainInstance.address, { from: deployer });

        // Add coinflip contract to game contract list on main
        await mainInstance.addGameContract(coinflipInstance.address, { from: deployer });
        console.log("main instance: " + mainInstance.address)
        console.log("coinflip instance: " + coinflipInstance.address)
    });
    
    // Test correct initialization of Main-Game contract relationship
    it('Should set the Game contract address on Main', async () => {
        assert.equal(await mainInstance.isGameContract(coinflipInstance.address), true, 'Main contract should have Coinflip registered as game contract')
        assert.equal(await coinflipInstance.mainContractAddr(), mainInstance.address, 'Coinflip contract should have Main contract registered')
    });

    // Test correct fund adding
    const funds = [];
    it('Should let the players add money to the casino and start betting', async() => {
        // player 1: put amount smaller than min bet
        let initialFunds = await mainInstance.getFunds(player1, { from: player1 });
        assert.equal(initialFunds, 0, 'Initial funds should be 0');
        let amountToSend = 5; // play 0 rounds
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
        amountToSend = 30; // play 2 rounds
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
            coinflipInstance.joinGame({from: player1}),
            "You don't have enough funds to join"
        );
        coinflipInstance.joinGame({from: player2});
        // add more funds
        await mainInstance.addFunds({ from: player1, value: 5 });
        await coinflipInstance.joinGame({from: player1});
    })

});