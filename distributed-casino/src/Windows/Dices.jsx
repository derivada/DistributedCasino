import React, { useState, useEffect } from "react";

import { useStore } from "react-context-hook";

import "../Styles/Home.css";
import "../Styles/custom.css";
import Navbar from "../Components/Navbar";
import FundsControl from "../Components/FundsControl";

import diceContractService from "../Contracts/DiceContractService";

import { getDiceLocation } from "../dices";

function Dices() {
    // React variables
    const [account, setAccount] = useStore("account"); // The account of the players, stored as global state

    const [dices, setDices] = useState([])
    const [gamePhase, setGamePhase] = useState("Betting"); // The state of the game
    const [maxPlayers, setMaxPlayers] = useState(0); // The maximum amount of players in this room
    const [minPlayers, setMinPlayers] = useState(2)
    const [wantsToJoin, setWantsToJoin] = useState(false); // If the user wants to join the game or not
    const [roundBet, setRoundBet] = useState(0); // The bet per round in the room
    const [vote, setVote] = useState(false); // If the user has voted for the start or not
    const [gameEnded, setGameEnded] = useState(false); // If the game has ended
    const [players, setPlayers] = useState([]); // The structure of the users, reflects the blockchain status

    /* Event listener for contract events */
    const gameStateChanged = ({ playersIn, phase }) => {
        if (phase == "Ended") {
            setGameEnded(true);
        }
        // First set the phase of the game to the received one
        setGamePhase(phase);
        setPlayers(playersIn)
        if(phase == 'Playing'){
            diceContractService.getDices().then(setDices)
        }
    };

    useEffect(() => {
        if (!players)
            return
        const currentPlayer = players.find(p => p.addr === account);
        if (currentPlayer && currentPlayer.dices && currentPlayer.dices.length === 3) {
            console.log('getting final dices');
            setDices(currentPlayer.dices);
        }
    }, [players]);
    
    const getRoomVariables = () => {
        diceContractService.getMaxPlayers().then(setMaxPlayers); // Get the maximum amount of players of the game
        diceContractService.getRoundBet().then(setRoundBet); // Get the round bet of the game
        
        // Get the list of players
        diceContractService.getPlayers().then((p) => {
            setPlayers(p)
            diceContractService.getGamePhase().then(phase => {
                setGamePhase(phase) // Set the phase of the game
                if(phase == 'Playing') // Also get the dices for the player if the phase is Playing
                    diceContractService.getDices().then(setDices)
            });
        });
    };

    // To be done in account change.
    useEffect(() => {
        // TODO maybe should reload the page as all data is based on account
        diceContractService.setupAccount(account);
        getRoomVariables(); // Get the basic information of the room
    }, [account]);

    // To be done in page reload
    useEffect(() => {
        diceContractService.setupContract().then(() => {
            diceContractService.addGameStateListener(gameStateChanged);
        });
    }, []);

    // Join the room, get the players already in the room and their voting status
    const joinRoom = () => {
        diceContractService.getPlayers().then((players) => {
            players.forEach((player) => {
                console.log("Player Information:");
                console.log("Bet:", player.bet);
                console.log("Has Voted:", player.hasVoted);
                console.log("Has Stood:", player.hasStood);
                console.log("-------------");
            });
            setPlayers([...players]);
            setWantsToJoin(true);
            setGameEnded(false);
        });
        getRoomVariables()
    };

    const voteStart = () => {
        diceContractService.voteStart().then(() => {
            setVote(true);
        });
    };
    const resetUI = () => {
        // Destroys all room variables and sends user to the join a game screen
        setWantsToJoin(false);
        setVote(false);
        setGameEnded(false);
        setPlayers([]);
    };
    // Game actions, in Dices you can either hit (roll a dice) or stand (finish your turn)
    const joinGame = () => {
        diceContractService.joinGame();
    }
    const hitBet = () => {
        diceContractService.bet();
    };
    const stand = () => {
        diceContractService.stand();
    };

    // Helper function for retrieving a styled string with the status of a player based on his obj. attributes
    const getPlayerStatus = (player) => {
        if (!player.hasPlayed)
            return (
                <h6 className="font-monospace text-secondary fw-semibold d-inline-block bg-dark p-1 rounded">
                    Choosing
                </h6>
            );
        else if (!player.hasStood)
            return (
                <h6 className="font-monospace text-primary fw-semibold d-inline-block bg-dark p-1 rounded">
                    Hit
                </h6>
            );
        return (
            <h6 className="font-monospace fw-semibold text-warning d-inline-block bg-dark p-1 rounded">
                Stood
            </h6>
        );
    };

    const allPlayersVoted = () => players.length > 0 && players.every((p) => p.hasVoted);

    const otherDices = (index) => {
        return players.filter(p=>p.addr!=account)[index].dices.map((dice,idx)=>(
            <img key={index + "-" + idx} src={getDiceLocation(dice)} className="mx-1 rounded" height={100}></img>
        ))
    }

    const playComponent = () => (
        <div  className="row rounded"  style={{ backgroundColor: "#458248" }}>
            <div className="col-9">
                {gameEnded && (
                    <div className="col-6 d-flex flex-column flex-justify-center border border-light rounded m-2 p-3 bg-dark">
                        <h3 className="mb-2">
                            The game has ended!
                        </h3>
                        <div className="mb-2">
                            {(() => {
                                let player = players.find((obj) => obj.addr === account);
                                let result = player && player.betResult ? player.betResult : 0;
                                return (
                                    <div>{result > 0 ? (
                                            <h3 className="text-success">
                                                You won{" "}
                                                <span className="ms-1 fst-bold">{result}{" "}ETH</span>
                                            </h3>
                                        ) : (
                                            <h3 className="text-danger">
                                                You lost{" "}
                                                <span className="ms-1 fst-bold">{result}{" "}ETH</span>
                                            </h3>
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
                            <h3 className="font-primary fw-semibold">
                                Your bet:{" "}
                                {player.bet} ETH
                            </h3>
                            <div className="mb-3">
                                {dices.map((dice, index) => (
                                    <img key={account + "-" + index} src={getDiceLocation(dice)} className="mx-1 rounded" height={100}></img>
                                ))}
                            </div>
                            <div className="d-flex">          
                                <button className="btn btn-primary fs-4 me-3" onClick={hitBet}>
                                    Hit
                                </button>
                                <button className="btn btn-secondary fs-4" onClick={stand}>
                                    Stand
                                </button>
                            </div>
                        </div>
                    )})}
            </div>
            <aside className="col-3">
                {players.filter((obj) =>  obj.addr != account).map((player,index) => (
                    <div className="bg-dark m-2 p-3 rounded">
                        <div className="d-flex align-items-center">
                            <h5 className="me-2">{player.addr.substring(0,6)}...</h5>
                            {getPlayerStatus(player)}
                            <div className="mb-3">
                                {players[0] && players[0].dices && players[0].dices.length > 1 && (otherDices(index))}
                            </div>
                        </div>
                        <p className="font-primary fw-semibold">{player.bet} ETH</p>
                    </div>
                    ))}
            </aside>
        </div>
    )

    const votingComponent = () => (
        <>
            <div className="p-2 rounded-2 mb-3 container">
                <div className="row">
                    <button onClick={joinGame} className="btn btn-outline-primary col-2">
                        Enter round
                    </button>
                </div>
            </div>
            <div className="p-2 rounded-2 mb-3 container">
                <div className="row">
                    <div className="fs-4 col">
                        Players ready:
                        <span className="text-warning ms-3 me-1">
                            {players.filter((player) => player.hasVoted).length}
                        </span>
                        /
                        <span className="text-primary px-1">
                            {players.length}
                        </span>
                    </div>
                    <button onClick={voteStart} disabled={vote || !(players.filter((p) => p.addr == account).length == 1)} className="btn btn-outline-primary col-2">
                        I'm ready
                    </button>
                </div>
            </div>
        </>
    )

    const noJoinComponent = () => (
        <div className="border border-primary rounded p-5">
            <h3>
                Sorry, the Dice game is already
                running
            </h3>
            <h5 className="fw-light">
                This page will refresh and you will
                be able to join when it finishes
            </h5>
        </div>
    )

    const gameStartedComponent = () => {
        if(players.filter(aux => {
            return aux.addr == account
        }).length == 1)
            return playComponent()
        return noJoinComponent()
    }

    const canJoinComponent = () => (
        <div className="border border-primary rounded p-5">
            <h3 className="mb-3">
                The game hasn't started yet!
            </h3>
            <button className="btn btn-outline-primary col-12" onClick={joinRoom}>
                Start playing
            </button>
        </div>
    )

    return (
        <div className="container-fluid">
            <Navbar selectedLink="Home" />
            <div className="row pt-3 ps-3">
                <main className="col">
                    <div className="d-flex justify-content-between">
                        <h1 className="fw-bold">Krazy Dices!!!</h1>
                        <div className="text-end">
                            <h6>
                                Round bet:
                                {roundBet && (<span className=" ms-2 text-primary"> {roundBet} ETH </span>)}
                            </h6>
                            <div>Play responsibly</div>
                        </div>
                    </div>
                    {!wantsToJoin ? (
                        <div className="row" style={{ height: "80%" }}>
                            {/* Pre-game screen, asks if you want to join to the game if it has not already been started */}
                            <div className="col-12 d-flex align-items-center justify-content-center">
                                {canJoinComponent()}
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* Game screen, asks the user to place his bet and vote for the start, and then displays the game */}
                            {votingComponent()}
                            {allPlayersVoted() ? gameStartedComponent() : (
                                <div>
                                    <h3>
                                        Welcome to the{" "}
                                        <span className="fw-light text-primary">
                                            All
                                            <span className="fw-semibold">In</span>
                                            Casino's{" "}
                                        </span>{" "}
                                        Dice room
                                    </h3>
                                    <h5>
                                        The game will start when all players are
                                        ready
                                    </h5>
                                </div>
                            )}
                        </div>
                    )}
                </main>
                <FundsControl update={gamePhase} />
            </div>
        </div>
    );
}

export default Dices;
