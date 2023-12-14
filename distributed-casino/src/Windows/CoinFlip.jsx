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
    const [players, setPlayers] = useState([]); // The structure of the users, reflects the blockchain status
    const [currentBet, setCurrentBet] = useState([]); // The current bet in the room

    /* Event listener for contract events */
    const gameStateChanged = ({ playersIn, phase }) => {
        console.log('UPDATING')
        setGamePhase(phase);
        setPlayers(playersIn);
        coinContractService.getCoin().then(setCoin);
        coinContractService.getCurrentBet().then(setCurrentBet);
    };

    const getRoomVariables = () => {
        coinContractService.getPlayers().then(setPlayers)
        coinContractService.getCurrentBet().then(setCurrentBet);
        coinContractService.getGamePhase().then(phase => {
            setGamePhase(phase)
        })
        coinContractService.getCoin().then(setCoin);
    };
    
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
    console.log(players)
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
        });
        getRoomVariables();
    };

    const resetUI = () => {
        // Destroys all room variables and sends user to the join a game screen
        setWantsToJoin(false);
        setGamePhase("Ended");
        setPlayers([]);
        coinContractService.getCurrentBet(setCurrentBet);
    };
    // Game actions, in Coins continue playing (wantsDouble = true) or retire (wantsDouble = false)
    const joinGame = () => coinContractService.joinGame();
    const chooseSide = (heads) => {
        console.log('click')
        coinContractService.chooseSide(heads)
    }
    const voteDouble = (vote) => {
        console.log('voting double ', vote)
        coinContractService.voteDouble(vote)
    }

    // Helper function for retrieving a styled string with the status of a player based on his obj. attributes
    const getPlayerStatus = (player) => {
        if (!player.hasVoted)
            return (<h6 className="font-monospace text-secondary fw-semibold d-inline-block bg-dark p-1 rounded">Choosing</h6>);
        if (player.wantsDouble)
            return (<h6 className="font-monospace text-primary fw-semibold d-inline-block bg-dark p-1 rounded">Wants to continue</h6>);
        return (<h6 className="font-monospace fw-semibold text-warning d-inline-block bg-dark p-1 rounded">Stood </h6>);
    };

    const playersReady = () => (gamePhase == "Playing");

    const numPlayers = () => players.filter(p => p.addr != ADDRESS_0).length

    const playerWon = () => players.find(p => p.addr == account).betResult > 0

    const resultComponent = () => (
        <div>
            <img src={getCoinLocation(coin)} className="mx-1 rounded" height={100}/>
            {coin ? 
                <div className={"fs-3 " + (playerWon() ? "text-primary": "text-danger")}>Heads won, {playerWon() ? "you won" : "you lost" } {currentBet} ETH </div> : 
                <div className={"fs-3 " + (playerWon() ? "text-primary": "text-danger")}>Tails won, {playerWon() ? "you won" : "you lost" } {currentBet} ETH</div>
            }
        </div>
    )

    const doublingComponent = () => (
        <div className="d-flex justify-content-betwen p-2">
            <button className="btn btn-primary fs-4 me-3" onClick={() => voteDouble(true)}>Double the bet</button>
            <button className="btn btn-secondary fs-4" onClick={() => voteDouble(false)}>Leave the game</button>
        </div>
    )
    const playComponent = () => (
        <div className="row rounded">
            <div className="col-9">
                {resultComponent()}

                {players.filter((obj) => obj.addr == account).map((player) => {
                    return (
                        <div key={player.addr} className="m-2 p-3 rounded">
                            <div className="d-flex align-items-center">
                                <h1 className="me-2">You</h1>
                                {getPlayerStatus(player)}
                            </div>
                            <h3 className="text-secondary">Your side: {players.find(p => p.addr == account).side ? "Heads" : "Tails"}</h3>
                        </div>
                    );
                })}
                {doublingComponent()}
            </div>
            <aside className="col-3">
                {players.filter((obj) => obj.addr != account).map((player, index) => (
                    <div className="bg-dark m-2 p-3 rounded">
                        <div className="d-flex align-items-center">
                            <h5 className="me-2">
                                {player.addr.substring(0, 10)}...
                            </h5>
                            {getPlayerStatus(player)}
                        </div>
                        <h3 className="text-secondary">Their side: {player.side ? "Heads" : "Tails"}</h3>
                        <p className={"fs-3 " + (player.betResult > 0? "text-primary" : "text-danger")}>{currentBet} ETH</p>
                    </div>
                ))}
            </aside>
        </div>
    );

    const isTaken = (heads) => (players.filter(p => p.side == heads).length == 0)

    const chooseButton = (side) => (
        <button onClick={()=>chooseSide(side)} enabled={()=>!isTaken(side)} className="btn btn-dark m-3">
            <img src={getCoinLocation(side)} className="mx-1 rounded"height={100}/>
            <div className="flex flex-column justify-content-center">
                <h1>{side? "Heads": "Tails"}</h1>
                <span className="text-secondary fs-5">
                    {(players.find(p => (p.side == side && p.hasVoted)) !== undefined) ? "(Already chosen)" : ""}
                </span>
            </div>
        </button>
    );

    const waitingComponent = () => (
        <>
            <div className="mt-4 d-flex flex-row align-content-center">
                <button onClick={joinGame} className="btn btn-outline-primary col-2 me-3">Enter round</button>
                <p className="fw-semibold"> Current bet: <span className="text-primary">{currentBet} ETH</span></p>
            </div>
            {players.find(player => player.addr == account) !== undefined && (
                <div className="p-2 rounded-2 mb-3 container">
                    <div className="row">
                        <div className="fs-4 col">
                            Players joined:
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
            )}
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
        if (players.filter((aux) => aux.addr == account).length == 1) {

            return playComponent();
        }
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
                            <div className="fst-italic">Play responsibly (or not)</div>
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
                <FundsControl update={[currentBet,coin,players]} />
            </div>
        </div>
    );
}

export default CoinFlip;
