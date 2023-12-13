const Web3 = require('web3');
const ganache = require('ganache-cli');
const { BN } = require('bn.js'); // big number
const MainContract = artifacts.require('Main');
const CoinflipContract = artifacts.require('Coinflip');
const { expectRevert } = require('@openzeppelin/test-helpers');
const truffleAssert = require('truffle-assertions');

const {getCardName} = require('../distributed-casino/src/cards');
const { current } = require('@openzeppelin/test-helpers/src/balance');

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
        funds.push(Number(newFunds))

        // player 1: put amount bigger than min bet
        initialFunds = await mainInstance.getFunds(player2, { from: player2 });
        assert.equal(initialFunds, 0, 'Initial funds should be 0');
        amountToSend = 1000;
        await mainInstance.addFunds({ from: player2, value: amountToSend });

        newFunds = await mainInstance.getFunds(player2, { from: player2 });
        
        // Calculate the expected new funds
        expectedNewFunds = new BN(initialFunds.toString()).add(new BN(amountToSend));

        // Check that the new funds match the expected value
        assert(newFunds.toString() === expectedNewFunds.toString(), 'Funds are not added correctly');
        funds.push(Number(newFunds))    
    });

    it('Should let players only enter the game when they have enough funds', async() => {
        await expectRevert(
            coinflipInstance.joinGame({from: player1}),
            "You don't have enough funds to join"
        );
        coinflipInstance.joinGame({from: player2});
        // add more funds
        await mainInstance.addFunds({ from: player1, value: 5 });
        funds[0] += 5
        await coinflipInstance.joinGame({from: player1});
    })
    it('Should let the players choose a side', async() => {
        await coinflipInstance.chooseSide(0, {from: player1});
        await expectRevert(
            coinflipInstance.chooseSide(0, {from: player1}),
            "You have already chosen a side"
        )
        await expectRevert(
            coinflipInstance.chooseSide(0, {from: player2}),
            "Your coin side was already chosen"
        )
        await coinflipInstance.chooseSide(1, {from: player2})
    })
    let currentBet = initialBet
    it('Should reflect the players outcome after playing', async() => {
        let newFundsP1 = Number(await mainInstance.getFunds(player1, { from: player1 }));
        let newFundsP2 = Number(await mainInstance.getFunds(player2, { from: player2 }));
        let winner = await coinflipInstance.lastWinner();
        console.log(newFundsP1, newFundsP2, winner, funds[0], funds[1])
        assert(winner == player1 || winner == player2, "Winner is neither player 1 or 2");
        if(winner == player1){
            assert(funds[0] + currentBet == newFundsP1, "Player 1 won but he doesn't have the new funds");
            assert(funds[1] - currentBet == newFundsP2, "Player 2 lost but he didn't lost his bet");
        } else {
            assert(funds[0] - currentBet == newFundsP1, "Player 1 lost but he didn't lost his bet");
            assert(funds[1] + currentBet == newFundsP2, "Player 2 won but he doesn't have the new fund");
        }
        funds[0] = newFundsP1
        funds[1] = newFundsP2
    })

    it('Should let the players vote for doubling the game, only if they can affort it', async() => {
        await mainInstance.retrieveFunds(funds[0], { from: player1});

        await expectRevert(
            coinflipInstance.voteDouble(true, {from: player1}),
            "You don't have enough funds to double the bet"
        )
        
        await mainInstance.addFunds({ from: player1, value: 20 });
        await coinflipInstance.voteDouble(true, {from: player1}),
        await expectRevert(
            coinflipInstance.voteDouble(false, {from: player1}),
            "You have already voted for doubling the bet"
        )
        await coinflipInstance.voteDouble(true, {from: player2}),

        currentBet *= 2
        assert(currentBet == Number(await coinflipInstance.currentBet()), 
            "The current bet hasn't updated properly");
    })

    it('Should let one player stop the doubling, resetting the game', async() => {
        await coinflipInstance.voteDouble(true, {from: player2});
        await coinflipInstance.voteDouble(false, {from: player1})
        // should have reset now
        assert(await coinflipInstance.currentBet() == initialBet, "The current bet was not reset")
    })
});