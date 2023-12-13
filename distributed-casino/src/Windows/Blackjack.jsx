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
    const [wantsToJoin, setWantsToJoin] = useState(false) // If the user wants to join the game or not
    const [bet, setBet] = useState(0); // The bet of the player
    const [minimumBet, setMinimumBet] = useState(0); // The minimum bet in the room
    const [vote, setVote] = useState(false); // If the user has voted for the start or not
    const [gameEnded, setGameEnded] = useState(false) // If the game has ended
    const [players, setPlayers] = useState([]); // The structure of the users, reflects the blockchain status and its initialized with the dealer

    /* Event listener for contract events */
    const gameStateChanged = (({players, phase}) => {
        if(phase === 'Ended' && players.length > 1) {
            setGameEnded(true);
        }
        console.log('Game state changed')
        setPlayers(players);
        setGamePhase(phase)

    })

    const getRoomVariables = () => {
        blackContractService.getGamePhase().then(setGamePhase); // Get the current phase of the game
        blackContractService.getMaxPlayers().then(setMaxPlayers); // Get the maximum amount of players of the game
        blackContractService.getMinimumBet().then(setMinimumBet); // Get the minimum bet of the game
        blackContractService.getPlayers().then(setPlayers)
    }

    // To be done in account change
    useEffect(() => {
        // TODO maybe should reload the page as all data is based on account
        blackContractService.setupAccount(account);
    }, [account])
    
    // To be done in page reload
    useEffect(() => {
        blackContractService.setupContract().then( () => {
            blackContractService.addGameStateListener(gameStateChanged);
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
            setGameEnded(false);
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
    const resetUI = () => {
        // Destroys all room variables and sends user to the join a game screen
        setWantsToJoin(false);
        setBet(0);
        setVote(false);
        setGameEnded(false);
        setPlayers([]);
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
        if (!player.hasStood)
            return <h6 className="font-monospace text-secondary fw-semibold d-inline-block bg-dark p-1 rounded">Playing</h6>
        else if (player.playerTotal <= 21)
            return <h6 className="font-monospace fw-semibold text-primary d-inline-block bg-dark p-1 rounded">Stood</h6>
        else
            return <h6 className="font-monospace fw-semibold text-danger d-inline-block bg-dark p-1 rounded">Busted</h6>
    }

    const allPlayersVoted = () => players.length > 1 && players.every((p) => p.hasVoted)
    
    const playComponent = () => (
        <div className="row rounded" style={{ backgroundColor: "#458248" }}>
            <div className="col-9">
                {players.filter((obj) => obj.addr == ADDRESS_0).map((player) => (
                    <div key={player.addr} className="m-2 p-3 rounded">
                        <div className="d-flex align-items-center">
                            <h1 className="me-2">Dealer</h1>
                            {getPlayerStatus(player)}
                        </div>
                        <div>
                            {player.playerCards.map((card) => (
                                <img src={getCardLocation(card)} className="mx-1 rounded" height={100}></img>
                            ))}
                        </div>
                    </div>
                ))}
                { gameEnded && (
                    <div className="col-6 d-flex flex-column flex-justify-center border border-light rounded m-2 p-3 bg-dark">
                        <h3 className="mb-2">The game has ended!</h3>
                        <div className="mb-2">
                        {(() => {
                            let player = players.find(obj => obj.addr === account);
                            let result = (player && player.betResult) ? player.betResult : 0;
                            return (
                                <div>
                                    {result > 0 ? (
                                        <h3 className="text-success">You won <span className="ms-1 fst-bold">{result} ETH</span></h3>
                                    ) : (
                                        <h3 className="text-danger">You lost <span className="ms-1 fst-bold">{result} ETH</span></h3>
                                    )}
                                </div>
                            );
                        })()}
                        </div>
                    <button className="btn btn-primary fs-4" onClick={resetUI}>Play again!</button>
                    </div>
                )}
                {players.filter((obj) => obj.addr == account).map((player) => {
                    return (
                        <div key={player.addr} className="m-2 p-3 rounded">
                            <div className="d-flex align-items-center">
                                <h1 className="me-2">You</h1>
                                {getPlayerStatus(player)}
                            </div>                                        
                            <h3 className="font-primary fw-semibold">Your bet: {player.bet} ETH</h3>
                            <div className="mb-3">
                                {player.playerCards.map((card) => (<img src={getCardLocation(card)} className="mx-1 rounded" height={100}/>))}
                            </div>
                            <div className="d-flex">
                                <button className="btn btn-primary fs-4 me-3" onClick={hit}>Hit</button>
                                <button className="btn btn-secondary fs-4" onClick={stand}>Stand</button>
                            </div>
                        </div>
                    );
                })}
            </div>
            <aside className="col-3">
                {players.filter((obj) => obj.addr != account && obj.addr != ADDRESS_0).map((player) => (
                        <div className="bg-dark m-2 p-3 rounded">
                            <div className="d-flex align-items-center">
                                <h5 className="me-2">{player.addr.substring(0,6)}...</h5>
                                {getPlayerStatus(player)}
                            </div>
                            <p className="font-primary fw-semibold">
                                {player.bet} ETH
                            </p>
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
    )

    const votingComponent = () => (
        <>
            <div className="p-2 rounded-2 mb-3 container">
                <div className="row">
                    <label className="fw-light fs-4 me-2 col-auto">Place a bet</label>
                    <input value={bet} onChange={(e) => setBet(e.target.value)} type="text" className="form-control me-2 col"/>
                    <button onClick={enterBet} disabled={!bet} className="btn btn-outline-primary col-2">Enter round</button>
                </div>
            </div>
            <div className="p-2 rounded-2 mb-3 container">
                <div className="row">
                    <div className="fs-4 col">
                        Players ready:
                        <span className="text-warning ms-3 me-1">{players.filter(player => player.hasVoted).length - 1}</span> 
                        /
                        <span className="text-primary px-1">{players.length - 1}</span>
                    </div>
                    <button onClick={voteStart} disabled={!vote && !bet} className="btn btn-outline-primary col-2">I'm ready</button>
                </div>
            </div>
        </>
    )

    const noJoinComponent = () => (
        <div className="border border-primary rounded p-5">
            <h3>Sorry, the Blackjack game is already running</h3>
            <h5 className="fw-light">This page will refresh and you will be able to join when it finishes</h5>
        </div>
    )

    const gameStartedComponent = () => {
        console.log(players)
        if(players.filter(aux => aux.addr == account).length == 1) {
            return playComponent()
        }
        return noJoinComponent()
    }

    const canJoinComponent = () => (
        <div className="border border-primary rounded p-5">
            <h3 className='mb-3'>The game hasn't started yet!</h3>
            <button className="btn btn-outline-primary col-12" onClick={joinRoom}>Start betting</button>
        </div>
    )

    return (
        <div className="container-fluid">
            <Navbar selectedLink="Blackjack"/>
            <div className="row pt-3 ps-3">
                <main className="col">
                    <div className="d-flex justify-content-between">
                        <h1 className="fw-bold">
                            Blackjack
                        </h1>
                        <div className="text-end">
                            <h6>Minimum bet:
                                {minimumBet && (<span className=" ms-2 text-primary">{minimumBet} ETH</span>)}
                            </h6>
                            <div>Play responsibly</div>
                        </div>
                    </div>
                    { !wantsToJoin ? (
                        <div className="row" style={{ height: '80%' }}>
                            { /* Pre-game screen, asks if you want to join to the game if it has not already been started */ }
                            <div className="col-12 d-flex align-items-center justify-content-center" >
                                {canJoinComponent()}
                            </div>
                        </div>
                    ) : (
                        <div>
                            { /* Game screen, asks the user to place his bet and vote for the start, and then displays the game */ }
                            {votingComponent()}
                            {allPlayersVoted() ? gameStartedComponent() : (
                                <div>
                                    <h3>Welcome to the <span className="fw-light text-primary">All<span className="fw-semibold">In</span>Casino's </span> Blackjack room</h3>
                                    <h5>The game will start when all players are ready</h5> 
                                </div>
                            )}
                        </div>
                    )}
                </main>
                <FundsControl update={gamePhase}/>
            </div>
        </div>
    );
}

export default Blackjack;
