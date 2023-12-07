const StructsLibrary = artifacts.require('Structs');

module.exports = async function (deployer) {
    await deployer.deploy(StructsLibrary);
};