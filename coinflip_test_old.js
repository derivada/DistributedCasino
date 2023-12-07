const Coinflip = artifacts.require('Coinflip');
const assert = require('assert');

// Connect to a local Ethereum node
contract('Coinflip', async (accounts) => {

    const HEADS = accounts[1];
    const TAILS = accounts[2];
    
    const betAmount = 1e17; // 0.1 ETH
    
    let instance, headsBalance, tailsBalance;
    before(async () => {
        instance = await Coinflip.deployed();
        //headsBalance = web3.utils.fromWei(web3.eth.getBalance(HEADS));
        //tails = web3.utils.fromWei(web3.eth.getBalance(TAILS));
        headsBalance = await web3.eth.getBalance(HEADS);
        tailsBalance = await web3.eth.getBalance(TAILS);
        console.log('balance: ', headsBalance)
    });

   /* it("should not allow invalid values to register",
      async () => {
        await instance.enter(3, {
            from: HEADS,
            value: betAmount,
        });
    }); */

    it('should allow heads and tails accounts to register', async () => {
        await instance.enter(0, {
            from: HEADS,
            value: betAmount,
        });
        await instance.enter(1, {
            from: TAILS,
            value: betAmount,
        });
        assert.equal(HEADS, await instance.heads(), "The contract should save the address of heads");
        assert.equal(TAILS, await instance.tails(), "The contract should save the adress of Tails");
    });

    it("should allow head and tails to vote for the start of the flip", async () => {
        await instance.voteStart({
            from: HEADS
        });
        await instance.voteStart({
            from: TAILS
        });
    });

    it("should update the balances correctly", async () => {
    
        const newHeadsBalance = await web3.eth.getBalance(HEADS);
        const newTailsBalance = await web3.eth.getBalance(TAILS);

        console.log("previous heads: " + headsBalance + ", new heads: " + newHeadsBalance);
        console.log("previous tails: " + tailsBalance + ", new tails: " + newTailsBalance);
        const tol = 0.01;
        
        let diffHeads = Math.abs(newHeadsBalance - headsBalance);
        if (diffHeads) diffHeads *=-1
        assert(diffHeads - betAmount < betAmount * tol);
        let diffTails = Math.abs(tailsBalance - newTailsBalance);
        if (diffTails) diffTails *= -1;
        assert(diffTails - betAmount < betAmount * tol);
    });
        
});
