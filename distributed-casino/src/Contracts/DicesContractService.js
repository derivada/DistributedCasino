import Web3 from "web3";
import DicesContractArtifact from "./Dices.json"; // Replace with your contract's JSON file

const callbacks = {
    GameStateChanged: () => {
        return;
    },
};
const dicesContractService = {
    web3: null,
    diceContract: null,
    account: null,
    minimumBet: 0,
    events: {},
    listenersDone: false,
    // Account setup
    async setupAccount(acc) {
        this.account = acc;
    },

    // Contract setup
    async setupContract() {
        // Initialize Web3 and set contract instance
        this.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
        const networkId = await this.web3.eth.net.getId();
        const networkData = DiceContractArtifact.networks[networkId];
        if (networkData) {
            this.diceContract = new this.web3.eth.Contract(
                DiceContractArtifact.abi,
                networkData.address
            );
        } else {
            console.error("Contract not deployed to detected network.");
        }
        try {
            let minBetWei = await this.diceContract.methods.minimumBet().call();
            this.minimumBet = Web3.utils.fromWei(minBetWei, "ether");
        } catch (error) {
            console.log(error);
        }

        if (!this.listenersDone) {
            console.log("Adding the listeners...");
            this.listenersDone = true;
            this.diceContract.events
                .GameStateChanged({ fromBlock: "latest" })
                .on("data", (e) => {
                    // fired when we get a new log that matches the filters for the event type we subscribed to
                    let players = e.returnValues.players;
                    let phase = this.getGamePhaseString(
                        Number(e.returnValues.phase)
                    );
                    // Convert to desired frontend format
                    players = players.map((player) => ({
                        addr: player.addr,
                        bet: Web3.utils.fromWei(player.bet, "ether"),
                        betResult: Web3.utils.fromWei(
                            player.betResult,
                            "ether"
                        ),
                        hasVoted: player.hasVoted,
                        isDealer: player.isDealer,
                        playerCards: player.playerCards.map((card) =>
                            Number(card)
                        ),
                        playerTotal: Number(player.playerTotal), // Note: You need to define what playerTotal is
                        hasStood: player.hasStood,
                    }));
                    callbacks.GameStateChanged({ players, phase });
                });
        }
    },

    getGamePhaseString(n) {
        switch (n) {
            case 0:
                return "Ended";
            case 1:
                return "Entering";
            case 2:
                return "Playing";
        }
    },
    // Listener registerers
    async addGameStateListener(callback) {
        callbacks.GameStateChanged = callback;
    },


    async getPlayers() {
        return await this.diceContract.methods.getPlayers().call();
    },
    async getContractOwner() {
        return await this.diceContract.methods.owner().call();
    },
    async getMainContract() {
        return await this.diceContract.methods.mainContractAddr().call();
    },
    async getMinimumBet() {
        let minBet = await this.diceContract.methods.minimumBet().call();
        return Web3.utils.fromWei(minBet, "ether");
    },
    async getGamePhase() {
        let phaseN = await this.diceContract.methods.phase().call();
        return this.getGamePhaseString(Number(phaseN));
    },
    async getTotalBets() {
        let total = await this.diceContract.methods.totalBets().call();
        return Web3.utils.fromWei(total, "ether");
    },
    async getMaxPlayers() {
        let players = await this.diceContract.methods.maxPlayers().call();
        return Number(players);
    },
    // Room actions
    async joinGame(bet) {
        let betWei = Web3.utils.toWei(bet, "ether");
        if (!this.diceContract) return null;
        try {
            await this.diceContract.methods
                .joinGame(betWei)
                .send({ from: this.account });
        } catch (error) {
            if (error.data) console.log(error.data.message);
        }
    },

    async voteStart() {
        if (!this.diceContract) return null;
        try {
            await this.diceContract.methods
                .voteStart()
                .send({ from: this.account });
        } catch (error) {
            if (error.data) console.log(error.data.message);
        }
    },

    // Game actions
    async stand() {
        if (!this.diceContract) return null;
        try {
            await this.diceContract.methods
                .stand()
                .send({ from: this.account });
        } catch (error) {
            if (error.data) console.log(error.data.message);
        }
    },

    async hit() {
        if (!this.diceContract) return null;
        try {
            await this.diceContract.methods.hit().send({ from: this.account });
        } catch (error) {
            if (error.data) console.log(error.data.message);
        }
    },
};

export default dicesContractService;
