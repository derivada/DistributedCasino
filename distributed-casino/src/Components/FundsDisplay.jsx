import React, { useEffect, useState } from 'react'

import { useStore } from 'react-context-hook'

import Web3 from "web3";

import mainContractService from "../Contracts/MainContractService";

import "../Styles/custom.css";

function FundsDisplay() {

    const [account, setAccount] = useStore("account")
    const [funds, setFunds] = useStore("funds")

    return (
        <section className="mt-5 rounded px-2">
            <h2 className="fw-semibold">Current Funds</h2>
            <h5>Account: <p className="font-monospace text-primary mb-3">{account ?? 'Not linked'}</p></h5>
            <h3>Funds: <p className="text-primary">{funds+" ETH"}</p></h3>
        </section>
    );
}

export default FundsDisplay;
