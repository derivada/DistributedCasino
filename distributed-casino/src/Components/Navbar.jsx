import React from "react";
import { Router, Link } from "react-router-dom";
import "../Styles/custom.css";

const links = [
    { name: 'Home', path: '/home' },
    { name: 'Donate', path: '/donate' },
    { name: 'Your Wallet', path: '/wallet' },
    { name: 'NFT Shop', path: '/nft'},
    { name: 'Transparency', path: '/statement'},
  ];
  
const Navbar = ({ selectedLink, setDisplayFunds }) => {
    return (
        <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">
                    <h1>888ETHTomPlatzcasino</h1>
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
                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${
                                        selectedLink === link.name
                                            ? "active"
                                            : ""
                                    }`}
                                    to={link.path}
                                >
                                    {link.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <button
                        className="btn btn-outline-success"
                        onClick={() => setDisplayFunds(true)}
                    >
                        Link your wallet
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
