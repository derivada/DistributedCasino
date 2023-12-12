import React, { useEffect, useState } from 'react'

import { useStore } from 'react-context-hook'

import Web3 from "web3";

import mainContractService from "../Contracts/MainContractService";

import "../Styles/custom.css";

function FundsDisplay() {

    const [account, setAccount] = useStore("account")
    const [funds, setFunds] = useStore("funds")

    return (
        <section className="rounded px-2">
            <h2 className="fw-semibold">Current Funds</h2>
            <h5>
                Account:
                <span className="ms-2 font-monospace text-primary mb-3" style={{ wordWrap: 'break-word' }}>
                    {account ?? 'Not linked'}
                </span>
            </h5>
            <h5>
                Funds:
                 <span className="ms-2 text-primary">{funds+" ETH"}</span>
            </h5>
        </section>
    );
}

export default FundsDisplay;
