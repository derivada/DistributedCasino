import React, { useState } from 'react'

import "../Styles/Home.css";
import "../Styles/custom.css";
import GameCard from './GameCard';
import Navbar from './Navbar';
import Leaderboards from './Leaderboards';
import FundsDisplay from './FundsDisplay';
import WalletComponent from './Wallet';

import mainContractService from "../Contracts/MainContractService";



const games = [
    {
        name: "Daily Pot",
        desc: "A daily pot",
        imageSrc: "/images/dailypot.png",
        linkUrl: "",
    },
    {
        name: "Coin Flip",
        desc: "Flip a coin and win prizes",
        imageSrc: "/images/coinflip.png",
        linkUrl: "",
    },
    {
        name: "Roulette",
        desc: "Spin the roulette and lose all your ETH",
        imageSrc: "/images/roulette.png",
        linkUrl: "",
    },
    {
        name: "NFT Stake",
        desc: "Put all your family's saving to stake",
        imageSrc: "/images/nftstake.png",
        linkUrl: "",
    },
];



function Home() {
    const [ displayFunds, setDisplayFunds ] = useState(false);
    return (
        <div className="container">
            <Navbar selectedLink="Home" setDisplayFunds={setDisplayFunds} />
            <div class="row">
                <main className="col-9 mt-5 pt-5">
                    <h1 className="fw-bold">Play</h1>
                    <section className="row">{games.map(GameCard)}</section>
                </main>
                <aside className="col-3 mt-5 pt-5">
                    <section className="m-2 py-2 rounded">
                        <h2 className="fw-semibold">Daily Leaderboards</h2>
                        <Leaderboards></Leaderboards>
                    </section>
                    <section className="m-2 py-2 rounded">
                        <h2 className="fw-semibold">Current Funds</h2>
                        <FundsDisplay display={displayFunds} />
                        <button
                            onClick={() => mainContractService.addFunds()}
                            class="btn btn-outline-primary rounded fs-3"
                        >
                            Add funds
                        </button>
                    </section>
                </aside>
            </div>
        </div>
    );
}

export default Home;
