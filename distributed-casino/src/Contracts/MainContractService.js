import Web3 from "web3";
import MainContractArtifact from "./Main.json"; // Replace with your contract's JSON file

const mainContractService = {
    web3: null,
    mainContract: null,
    account: null,

    async init() {
        // Initialize Web3 and set the contract instance
        this.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
        const accounts = await this.web3.eth.getAccounts();
        this.account = accounts[0];
        const networkId = await this.web3.eth.net.getId();
        const networkData = MainContractArtifact.networks[networkId];
        if (networkData) {
            this.mainContract = new this.web3.eth.Contract(
                MainContractArtifact.abi,
                networkData.address
            );
        } else {
            console.error("Contract not deployed to detected network.");
        }
    },

    async getAccount() {
        return this.account
    },

    async getFunds() {
        if (!this.mainContract) {
            console.error("Contract not initialized.");
            return null;
        }
        try {
            let weiValue = await this.mainContract.methods.getFunds(this.account).call({from: this.account});
            return Web3.utils.fromWei(weiValue, 'ether');
        } catch (error) {
            console.error("Error reading contract value:", error);
            return null;
        }
    },

    async addFunds() {
        await this.mainContract.methods.addFunds().send({
            from: this.account,
            value: Web3.utils.toWei('1', 'ether'),
        });
    },
};

export default mainContractService;
