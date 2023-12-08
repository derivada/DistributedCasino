const BlackjackContract = artifacts.require('Blackjack');
const MainContract = artifacts.require('Main');
const StructsLibrary = artifacts.require('Structs');

module.exports = async function (deployer) {
    // Deploy StructsLibrary
    await deployer.deploy(StructsLibrary);

    // Retrieve the deployed MainContract instance
    const mainInstance = await MainContract.deployed();

    // Link StructsLibrary to BlackjackContract
    await deployer.link(StructsLibrary, [BlackjackContract]);

    // Deploy BlackjackContract with constructor parameters
    await deployer.deploy(BlackjackContract, 1e9, 8, mainInstance.address);
};