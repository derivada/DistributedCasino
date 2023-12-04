import React from "react";
import { Router, Link } from "react-router-dom";
import "../Styles/custom.css";

const Navbar = ({ links, selectedLink }) => {
    return (
        <nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
        <div class="container-fluid">
            <a class="navbar-brand" href="#"><h1>888EtherPokerGainsmaxxingTomplatzcasino</h1></a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarCollapse">
            <ul class="navbar-nav me-auto mb-2 mb-md-0">
                {links.map((component, index) => (
                        <li className="nav-item" key={index}>
                            <Link
                                className={`nav-link ${
                                    selectedLink === component.name
                                        ? "active"
                                        : ""
                                }`}
                                to={component.path}
                            >
                                {component.name}
                            </Link>
                        </li>
                    ))}
            </ul>
            <form class="d-flex" role="search">
                <input class="form-control me-2" type="search" placeholder="Search" aria-label="Search" />
                <button class="btn btn-outline-success" type="submit">Search</button>
            </form>
            </div>
        </div>
        </nav>
    );
};

export default Navbar;
