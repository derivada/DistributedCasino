const MainContract = artifacts.require('Main');
const BlackjackContract = artifacts.require('Blackjack')
const StructsLibrary = artifacts.require('Structs');

module.exports = async function (deployer) {
    // Deploy StructsLibrary
    await deployer.deploy(StructsLibrary);
    
    // Link StructsLibrary to the contracts
    await deployer.link(StructsLibrary, [MainContract, BlackjackContract]);

    // Deploy the main contract
    const mainContract = await deployer.deploy(MainContract);

    // Deploy BlackjackContract with constructor parameters
    const blackjackContract = await deployer.deploy(BlackjackContract, 1e9, 8, mainContract.address);

    // Link the main contract with the game contracts
    await mainContract.addGameContract(blackjackContract.address);
};