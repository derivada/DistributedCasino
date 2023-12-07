import Web3 from "web3";
import MainContractArtifact from "./Main.json"; // Replace with your contract's JSON file

const mainContractService = {
    web3: null,
    mainContract: null,
    account: null,
    funds: null,

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
            return null;
        }
        try {
            let weiValue = await this.mainContract.methods.getFunds(this.account).call({from: this.account});
            this.funds = Web3.utils.fromWei(weiValue, "ether");
            return this.funds
        } catch (e) {
            return null;
        }
    },

    async addFunds(amount) {
        console.log(amount)
        if(!this.mainContract)
            throw new Error("Account is not linked yet")
        try {
            await this.mainContract.methods.addFunds().send({
                from: this.account,
                value: Web3.utils.toWei(amount, "ether"),
            });
        } catch (error) {
            throw new Error("Transaction didn't succeed");
        }
        return this.getFunds()
    },

    async retrieveFunds(amount) {
        if (!this.mainContract) throw new Error("Account is not linked yet");
        try {
            await this.mainContract.methods
                .retrieveFunds(Web3.utils.toWei(amount, "ether"))
                .send({
                    from: this.account,
                });
        } catch (error) {
            // Handle errors here
            throw new Error("Transaction didn't succeed");
        }
        return this.getFunds();
    }

};

export default mainContractService;
