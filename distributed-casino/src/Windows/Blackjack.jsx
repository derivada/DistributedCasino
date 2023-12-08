import React, { useState, useEffect } from 'react'

import { useStore } from 'react-context-hook'

import "../Styles/Home.css";
import "../Styles/custom.css";
import Navbar from '../Components/Navbar';
import FundsControl from '../Components/FundsControl';

import blackContractService from "../Contracts/BlackContractService";

import { getCardLocation, getCardName } from "../cards";

function Blackjack() {
    const [bet, setBet] = useState(0);
    const [minimumBet, setMinimumBet] = useState(0);

    const [account, setAccount] = useStore('account');

    

    const [players, setPlayers] = useState([]);
    
    console.log('players', players);

    const [vote, setVote] = useState(false);

    const [playersVoted, setPlayersVoted] = useState(0);

    const ADDRESS_0 = "0x0000000000000000000000000000000000000000"; // address(0)

    // listener for add player
    const playerJoin = ({address, amount}) => {
        
        setPlayers(prevPlayers => {
            if (prevPlayers.find(p => p.address == address))
                return [...prevPlayers]
            return([...prevPlayers, {
            address: address,
            bet: amount,
            cards: [],
            stood: false,
            bust: false,
            voted: address === ADDRESS_0 ? true : false,
        }])})
    };
    
    const playerVote = ({address, totalVoted}) => {
        console.log("PLAYERS ON VOTE = ", players)
        players.find(p => p.address == address).voted = true;
        setPlayers([ ...players ]);
        setPlayersVoted(totalVoted);
    }

    // Listener for add card
    const cardDeal = ({address, card}) => {
        players.find(p => p.address == address).cards.push(card)
        setPlayers([ ...players ])
    }
    // Listener for player stand
    const playerStand = ({address, total}) => {
        let player = players.find(p => p.address == address)
        player.stood = true;
        if(total > 21) player.bust = true;
        setPlayers([ ...players ]);
    }

    // add all the listeners
    const addListeners = () => {
        console.log("listeners added");
        blackContractService.addPlayerJoinedListener(playerJoin);
        blackContractService.addPlayerVotedListener(playerVote);
        blackContractService.addCardDealtListener(cardDeal);
        blackContractService.addPlayerStoodListener(playerStand);
    }

    const stand = () => {
        blackContractService.stand()
    }
    
    const hit = () => {
        blackContractService.hit()
    }

    const [listenersAdded, setListenersAdded] = useState(false)
    
    useEffect(() => {
        blackContractService.init(account).then(() => {
            setMinimumBet(blackContractService.minimumBet);
            if (!listenersAdded) {
                console.log('listeners added', listenersAdded)
                addListeners()
                setListenersAdded(true)
            }
        })
    }, [account])

    const enterBet = () => {
        blackContractService.joinGame(bet)
        console.log('entering bet with ' + bet)
    }

    const voteStart = () => {
        blackContractService.voteStart().then(() => {
            setVote(true);
        })
    }



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
                    <h1 className="fw-bold">
                        Blackjack{" "}
                        {minimumBet
                            ? "(Minimum bet: " + minimumBet + " ETH)"
                            : ""}
                    </h1>
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
                                Players voted:{" "}
                                <span className="text-primary"></span> /{" "}
                                <span className="text-primary"></span>
                            </div>
                            <button
                                onClick={voteStart}
                                disabled={!vote && !bet}
                                className="btn btn-outline-primary col-2"
                            >
                                Vote start
                            </button>
                        </div>
                    </div>

                    <div
                        className="row rounded"
                        style={{ backgroundColor: "#458248" }}
                    >
                        <div className="col-9">
                            {players.filter((obj) => obj.address == ADDRESS_0).map((player) => {
                                return (
                                    <div className="m-2 p-3 rounded">
                                        <h1 className="font-monospace">
                                            Dealer
                                        </h1>
                                        {player.cards.map((card) => (
                                            <img
                                                src={getCardLocation(card)}
                                                className="mx-1 rounded"
                                                height={100}
                                            ></img>
                                        ))}
                                    </div>
                                );
                            })}
                            {players.filter((obj) => obj.address == account).map((player) => {
                                return (
                                    <div className="m-2 p-3 rounded">
                                        <h1 className="font-monospace">
                                            You
                                        </h1>
                                        <h3 className="font-primary fw-semibold">
                                            Your bet: {player.bet} ETH
                                        </h3>
                                        {getPlayerStatus(player)}
                                        <div>
                                            {player.cards.map((card) => (
                                                <img
                                                    src={getCardLocation(card)}
                                                    className="mx-1 rounded"
                                                    height={100}
                                                ></img>
                                            ))}
                                        </div>
                                        <div className="d-flex justify-content-aaround"> 
                                            <button className="btn btn-primary fs-2" onClick={hit}>Hit</button>
                                            <button className="btn btn-secondary fs-2" onClick={stand}>Stand</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <aside className="col-3">
                            {players.filter((obj) => obj.address != account && obj.address != "0x0").map((player) => (
                                    <div className="bg-dark m-2 p-3 rounded">
                                        <h6 className="font-monospace fw-semibold">
                                            {player.address.substring(0, 6) + "..."}
                                        </h6>
                                        <p className="font-primary fw-semibold">
                                            {player.bet} ETH
                                        </p>
                                        {getPlayerStatus(player)}
                                        {player.cards.map((card) => (
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
                </main>
                <FundsControl/>
            </div>
        </div>
    );
}

export default Blackjack;
