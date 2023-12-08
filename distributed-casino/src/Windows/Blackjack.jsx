import React, { useState, useEffect } from 'react'

import "../Styles/Home.css";
import "../Styles/custom.css";
import Navbar from '../Components/Navbar';
import FundsControl from '../Components/FundsControl';

import blackContractService from "../Contracts/BlackContractService";


function Blackjack() {
    const [ bet, setBet ] = useState(0);

    const [account, setAccount] = useState(null);
    const [funds, setFunds] = useState(0);

    const [minimumBet, setMinimumBet] = useState(0)
    
    useEffect(() => {
        blackContractService.init(account).then(() => {
            setMinimumBet(blackContractService.minimumBet);
            blackContractService.listenPlayerJoin();
        })
    }, [ account ])
    
    const enterBet = () => {
        blackContractService.joinGame(bet)
        console.log('entering bet with ' + bet)
    }

    return (
        <div className="container">
            <Navbar selectedLink="Home" setAccount={setAccount} setFunds={setFunds}/>
            <div class="row pt-5 mt-5">
                <main class="col-9">
                    <h1 className="fw-bold">Blackjack {minimumBet ? ("(Minimum bet: " + minimumBet + " ETH)"): ""}</h1>
                    <div className="p-2 rounded-2 mb-3">
                        <div>
                            <label className="fw-light fs-4">Place a bet</label>
                            <input
                                value={bet}
                                onChange={(e) => {
                                    setBet(e.target.value);
                                }}
                                type="text"
                                className="form-control w-25"
                            />
                        </div>
                        <button onClick={enterBet} className="btn btn-outline-primary w-25">
                            Enter round
                        </button>
                    </div>

                    <div className="p-2 rounded-2 mb-3">
                        <div className="fs-4">
                            Players voted:{" "}
                            <span className="text-primary"></span> /{" "}
                            <span className="text-primary"></span>
                        </div>
                        <button className="btn btn-outline-primary w-25">
                            Vote start
                        </button>
                    </div>
                </main>
                <FundsControl
                    account={account}
                    funds={funds}
                    setFunds={setFunds}
                />
            </div>
        </div>
    );
}

export default Blackjack;
