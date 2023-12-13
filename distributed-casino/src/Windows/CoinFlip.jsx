import React, { useState, useEffect } from "react";

import { useStore } from "react-context-hook";

import "../Styles/Home.css";
import "../Styles/custom.css";
import Navbar from "../Components/Navbar";
import FundsControl from "../Components/FundsControl";

import coinContractService from "../Contracts/CoinContractService";

import { getCoinLocation } from "../coins";

const ADDRESS_0 = "0x0000000000000000000000000000000000000000"; // address(0), the address of the cards dealer

function CoinFlip() {
    // React variables
    const [account, setAccount] = useStore("account"); // The account of the players, stored as global state

    const [coin, setCoin] = useState(true)
    const [gamePhase, setGamePhase] = useState("Betting"); // The state of the game
    const [wantsToJoin, setWantsToJoin] = useState(false); // If the user wants to join the game or not
    const [gameEnded, setGameEnded] = useState(false); // If the game has ended
    const [players, setPlayers] = useState([]); // The structure of the users, reflects the blockchain status

    /* Event listener for contract events */
    const gameStateChanged = ({ playersIn, phase }) => {
        if (phase == "Ended") {
            setGameEnded(true);
        }

        setGamePhase(phase);
        setPlayers(playersIn);
        coinContractService.getCoin(setCoin);
    };

    const getRoomVariables = () => {
        coinContractService.getPlayers().then(setPlayers)
    };
    console.log(players)
    // To be done in account change.
    useEffect(() => {
        coinContractService.setupAccount(account);
        getRoomVariables(); // Get the basic information of the room
    }, [account]);

    // To be done in page reload
    useEffect(() => {
        coinContractService.setupContract().then(() => {
            coinContractService.addGameStateListener(gameStateChanged);
        });
    }, []);

    // Join the room, get the players already in the room and their voting status
    const joinRoom = () => {
        coinContractService.getPlayers().then((players) => {
            players.forEach((player) => {
                console.log("Player Information:");
                console.log("Has Voted:", player.hasVoted);
                console.log("Wants double:", player.wantsDouble);
                console.log("-------------");
            });
            setPlayers([...players]);
            setWantsToJoin(true);
            setGameEnded(false);
        });
        getRoomVariables();
    };

    const resetUI = () => {
        // Destroys all room variables and sends user to the join a game screen
        setWantsToJoin(false);
        setGameEnded(false);
        setPlayers([]);
    };
    // Game actions, in Coins continue playing (wantsDouble = true) or retire (wantsDouble = false)
    const joinGame = () => coinContractService.joinGame();
    const chooseSide = (heads) => {
        console.log('click')
        coinContractService.chooseSide(heads)
    }
    const voteDouble = (vote) => coinContractService.voteDouble(vote)

    // Helper function for retrieving a styled string with the status of a player based on his obj. attributes
    const getPlayerStatus = (player) => {
        if (!player.hasVoted)
            return (<h6 className="font-monospace text-secondary fw-semibold d-inline-block bg-dark p-1 rounded">Choosing</h6>);
        if (player.wantsDouble)
            return (<h6 className="font-monospace text-primary fw-semibold d-inline-block bg-dark p-1 rounded">Wants to continue</h6>);
        return (<h6 className="font-monospace fw-semibold text-warning d-inline-block bg-dark p-1 rounded">Stood </h6>);
    };

    const playersReady = () => (numPlayers() == 2 && players.filter(p=>p.hasVoted).length==2);

    const numPlayers = () => players.filter(p => p.addr != ADDRESS_0).length

    const coinComponent = () => (
        <img key="coin" src={getCoinLocation(coin)} className="mx-1 rounded" height={100}/>
    )

    const playComponent = () => (
        <div className="row rounded">
            <div className="col-9">
                {players.filter((obj) => obj.addr == account).map((player) => {
                    return (
                        <div key={player.addr} className="m-2 p-3 rounded">
                            <div className="d-flex align-items-center">
                                <h1 className="me-2">You</h1>
                                {getPlayerStatus(player)}
                            </div>
                        </div>
                    );
                })}
                {coinComponent()}
                {gameEnded && (
                    <div className="col-6 d-flex flex-column flex-justify-center border border-light rounded m-2 p-3 bg-dark">
                        <h3 className="mb-2">The game has ended!</h3>
                        <div className="mb-2">
                            {(() => {
                                let player = players.find(
                                    (obj) => obj.addr === account
                                );
                                let result = player && player.betResult ? player.betResult : 0;
                                return (
                                    <div>
                                        {result > 0 ? (
                                            <h3 className="text-success">
                                                You won{" "}
                                                <span className="ms-1 fst-bold">{result} ETH</span>
                                            </h3>
                                        ) : (
                                            <h3 className="text-danger">
                                                You lost{" "}
                                                <span className="ms-1 fst-bold">{result} ETH</span>
                                            </h3>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                )}
                <div className="d-flex justify-content-betwen p-2">
                    <button className="btn btn-primary fs-4 me-3" onClick={() => voteDouble(true)}>Double the bet</button>
                    <button className="btn btn-secondary fs-4" onClick={() => voteDouble(false)}>Leave the game</button>
                </div>
            </div>
            <aside className="col-3">
                {players.filter((obj) => obj.addr != account).map((player, index) => (
                        <div className="bg-dark m-2 p-3 rounded">
                            <div className="d-flex align-items-center">
                                <h5 className="me-2">
                                    {player.addr.substring(0, 6)}...
                                </h5>
                                {getPlayerStatus(player)}
                            </div>
                            <p className="font-primary fw-semibold">{player.bet} ETH</p>
                        </div>
                    ))}
            </aside>
        </div>
    );

    const isTaken = (heads) => (players.filter(p => p.side == heads).length == 0)

    const chooseButton = (heads) => (
        <button onClick={()=>chooseSide(heads)} enabled={()=>!isTaken(heads)} className="btn btn-dark m-3">
            <img src={getCoinLocation(heads)} className="mx-1 rounded"height={100}/>
            <h1>{heads? "Heads": "Tails"}</h1>
        </button>);

    const waitingComponent = () => (-
        <>
            <div className="p-2 rounded-2 mb-3 container">
                <div className="row">
                    <button onClick={joinGame} className="btn btn-outline-primary col-2">Enter round</button>
                </div>
            </div>
            <div className="p-2 rounded-2 mb-3 container">
                <div className="row">
                    <div className="fs-4 col">
                        Players ready:
                        <span className="text-warning ms-3 me-1">
                            {numPlayers()}
                        </span>
                        /
                        <span className="text-primary px-1">2</span>
                    </div>
                   
                </div>
                <div className="fs-4 d-flex flex-column">
                        <h3 className="text-primary">Choose your side:</h3>
                        <div className="d-flex">
                            {chooseButton(true)}
                            {chooseButton(false)}
                        </div>
                    </div>
            </div>
        </>
    );

    const noJoinComponent = () => (
        <div className="border border-primary rounded p-5">
            <h3>Sorry, the Coin game is already running</h3>
            <h5 className="fw-light">
                This page will refresh and you will be able to join when it
                finishes
            </h5>
        </div>
    );

    const gameStartedComponent = () => {
        console.log(players)
        if (players.filter((aux) => aux.addr == account).length == 1)
            return playComponent();
        return noJoinComponent();
    };

    const canJoinComponent = () => (
        <div className="border border-primary rounded p-5">
            <h3 className="mb-3">The game hasn't started yet!</h3>
            <button className="btn btn-outline-primary col-12" onClick={joinRoom}>Start playing</button>
        </div>
    );

    return (
        <div className="container-fluid">
            <Navbar selectedLink="Coinflip" />
            <div className="row pt-3 ps-3">
                <main className="col">
                    <div className="d-flex justify-content-between">
                        <h1 className="fw-bold">Coin Flip!!!</h1>
                        <div className="text-end">
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
                            {playersReady() ? (
                                gameStartedComponent()
                            ) : (
                                <>
                                    <div>
                                        <h3>
                                            Welcome to the{" "}
                                            <span className="fw-light text-primary">All<span className="fw-semibold">In</span>Casino's{" "}</span>{" "}Flip room
                                        </h3>
                                        <h5>The game will start when all players choose their coin side</h5>
                                    </div>
                                    
                                    {waitingComponent()}
                                </>
                            )}
                        </div>
                    )}
                </main>
                <FundsControl update={gamePhase} />
            </div>
        </div>
    );
}

export default CoinFlip;
