import React, { useState, useEffect } from 'react'

import { useStore } from 'react-context-hook'

import "../Styles/Home.css";
import "../Styles/custom.css";
import Navbar from '../Components/Navbar';
import FundsControl from '../Components/FundsControl';

import blackContractService from "../Contracts/BlackContractService";

import { getCardLocation, getCardName } from "../cards";

const ADDRESS_0 = "0x0000000000000000000000000000000000000000"; // address(0), the address of the cards dealer

function Blackjack() {
    // React variables
    const [account, setAccount] = useStore('account'); // The account of the players, stored as global state
    const [gamePhase, setGamePhase] = useState('Betting') // The state of the game
    const [maxPlayers, setMaxPlayers] = useState(0); // The maximum amount of players in this room
    const [wantsToJoin, setWantsToJoin] = useStore('false') // If the user wants to join the game or not
    const [bet, setBet] = useState(0); // The bet of the player
    const [minimumBet, setMinimumBet] = useState(0); // The minimum bet in the room
    const [vote, setVote] = useState(false); // If the user has voted for the start or not

    const [players, setPlayers] = useState([{
        addr: ADDRESS_0,
        bet: 0,
        hasVoted: true,
        isDealer: true,
        playerCards: [],
        playerTotal: 0,
        hasStood: false,
    }]); // The structure of the users, reflects the blockchain status and its initialized with the dealer

    /* Event listeners to contract events */
    
    /*const playerJoin = ({address, amount}) => {
        setPlayers(prevPlayers => {
            if (prevPlayers.filter(p => p.addr == address).length > 0)
                return [...prevPlayers]
            return([...prevPlayers, {
            addr: address,
            bet: amount,
            playerCards: [],
            hasStood: false,
            bust: false,
            hasVoted: false,
        }])})
    };
    
    let playerVote = ({address, totalVoted}) => {
        setPlayers(prevPlayers => {
            prevPlayers.find((p) => p.addr == address).hasVoted = true;
            return [...prevPlayers];
        });
        setPlayersVoted(totalVoted);
    }

    const cardDeal = ({address, card}) => {
        setPlayers(prevPlayers => {
            prevPlayers.find((p) => p.addr == address).playerCards.push(card);
            return [...prevPlayers];
        })
    }

    const playerStand = ({address, total}) => {
        setPlayers(prevPlayers => {
            let player = prevPlayers.find((p) => p.addr == address);
            player.hasStood = true;
            if(total > 21) player.bust = true;
            return [ ...prevPlayers ];       
        })
    }
    */
    const gameStateChanged = (({players, phase}) => {
        console.log('estado cambiado')
        setPlayers(players);
        setGamePhase(phase)
    })

    // Register listeners for contract events
    const registerListeners = () => {
        blackContractService.addGameStateListener(gameStateChanged);
        //blackContractService.addPlayerJoinedListener(playerJoin);
        //blackContractService.addPlayerVotedListener(playerVote);
        //blackContractService.addCardDealtListener(cardDeal);
        //blackContractService.addPlayerStoodListener(playerStand);
    }

    const getRoomVariables = () => {
        blackContractService.getGamePhase().then(setGamePhase); // Get the current phase of the game
        blackContractService.getMaxPlayers().then(setMaxPlayers); // Get the maximum amount of players of the game
        blackContractService.getMinimumBet().then(setMinimumBet); // Get the minimum bet of the game
    }

    // To be done in account change
    useEffect(() => {
        // TODO maybe should reload the page as all data is based on account
        blackContractService.setupAccount(account);
    }, [account])
    
    // To be done in page reload
    useEffect(() => {
        blackContractService.setupContract().then( () => {
            registerListeners(); // Hook up event listeners
            getRoomVariables(); // Get the basic information of the room
        }); 
    }, [])

    // Join the room, get the players already in the room and their voting status
    const joinRoom = () => {
        blackContractService.getPlayers().then((players) => {
            players.forEach(player => {
                console.log("Player Information:");
                console.log("Bet:", player.bet);
                console.log("Has Voted:", player.hasVoted);
                console.log("Is Dealer:", player.isDealer);
                console.log("Player Cards:", player.playerCards);
                console.log("Player Total:", player.playerTotal);
                console.log("Has Stood:", player.hasStood);
                console.log("-------------");
              });
            setPlayers([... players]);
            setWantsToJoin(true);
        })
    }

    // Room actions, able user to enter a bet, confirming his participation and later vote for the start of the game when he is ready 
    const enterBet = () => {
        blackContractService.joinGame(bet)
    }

    const voteStart = () => {
        blackContractService.voteStart().then(() => {
            setVote(true);
        })
    }

    // Game actions, in Blackjack you can either hit (take a card) or stand (finish your turn)
    const hit = () => {
        blackContractService.hit()
    }
    const stand = () => {
        blackContractService.stand()
    }

    // Helper function for retrieving a styled string with the status of a player based on his obj. attributes
    const getPlayerStatus = (player) => {
        if (!player.stood)
            return <h5 className="font-secondary fw-semibold">Playing</h5>
        else if (!player.busted)
            return <h5 className="font-primary fw-semibold">Stood</h5>
        else
            return <h5 className="font-danger fw-semibold">Busted</h5>
    }
    
    return (
        <div className="container-fluid">
            <Navbar selectedLink="Home" />
            <div className="row pt-3">
                <aside className="col-2 d-flex flex-column">
                    <h2 className="fw-light">Room activity</h2>
                    <div className="border border-secondary rounded flex-grow-1 m-2 p-1"></div>
                </aside>
                <main className="col-7">
                    <div className="d-flex justify-content-between">
                        <h1 className="fw-bold">
                            Blackjack
                        </h1>
                        <div className="text-end">
                            <h6>Minimum bet:
                                {
                                    minimumBet && (
                                        <span className=" ms-2 text-primary">{minimumBet} ETH</span>
                                    )
                                }
                            </h6>
                            <div>Play responsibly</div>
                        </div>
                    </div>
                    { !wantsToJoin ? (
                        <div className="row" style={{ height: '80%' }}>
                        { /* Pre-game screen, asks if you want to join to the game if it has not already been started */}
                        <div className="col-12 d-flex align-items-center justify-content-center" >
                            {
                                gamePhase === 'Betting' ? (
                                    <div className="border border-primary rounded p-5">
                                        <h3 className='mb-3'>The game hasn't started yet!</h3>
                                        <button className="btn btn-outline-primary col-12" onClick={joinRoom}>Start betting</button>
                                    </div>
                                ) : (
                                    <div className="border border-primary rounded p-5">
                                        { /* Game is already running, ask the user to wait */}
                                        <h3>Sorry, the Blackjack game is already running</h3>
                                        <h5 className="fw-light">This page will refresh and you will be able to join when it finishes</h5>
                                    </div>
                                )
                            }
                        </div>
                        </div>
                    ) : (
                    <div>
                    {/* Game screen, asks the user to place his bet and vote for the start, and then displays the game */}
                    <div className="p-2 rounded-2 mb-3 container">
                        <div className="row">
                            <label className="fw-light fs-4 me-2 col-auto">
                                Place a bet
                            </label>
                            <input
                                value={bet}
                                onChange={(e) => {
                                    setBet(e.target.value);
                                }}
                                type="text"
                                className="form-control me-2 col"
                            />
                            <button
                                onClick={enterBet}
                                disabled={!bet}
                                className="btn btn-outline-primary col-2"
                            >
                                Enter round
                            </button>
                        </div>
                        {/* <div>
                            {players.map((player) => (
                                <p>
                                    <span className="font-monospace">{player.address}</span> bets 
                                    <span className="font-primary fw-semibold">{player.bet} ETH</span>
                                </p>
                            ))}
                        </div> */}
                    </div>

                    <div className="p-2 rounded-2 mb-3 container">
                        <div className="row">
                            <div className="fs-4 col">
                                Players ready:
                                <span className="text-warning ms-3 me-1">{players.filter(player => player.hasVoted).length - 1}</span> 
                                /
                                <span className="text-primary px-1">{players.length - 1}</span>
                            </div>
                            <button
                                onClick={voteStart}
                                disabled={!vote && !bet}
                                className="btn btn-outline-primary col-2"
                            >
                                I'm ready
                            </button>
                        </div>
                    </div>
                    {vote ? (
                    <div
                        className="row rounded"
                        style={{ backgroundColor: "#458248" }}
                    >
                        <div className="col-9">
                            {players.filter((obj) => obj.addr == ADDRESS_0).map((player) => {
                                return (
                                    <div key={player.addr} className="m-2 p-3 rounded">
                                        <h1 className="font-monospace">
                                            Dealer
                                        </h1>
                                        {player.playerCards.map((card) => (
                                            <img
                                                src={getCardLocation(card)}
                                                className="mx-1 rounded"
                                                height={100}
                                            ></img>
                                        ))}
                                    </div>
                                );
                            })}
                            {players.filter((obj) => obj.addr == account).map((player) => {
                                return (
                                    <div
                                        key={player.addr}
                                        className="m-2 p-3 rounded"
                                    >
                                        <h1 className="font-monospace">You</h1>
                                        <h3 className="font-primary fw-semibold">
                                            Your bet: {player.bet} ETH
                                        </h3>
                                        {getPlayerStatus(player)}
                                        <div>
                                            {player.playerCards.map((card) => (
                                                <img
                                                    src={getCardLocation(card)}
                                                    className="mx-1 rounded"
                                                    height={100}
                                                ></img>
                                            ))}
                                        </div>
                                        <div className="d-flex justify-content-aaround">
                                            <button
                                                className="btn btn-primary fs-2"
                                                onClick={hit}
                                            >
                                                Hit
                                            </button>
                                            <button
                                                className="btn btn-secondary fs-2"
                                                onClick={stand}
                                            >
                                                Stand
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <aside className="col-3">
                            {players.filter((obj) => obj.addr != account && obj.addr != ADDRESS_0).map((player) => (
                                    <div className="bg-dark m-2 p-3 rounded">
                                        <h6 className="font-monospace fw-semibold">
                                            {player.addr.substring(0, 6) + "..."}
                                        </h6>
                                        <p className="font-primary fw-semibold">
                                            {player.bet} ETH
                                        </p>
                                        {getPlayerStatus(player)}
                                        {player.playerCards.map((card) => (
                                            <img
                                                src={getCardLocation(card)}
                                                className="mx-1 rounded"
                                                height={40}
                                            ></img>
                                        ))}
                                    </div>
                                ))}
                        </aside>
                    </div>
                    ) : (
                        <div>
                            <h3>Welcome to the <span className="fw-light text-primary">All<span className="fw-semibold">In</span>Casino's </span> Blackjack room</h3>
                            <h5>The game will start when all players are ready</h5> 
                        </div>
                    )}
                    </div>)}
                </main>
                <FundsControl/>
            </div>
        </div>
    );
}

export default Blackjack;
