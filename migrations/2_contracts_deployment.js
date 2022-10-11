const VotingSmartContract = artifacts.require("./VotingSmartContract");

module.exports = function (deployer) {
    deployer.deploy(VotingSmartContract);
};
