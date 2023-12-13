import React, { useEffect, useState } from "react";

import { useStore } from "react-context-hook";

import mainContractService from "../Contracts/MainContractService";

import { Link } from "react-router-dom";
import "../Styles/custom.css";

const links = [
    { name: 'Home', path: '/' },
    { name: 'Krazy Dices', path: '/dices' },
    { name: 'Blackjack', path: '/blackjack' },
    { name: 'Coinflip', path: '/coinflip'},
];



const Navbar = ({ selectedLink }) => {

    const [account, setAccount] = useStore("account");
    const [funds, setFunds] = useStore("funds")
    const [casinoFunds, setCasinoFunds] = useState(0);


    function connectAccount() {
        mainContractService.init().then(() => {
            mainContractService.getAccount().then(setAccount);
            mainContractService.getFunds().then(setFunds);
            mainContractService.getCasinoFunds().then(setCasinoFunds)
        });
    }

    useEffect(connectAccount, []);

    return (
        <nav className="navbar border-bottom border-secondary navbar-expand-md">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">
                    <Link to="/">
                    <h1 className="fw-light text-primary d-flex flex-row justify-content-center align-items-center">
                        All<span className="fw-semibold">In</span>Casino
                    </h1>
                    </Link>
                </a>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarCollapse"
                    aria-controls="navbarCollapse"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarCollapse">
                    <ul className="navbar-nav me-auto mb-2 mb-md-0">
                        {links.map((link) => (
                            <li className="nav-item fs-4" key={link.name}>
                                <Link className={`nav-link ${selectedLink === link.name ? "active" : ""}`} to={link.path}>
                                    {link.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="d-flex">
                        <h6 className="me-3 border border-primary rounded p-2 d-flex align-content-end">
                            Casino funds: <span className="text-primary ms-1">{casinoFunds} ETH</span>
                        </h6>
                        <button className="btn btn-primary" onClick={connectAccount}>
                            Link your wallet
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
