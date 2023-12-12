import React from 'react'


import "../Styles/Home.css";
import "../Styles/custom.css";
import GameCard from '../Components/GameCard';
import Navbar from '../Components/Navbar';
import FundsControl from '../Components/FundsControl';


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
    {
        name: "Blackjack",
        desc: "Get rich quick scheme moments",
        imageSrc: "/images/blackjack.png",
        linkUrl: "/blackjack"
    },
    {
        name: "Krazy Dices",
        desc: "Give your mortgage a nice roll",
        imageSrc: "/images/crazy.jpeg",
        linkUrl: "/dices"
    },
];



function Home() {

    return (
        <div>
            <Navbar selectedLink="Home" />
            <div className="container-fluid mt-3">
                <div className="row">
                    <main className="col ms-5">
                        <h1 className="fw-bold">Play</h1>
                        <section className="row">{games.map(GameCard)}</section>
                    </main>
                    <FundsControl />
                </div>
            </div>
        </div>
    );
}

export default Home;
