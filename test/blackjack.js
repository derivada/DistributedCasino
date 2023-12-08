const Web3 = require('web3');
const ganache = require('ganache-cli');
const { BN } = require('bn.js'); // big number
const MainContract = artifacts.require('Main');
const BlackjackContract = artifacts.require('Blackjack');
const { expectRevert } = require('@openzeppelin/test-helpers');
const truffleAssert = require('truffle-assertions');

const {getCardName} = require('./../distributed-casino/src/cards')

contract('Blackjack', (accounts) => {
    let mainInstance;
    let blackjackInstance;
    let deployer = accounts[0];
    let player1 = accounts[3];
    let player2 = accounts[4];
    let players = [player1, player2];
    before(async () => {
        // Deploy Main contract
        mainInstance = await MainContract.new({ from: deployer });

        // Deploy Game contract, pass 10 min bet, 8 players max and address of Main contract
        blackjackInstance = await BlackjackContract.new(10, 8, mainInstance.address, { from: deployer });

        // Add blackjack contract to game contract list on main
        await mainInstance.addGameContract(blackjackInstance.address, { from: deployer });
        console.log("main instance: " + mainInstance.address)
        console.log("blackjack instance: " + blackjackInstance.address)
    });
    
    // Test correct initialization of Main-Game contract relationship
    it('Should set the Game contract address on Main', async () => {
        assert.equal(await mainInstance.isGameContract(blackjackInstance.address), true, 'Main contract should have Blackjack registered as game contract')
        assert.equal(await blackjackInstance.mainContractAddr(), mainInstance.address, 'Blackjack contract should have Main contract registered')
    });

    // Test correct fund adding
    const funds = [];
    it('Should let the players add money to the casino and start betting', async() => {
        players.forEach(async player => {
            const initialFunds = await mainInstance.getFunds(player, { from: player });
            assert.equal(initialFunds, 0, 'Initial funds should be 0');
            const amountToSend = web3.utils.toWei('0.10', 'ether');
            await mainInstance.addFunds({ from: player, value: amountToSend });

            const newFunds = await mainInstance.getFunds(player, { from: player });
            
            // Calculate the expected new funds
            const expectedNewFunds = new BN(initialFunds.toString()).add(new BN(amountToSend));

            // Check that the new funds match the expected value
            assert(newFunds.toString() === expectedNewFunds.toString(), 'Funds are not added correctly');
            funds.push(newFunds.toString())
        })
    });

    it('Should not let players bet a bigger amount than what they have', async() => {
        let betAmount = web3.utils.toWei('2', 'ether');
        await expectRevert(
            blackjackInstance.joinGame(betAmount, {from: player1}),
            "You don't have enough funds"
        );
    })

    it('Should not let players bet a smaller amount than the minimum bet', async() => {
        await expectRevert(
            blackjackInstance.joinGame(1, {from: player1}),
            "You need to bet more than the minimum bet"
        );
    })
    /*
    TODO fix this test
    it("Should not let players bet an amount that would make the casino not be able to pay them", async() => {
        let betAmount = web3.utils.toWei('0.99', 'ether');
        await expectRevert(
            blackjackInstance.joinGame(betAmount, {from: player1}),
            "The casino can't afford your bet"
        );
    })*/

    it('Should let the players bet and start the game', async() => {
        let betAmount = web3.utils.toWei('0.03', 'ether');
        await blackjackInstance.joinGame(betAmount, {from: player1}); 
        await blackjackInstance.joinGame(betAmount, {from: player2}); 
    })

    it('Should not let a not registered player start the game', async() => {
        await expectRevert(
            blackjackInstance.voteStart({from: accounts[8]}),
            "You are not a participant in the current game"
        );
    })

    it('Should let players vote for the game start correctly', async() => {
        const initialPhase = await blackjackInstance.phase();
        await blackjackInstance.voteStart({from: player1}),
        await expectRevert(
            blackjackInstance.voteStart({from: player1}),
            "User has already voted for the start of the game"
        );        
        await blackjackInstance.voteStart({from: player2});
        const newPhase = await blackjackInstance.phase();
        assert(initialPhase.toString() !== newPhase.toString(), 'The game phase should have changed');
    })

    it('Should let the players get their cards and the dealer initial card', async() => {
        let cards1 = await blackjackInstance.getCards({from: player1});
        cards1 = cards1.map(getCardName);
        let cards2 = await blackjackInstance.getCards({from: player2});
        cards2 = cards2.map(getCardName);
        let dealerCard = await blackjackInstance.getDealerCard({from: player1});
        dealerCard = getCardName(dealerCard);
        console.log("Player 1 cards: " + cards1);
        console.log("Player 2 cards: " + cards2);
        console.log("Dealer visible card: " + dealerCard);
    });

    let total1, total2
    it('Should let the players view their total', async() => {
        total1 = await blackjackInstance.getPlayerTotal({from: player1});
        total2 = await blackjackInstance.getPlayerTotal({from: player2});
        console.log("Player 1 total: " + total1);
        console.log("Player 2 total: " + total2);
    });

    it('Should let player 1 hit until they are busted', async() => {
        while(await blackjackInstance.getPlayerTotal({from: player1}) < 21) {
            let hasStood = await blackjackInstance.hasStood({from: player1});
            assert(!hasStood, "Player did not stand but was counted as such");
            await blackjackInstance.hit({from: player1});
        }

        let hasStood = await blackjackInstance.hasStood({from: player1});
        assert(hasStood, "Player should have stood now");
        await expectRevert(
            blackjackInstance.hit({from: player1}),
            "You have already stood or busted.."
        );
        let cards1 = await blackjackInstance.getCards({from: player1});
        cards1 = cards1.map(getCardName);
        console.log("Player 1 cards after playing: " + cards1);
        total1 = await blackjackInstance.getPlayerTotal({from: player1});
        console.log("Player 1 new total: " + total1);
    });

    it('Should let player 2 stand without playing', async() => {
        if(!await blackjackInstance.hasStood({from: player2})) {
            await blackjackInstance.stand({from: player2});
        }
    });

    it('Should have ended correctly', async() => {
        assert(await blackjackInstance.phase({from: player1}), 1, "Game should be finished now");
        const newFunds1 = await mainInstance.getFunds(player1, { from: player1 });
        console.log("Initial P1 funds " + web3.utils.fromWei(funds[0], 'ether') + ' ETH');
        console.log("New P1 funds " + web3.utils.fromWei(newFunds1, 'ether') + ' ETH');

        const newFunds2 = await mainInstance.getFunds(player2, { from: player2 });
        console.log("Initial P2 funds " + web3.utils.fromWei(funds[1], 'ether') + ' ETH');
        console.log("New P2 funds " + web3.utils.fromWei(newFunds2, 'ether') + ' ETH');
    });
});