import React from "react";

import mainContractService from "../Contracts/MainContractService";

import { Link } from "react-router-dom";
import "../Styles/custom.css";

const links = [
    { name: 'Home', path: '/home' },
    { name: 'Donate', path: '/donate' },
    { name: 'Transparency', path: '/statement'},
];
  
const Navbar = ({ selectedLink, setAccount, setFunds }) => {


    function connectAccount() {
        mainContractService.init().then(() => {
            mainContractService.getAccount().then(setAccount)
            mainContractService.getFunds().then(setFunds)
        })
    }

    return (
        <nav className="navbar border-bottom border-secondary navbar-expand-md fixed-top">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">
                    <h1 className="fw-light text-primary d-flex flex-row justify-content-center align-items-center">
                        All<span className="fw-semibold">In</span>Casino
                    </h1>
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
                            <li className="nav-item fs-4">
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
                        onClick={connectAccount}
                    >
                        Link your wallet
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
