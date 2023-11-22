var Coinflip = artifacts.require("Coinflip");

module.exports = function(deployer) {
  // deployment steps
  deployer.deploy(Coinflip);
};