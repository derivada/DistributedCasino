import Web3 from "web3";
import BlackContractArtifact from "./Blackjack.json" // Replace with your contract's JSON file
const callbacks = {
    PlayerJoined: () => {return},
    PlayerVoted: () => {return},
    GamePhaseChanged: () => {return},
    CardDealt: () => {return},
    PlayerStood: () => {return},
    GameResult: () => {return},
}
const blackContractService = {
    web3: null,
    blackContract: null,
    account: null,
    minimumBet: 0,
    events: {},
    
    async init(accountIn) {
        if (this.account)
            return
        console.log("INIT");
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
        } catch (error) {
            console.log(error);
        }
        const event_types = ['PlayerJoined', 'PlayerVoted', 'GamePhaseChanged', 'CardDealt', 'PlayerStood', 'GameResult']
        if (!this.events.hasOwnProperty("PlayerJoined")) { // Run this only once
            event_types.forEach(event_type => {
                this.events[event_type] = this.blackContract.events[event_type]({})
            })
            this.events['PlayerJoined'].on('data', function (event) {
                let values = event.returnValues;
                console.log('event', values)
                callbacks['PlayerJoined']({
                    address: values.player,
                    amount: Web3.utils.fromWei(values.amount, "ether"),
                    totalPlayers: Number(values.totalPlayers),
                });
            })
            this.events['PlayerVoted'].on('data',function (event) {
                let values = event.returnValues;
                callbacks['PlayerVoted']({address: values.player, totalVoted: Number(values.amount)})
            })
            this.events['GamePhaseChanged'].on('data', function (event) {
                let values = event.returnValues;
                callbacks['GamePhaseChanged']({address: values[0]})
            })
            this.events["CardDealt"].on("data", function (event) {
                let values = event.returnValues;
                callbacks['CardDealt']({ address: values.player, card: Number(values.card) });
            });
            this.events['PlayerStood'].on('data',function (event) {
                let values = event.returnValues;
                callbacks['PlayerStood']({address: values[0], total: Number(values[1])})
            });
            this.events['GameResult'].on('data',function (event) {
                let values = event.returnValues;
                callbacks['GameResult']({address: values[0], hasWon: values[1], hasBlackjack: values[2]})
            });
        }
    },
    async addPlayerJoinedListener(callback) {
        callbacks['PlayerJoined'] = callback;
    },    
    async addPlayerVotedListener(callback) {
        callbacks['PlayerVoted'] = callback;
    },
    async addGamePhasedChangedListener(callback) {
        callbacks['GamePhaseChanged'] = callback;
    },
    async addCardDealtListener(callback) {
        callbacks['CardDealt'] = callback;
    },
    async addPlayerStoodListener(callback) {
        callbacks['PlayerStood'] = callback;
    },
    async addGameResultListener(callback) {
        callbacks['GameResult'] = callback;
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
    
    async voteStart() {
        if (!this.blackContract)
            return null
        try {
            await this.blackContract.methods.voteStart().send({ from: this.account })
        } catch(error) {
            if(error.data)
                console.log(error.data.message)
        }
    },

    async stand() {
        if (!this.blackContract)
            return null;
        try {
            await this.blackContract.methods.stand().send({ from: this.account })
        } catch(error) {
            if(error.data)
                console.log(error.data.message)
        }
    },

    async hit() {
      if(!this.blackContract)
        return null
        try {
            await this.blackContract.methods.hit().send({ from: this.account })
        } catch(error) {
            if(error.data)
                console.log(error.data.message)
        }
    },
};

export default blackContractService;
