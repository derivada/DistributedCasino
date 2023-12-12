import Web3 from "web3";
import DicesContractArtifact from "./Dices.json"; // Replace with your contract's JSON file

const callbacks = {
    GameStateChanged: () => {
        return;
    },
};
const diceContractService = {
    web3: null,
    diceContract: null,
    account: null,
    minimumBet: 0,
    events: {},
    listenersDone: false,
    phase: "Ended",
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
        const networkData = DicesContractArtifact.networks[networkId];
        if (networkData) {
            this.diceContract = new this.web3.eth.Contract(
                DicesContractArtifact.abi,
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
        this.phase = await this.diceContract.methods.phase.call()
        if (!this.listenersDone) {
            console.log("Adding the listeners...");
            this.listenersDone = true;
            this.diceContract.events.GameStateChanged({ fromBlock: "latest" }).on("data", (e) => {
                // fired when we get a new log that matches the filters for the event type we subscribed to
                let players = e.returnValues.players;
                this.phase = this.getGamePhaseString(
                    Number(e.returnValues.phase)
                );
                // Convert to desired frontend format
                players = players.map((player) => ({
                    addr: player.addr,
                    bet: Web3.utils.fromWei(player.bet, "ether"),
                    hasVoted: player.hasVoted,
                    hasPlayed: player.hasPlayed,
                    hasStood: player.hasStood,
                }));
                callbacks.GameStateChanged({ players, phase: this.phase });
            });
        }
    },

    getGamePhaseString(n) {
        switch (n) {
            case 0:
                return "Ended";
            case 1:
                return "Playing";
        }
    },
    // Listener registerers
    async addGameStateListener(callback) {
        callbacks.GameStateChanged = callback;
    },


    async getPlayers() {
        return await this.diceContract.methods.getPlayers().call().then((players) => {
            return players.map((player) => {
                return {
                    addr: player.addr,
                    bet: Web3.utils.fromWei(player.bet, "ether"),
                    hasVoted: player.hasVoted,
                    isDealer: player.isDealer,
                    playerTotal: Number(player.playerTotal),  // Note: You need to define what playerTotal is
                    hasStood: player.hasStood,
                    hasPlayed: player.hasPlayed,
                }
            })
        });
    },
    async getDices() {
        try {
            if (this.phase == "Playing") {
                return await this.diceContract.methods.getDices().call({from: this.account});
            }
        } catch (error) {
            console.log(error)
        }
        return []
    },
    async getContractOwner() {
        return await this.diceContract.methods.owner().call();
    },
    async getMainContract() {
        return await this.diceContract.methods.mainContractAddr().call();
    },
    async getRoundBet() {
        let minBet = await this.diceContract.methods.roundBet().call();
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
    async joinGame() {
        if (!this.diceContract) return null;
        try {
            await this.diceContract.methods.joinGame().send({ from: this.account });
        } catch (error) {
            if (error.data) console.log(error.data.message);
        }
    },

    async voteStart() {
        if (!this.diceContract) return null;
        try {
            await this.diceContract.methods.voteStart().send({ from: this.account });
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

    async bet() {
        if (!this.diceContract) return null;
        try {
            await this.diceContract.methods.bet().send({ from: this.account });
        } catch (error) {
            if (error.data) console.log(error.data.message);
        }
    },
};

export default diceContractService;
