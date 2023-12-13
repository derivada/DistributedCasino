import Web3 from "web3";
import CoinContractArtifact from "./Coin.json"; // Replace with your contract's JSON file


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
        const networkData = DicesContractArtifact.networks[networkId];
        if (networkData) {
            this.coinContract = new this.web3.eth.Contract(
                CoinContractArtifact.abi,
                networkData.address
            );
        } else {
            console.error("Contract not deployed to detected network.");
        }
        try {
            let roundBetWei = await this.coinContract.methods.roundBet().call();
            this.roundBet = Web3.utils.fromWei(roundBetWei, "ether");
        } catch (error) {
            console.log(error);
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
                    bet: Web3.utils.fromWei(player.bet, "ether"),
                    hasVoted: player.hasVoted,
                    wantsDouble: player.wantsDouble,
                    side: player.side,
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

    async getMainContract() {
        return await this.diceContract.methods.mainContractAddr().call();
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
    async stand() {
        if (!this.diceContract) return null;
        try {
            await this.diceContract.methods.stand().send({ from: this.account });
        } catch (error) {
            if (error.data) console.log(error.data.message);
        }
    },

    async chooseSide() {
        if (!this.coinContract) return null;
        try {
            await this.coinContract.methods.chooseSide().send({ from: this.account })
        } catch (error) {
            console.log(error)
        }
    }
};

export default diceContractService;
