import Web3 from "web3";
import BlackContractArtifact from "./Blackjack.json" // Replace with your contract's JSON file

const callbacks = {
    PlayerJoined: () => {return},
    PlayerVoted: () => {return},
    GamePhaseChanged: () => {return},
    CardDealt: () => {return},
    PlayerStood: () => {return},
    GameResult: () => {return},
    GameStateChanged: () => {return},
}
const blackContractService = {
    web3: null,
    blackContract: null,
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

        
        if(!this.listenersDone){
            console.log("Adding the listeners...");
            this.listenersDone = true;
            this.blackContract.events.GameStateChanged({ fromBlock: "latest" }).on("data", (e) => {
                // fired when we get a new log that matches the filters for the event type we subscribed to
                let players = e.returnValues.players;
                let phase = this.getGamePhaseString(Number(e.returnValues.phase));
                // Convert to desired frontend format
                players = players.map(player => ({
                    addr: player.addr,
                    bet: Web3.utils.fromWei(player.bet, "ether"),
                    betResult: Web3.utils.fromWei(player.betResult, "ether"),
                    hasVoted: player.hasVoted,
                    isDealer: player.isDealer,
                    playerCards: player.playerCards.map(card => Number(card)),
                    playerTotal: Number(player.playerTotal),  // Note: You need to define what playerTotal is
                    hasStood: player.hasStood,
                }));
                callbacks['GameStateChanged']({players, phase});
            });

            /*this.blackContract.events.PlayerJoined({fromBlock: "latest"}).on('data', e => {
                // fired when we get a new log that matches the filters for the event type we subscribed to
                let values = e.returnValues;
                console.log(values.player + ' joined')
                callbacks['PlayerJoined']({
                    address: values.player,
                    amount: Web3.utils.fromWei(values.amount, "ether"),
                    totalPlayers: Number(values.totalPlayers),
                });
             })*/

            /*this.blackContract.events.PlayerVoted({fromBlock: "latest"}).on('data', e => {
                let values = e.returnValues;
                console.log(values.player  + 'voted');
                callbacks['PlayerVoted']({address: values.player, totalVoted: Number(values.amount)})
            })
        
            this.blackContract.events.GamePhaseChanged({fromBlock: "latest"}).on('data', function (event) {
                let values = event.returnValues;
                console.log('Game phase changed');
                callbacks['GamePhaseChanged']({phase: Number(values.phase) === 0 ? 'Betting' : 'Playing'});
            })
            this.blackContract.events.CardDealt({fromBlock: "latest"}).on("data", function (event) {
                let values = event.returnValues;
                console.log(values.player  + ' got a ' + getCardName(Number(values.card)));
                callbacks['CardDealt']({ address: values.player, card: Number(values.card) });
            });
            this.blackContract.events.PlayerStood({fromBlock: "latest"}).on('data',function (event) {
                let values = event.returnValues;
                console.log(values.player + ' stood with ' + Number(values[1]));
                callbacks['PlayerStood']({address: values[0], total: Number(values[1])})
            });
            this.blackContract.events.GameResult({fromBlock: "latest"}).on('data',function (event) {
                let values = event.returnValues;
                callbacks['GameResult']({address: values[0], hasWon: values[1], hasBlackjack: values[2]})
            });*/
        }
    },
    getGamePhaseString(n) {
        switch (n){
            case 0: return 'Ended';
            case 1: return 'Betting';
            case 2: return 'Playing';
        }
    },
    // Listener registerers
    async addGameStateListener(callback) {
        callbacks['GameStateChanged'] = callback;
    },
    /*
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
    */
    // Getters for public contract variables

    async getPlayers() {
        return await this.blackContract.methods.getPlayers().call().then((players) => {
            return players.map((player) => {
                return {
                    addr: player.addr,
                    bet: Web3.utils.fromWei(player.bet, "ether"),
                    betResult: Web3.utils.fromWei(player.betResult, "ether"),
                    hasVoted: player.hasVoted,
                    isDealer: player.isDealer,
                    playerCards: player.playerCards.map(card => Number(card)),
                    playerTotal: Number(player.playerTotal),  // Note: You need to define what playerTotal is
                    hasStood: player.hasStood,
                }
            })
        });
    },
    async getContractOwner() {
        return await this.blackContract.methods.owner().call();
    },
    async getMainContract() {
        return await this.blackContract.methods.mainContractAddr().call();
    },
    async getMinimumBet() {
        let minBet = await this.blackContract.methods.minimumBet().call();
        return Web3.utils.fromWei(minBet, 'ether'); 
    },
    async getGamePhase() {
        let phaseN = await this.blackContract.methods.phase().call();
        return this.getGamePhaseString(Number(phaseN));
    },
    async getTotalBets() {
        let total = await this.blackContract.methods.totalBets().call();
        return Web3.utils.fromWei(total, 'ether');
    },
    async getMaxPlayers() {
        let players =  await this.blackContract.methods.maxPlayers().call();
        return Number(players);
    },
    // Room actions
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

    // Game actions
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
