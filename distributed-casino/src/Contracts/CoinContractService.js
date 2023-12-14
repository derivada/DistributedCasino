import Web3 from "web3";
import CoinContractArtifact from "./CoinFlip.json"; // Replace with your contract's JSON file


const callbacks = {
    GameStateChanged: () => {
        return;
    },
};



const coinContractService = {
    web3: null,
    coinContract: null,
    account: null,
    roundBet: 0,
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
        const networkData = CoinContractArtifact.networks[networkId];
        if (networkData) {
            this.coinContract = new this.web3.eth.Contract(
                CoinContractArtifact.abi,
                networkData.address
            );
        } else {
            console.error("Contract not deployed to detected network.");
        }
        this.phase = await this.coinContract.methods.phase.call();
        if (!this.listenersDone) {
            console.log("Adding the listeners...");
            this.listenersDone = true;
            this.coinContract.events.GameStateChanged({ fromBlock: "latest" }).on("data", (e) => {
                // fired when we get a new log that matches the filters for the event type we subscribed to
                let players = e.returnValues.players;
                this.phase = this.getGamePhaseString(
                    Number(e.returnValues.phase)
                );
                // Convert to desired frontend format
                players = players.map((player) => ({
                    addr: player.addr,
                    hasVoted: player.hasVoted,
                    wantsDouble: player.wantsDouble,
                    side: player.side == 1,
                    betResult: Web3.utils.fromWei(player.betResult ?? 0, "ether"),
                }));
                callbacks.GameStateChanged({ playersIn: players, phase: this.phase });
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
        if (!this.coinContract) return
        return this.coinContract.methods.getPlayers().call().then((players) => {
            return players.map((player) => {
                return {
                    addr: player.addr,
                    hasVoted: player.hasVoted,
                    wantsDouble: player.wantsDouble,
                    side: player.side == 1,
                    betResult: Web3.utils.fromWei(player.betResult ?? 0, "ether"),
                }
            })
        })
    },

    async getCoin() {
        if (!this.coinContract) return;
        return this.coinContract.methods.lastCoin().call().then((coin) => {
            return coin==1
        });
    },

    async getCurrentBet() {
        if (!this.coinContract) return;
        let currentBet = await this.coinContract.methods.currentBet().call();
        return Web3.utils.fromWei(currentBet, "ether");
    },

    async getGamePhase() {
        if (!this.coinContract) return;
        let phase = await this.coinContract.methods.phase().call();
        return this.getGamePhaseString(Number(phase))
    },

    // Room actions
    async joinGame() {
        if (!this.coinContract) return null;
        try {
            await this.coinContract.methods.joinGame().send({ from: this.account });
        } catch (error) {
            if (error.data) console.log(error.data.message);
        }
    },

    // Game actions
    
    async voteDouble(vote) {
        if (!this.coinContract) return null;
        try {
            await this.coinContract.methods.voteDouble(vote).send({ from: this.account });
        } catch (error) {
            if (error.data) console.log(error.data.message);
        }
    },

    async chooseSide(heads) {
        if (!this.coinContract) return null;
        try {
            await this.coinContract.methods.chooseSide(heads).send({ from: this.account })
        } catch (error) {
            console.log(error)
        }
    }
};

export default coinContractService;
