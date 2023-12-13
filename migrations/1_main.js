const MainContract = artifacts.require('Main');
const BlackjackContract = artifacts.require('Blackjack')
const StructsLibrary = artifacts.require('Structs');
const DicesContract = artifacts.require('Dices');
const CoinflipContract = artifacts.require('Coinflip');

const Web3 = require('web3');

module.exports = async function (deployer) {
    // Deploy StructsLibrary
    await deployer.deploy(StructsLibrary);
    
    // Link StructsLibrary to the contracts
    await deployer.link(StructsLibrary, [MainContract, BlackjackContract, DicesContract, CoinflipContract]);

    // Deploy the main contract
    const mainContract = await deployer.deploy(MainContract);

    // Deploy BlackjackContract with constructor parameters
    const blackjackContract = await deployer.deploy(BlackjackContract, 1e9, 8, mainContract.address);

    // Deploy DicesContract with constructor parameters
    const dicesContract = await deployer.deploy(DicesContract, 3, Web3.utils.toWei(0.001, "ether"), 2, 8, mainContract.address);

    // Deploy ConflipContract with constructor parameters
    const coinflipContract = await deployer.deploy(CoinflipContract, Web3.utils.toWei(0.1, "ether"), mainContract.address);

    // Link the main contract with the game contracts
    await mainContract.addGameContract(blackjackContract.address);
    await mainContract.addGameContract(dicesContract.address);
    await mainContract.addGameContract(coinflipContract.address);

};