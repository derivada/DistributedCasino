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
    const minPlayers = 2;
    const maxPlayers = 8;
    before(async () => {
        // Deploy Main contract
        mainInstance = await MainContract.new({ from: deployer });

        // Deploy Game contract, pass parameters and addr of Main Contract
        dicesInstance = await DicesContract.new(numberOfRounds, roundBet, minPlayers, maxPlayers, mainInstance.address, { from: deployer });

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
    let dices1 = [], dices2 = [], totals1 = 0, totals2 = 0;
    it('Should let the players see their dices and totals', async() => {
        dices1 = await dicesInstance.getDices({from: player1});
        dices2 = await dicesInstance.getDices({from: player2});
        totals1 = Number(await dicesInstance.getPlayerTotal({from: player1}));
        totals2 = Number(await dicesInstance.getPlayerTotal({from: player2}));
        console.log("p1 dices: " + dices1 + ", total = " + totals1);
        console.log("p2 dices: " + dices2 + ", total = " + totals2);
        assert(dices1.length == 1, 'Number of dices is wrong for player1');
        assert(dices2.length == 1, 'Number of dices is wrong for player2');
        assert(dices1.reduce((acc, val) => acc + val), totals1, 'Totals are wrong for player1');
        assert(dices2.reduce((acc, val) => acc + val), totals2, 'Totals are wrong for player2');
    })

    it('Should let the players bet into the next round', async() => {
        const prevRound = Number(await dicesInstance.currentRound({from: player1}));
        await dicesInstance.bet({from: player1});
        await expectRevert(
            dicesInstance.bet({from: player1}),
            "You have already bet this round"
        );
        await expectRevert(
            dicesInstance.stand({from: player1}),
            "You can't stand in this round after having bet"
        )
        await dicesInstance.bet({from: player2});
        const newRound = Number(await dicesInstance.currentRound({from: player1}));
        assert(newRound == prevRound + 1, "The round counter should have updated");

        let new_dices1 = await dicesInstance.getDices({from: player1});
        let new_dices2 = await dicesInstance.getDices({from: player2});
        let new_totals1 = Number(await dicesInstance.getPlayerTotal({from: player1}));
        let new_totals2 = Number(await dicesInstance.getPlayerTotal({from: player2}));
        console.log("New p1 dices: " + new_dices1 + ", total = " + new_totals1);
        console.log("New p2 dices: " + new_dices2 + ", total = " + new_totals2);

        assert(new_dices1.reduce((acc, val) => acc + val), new_totals1, 'Totals are wrong for player1');
        assert(new_dices2.reduce((acc, val) => acc + val), new_totals2, 'Totals are wrong for player2');
        assert(totals1 < new_totals1, 'Total has not increased for player1');
        assert(totals2 < new_totals2, 'Total has not increased for player2');
        assert(dices1.length < new_dices1.length, 'Number of dices has not increased for player1');
        assert(dices2.length < new_dices2.length, 'Number of dices has not increased for player2');
        dices1 = new_dices1;
        dices2 = new_dices2;
        totals1 = new_totals1;
        totals2 = new_totals2;
    })

    it('Should let player 1 stand', async() => {
        await dicesInstance.stand({from: player1});
        await expectRevert(
            dicesInstance.stand({from: player1}),
            "You have already stood this game"
        )
        await expectRevert(
            dicesInstance.stand({from: player1}),
            "You have already stood this game"
        )
    })

    it('Should let player 2 bet and finish the game', async() => {
        const tx = await dicesInstance.bet({from: player2});
        // get the last totals from the event log
        const { logs } = tx;
        assert.ok(Array.isArray(logs));
        assert.equal(logs.length, 1);
    
        const log = logs[0];
        assert.equal(log.event, 'GameStateChanged');
        let new_dices1 = log.args.players.find(player => player.addr == player1).dices;
        let new_dices2 = log.args.players.find(player => player.addr == player2).dices;
        let new_totals1 = log.args.players.find(player => player.addr == player1).playerTotal;
        let new_totals2 = log.args.players.find(player => player.addr == player2).playerTotal;
        console.log("New p1 dices: " + new_dices1 + ", total = " + new_totals1);
        console.log("New p2 dices: " + new_dices2 + ", total = " + new_totals2);
        
        assert(new_dices1.reduce((acc, val) => acc + val), new_totals1, 'Totals are wrong for player1');
        assert(new_dices2.reduce((acc, val) => acc + val), new_totals2, 'Totals are wrong for player2');
        assert(totals1 == new_totals1, 'Total should have not increased for player1');
        assert(dices1.length == new_dices1.length, 'Number of dices should have not increased for player1');
        assert(totals2 < new_totals2, 'Total has not increased for player2');
        assert(dices2.length < new_dices2.length, 'Number of dices has not increased for player2');
        dices1 = new_dices1;
        dices2 = new_dices2;
        totals1 = new_totals1;
        totals2 = new_totals2; 
    })

    it('Should have updated the accounts correctly', async() => {
        let totalBettedP1 = roundBet * 2;
        let totalBettedP2 = roundBet * 3;
        let initialMoney = roundBet * numberOfRounds + 1;
        let p1Money = await mainInstance.getFunds(player1, {from: player1});
        let p2Money = await mainInstance.getFunds(player2, {from: player2});
        if(totals1 == totals2) {
            // both won
            assert(initialMoney == p1Money, "Players tied, but player 1 didn't maintain his money");
            assert(initialMoney == p2Money, "Players tied, but player 2 didn't maintain his money");
        } else if(totals1 < totals2) {
            // 2 won
            assert(initialMoney - totalBettedP1 == p1Money, "Player 2 won, but 1 didn't lost his bet");
            assert(initialMoney + totalBettedP1 == p2Money, "Player 2 won, but he didn't got player 1 bet");
        } else {
            // 1 won
            assert(initialMoney - totalBettedP2 == p2Money, "Player 1 won, but 2 didn't lost his bet");
            assert(initialMoney + totalBettedP2 == p1Money, "Player 1 won, but he didn't got player 2 bet");
        }
    })
});