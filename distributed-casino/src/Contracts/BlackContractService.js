import Web3 from "web3";
import BlackContractArtifact from "./Blackjack.json" // Replace with your contract's JSON file

const blackContractService = {
    web3: null,
    blackContract: null,
    account: null,
    minimumBet: 0,
    listener: false,

    async init(accountIn) {
        this.account = accountIn;
        // Initialize Web3 and set the contract instance
        this.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
        const networkId = await this.web3.eth.net.getId();
        const networkData = BlackContractArtifact.networks[networkId];
        if (networkData) {
            this.blackContract = new this.web3.eth.Contract(
                BlackContractArtifact.abi,
                networkData.address
            );
        } else {
            console.error("Contract not deployed to detected network.");
        }
        try {
            let minBetWei = await this.blackContract.methods
                .minimumBet()
                .call();
            this.minimumBet = Web3.utils.fromWei(minBetWei, 'ether');
            return this.minimumBet;
        } catch (error) {
            console.log(error);
        }
    },

    async listenPlayerJoin() {
        if (!this.blackContract)
            return null
        if (this.listener)
            return
        this.listener = true;
        console.log('adding listener')
        /*
        this.blackContract.events.PlayerJoined({}, (error, event) => {
            if (error) {
                console.error('Error:', error);
            } else {
                console.log('Event received:', event);
            }
        });*/
        let eventListenerRizzOhioSkidibiusyy = this.blackContract.events.PlayerJoined({})
        console.log(this.blackContract.events.PlayerJoined({}))
        eventListenerRizzOhioSkidibiusyy.on('connected', function (subId) {
            console.log("conn")
        })
        eventListenerRizzOhioSkidibiusyy.on('data',function (event) {
            console.log("data")
        })
    },

    async joinGame(bet) {
        let betWei = Web3.utils.toWei(bet, "ether");
        if (!this.blackContract)
            return null
        try {
            await this.blackContract.methods.joinGame(betWei).send({ from: this.account })
        } catch(error) {
            if(error.data)
                console.log(error.data.message)
        }
    },

};

export default blackContractService;
