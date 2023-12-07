const MainContract = artifacts.require('Main');
const StructsLibrary = artifacts.require('Structs');

module.exports = async function (deployer) {
    // Deploy StructsLibrary
    await deployer.deploy(StructsLibrary);

    // Link StructsLibrary to MainContract
    await deployer.link(StructsLibrary, [MainContract]);

    // Deploy MainContract
    await deployer.deploy(MainContract);
};