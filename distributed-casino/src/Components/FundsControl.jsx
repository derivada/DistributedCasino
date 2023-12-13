import React, { useState, useEffect } from 'react';

import { useStore } from 'react-context-hook'

import FundsDisplay from "./FundsDisplay";
import mainContractService from "../Contracts/MainContractService";

function FundsControl ({update}) {

    const [account, setAccount] = useStore("account");
    const [funds, setFunds] = useStore("funds")
    
    const [addAmount, setAddAmount] = useState(0);
    const [retrieveAmount, setRetrieveAmount] = useState(0);
    const [error, setError] = useState("");

    useEffect(() => setError(""), [funds]);

    useEffect(() => {
        mainContractService.getFunds().then((amount) => {
            if (amount) {
                setFunds(amount);
            }
        })
    }, [update])

    const addFunds = () =>
        mainContractService
            .addFunds(addAmount)
            .then(setFunds)
            .catch((e) => setError(e.message));

    const retrieveFunds = () => mainContractService.retrieveFunds(retrieveAmount).then(setFunds).catch((e) => setError(e.message));


    return (
        <aside className="col-3">
            <FundsDisplay account={account} funds={funds} />
            <section className="py-2 rounded">
                <h2 className="fw-semibold">Manage your wallet</h2>
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show">
                        {error}
                    </div>
                )}
                <div className="input-group form-input mb-3 row">
                    <label htmlFor="addFundsInput" className="fs-5 mb-1">
                        Select amount
                    </label>
                    <div className="d-flex">
                        <input
                            value={addAmount}
                            onChange={(e) => {
                                setAddAmount(e.target.value);
                            }}
                            type="text"
                            className="form-control"
                        />
                        <span className="input-group-text">ETH</span>
                    </div>
                </div>

                <button
                    onClick={addFunds}
                    className="btn btn-outline-primary rounded fs-5 mb-3"
                >
                    Add funds
                </button>
                <div className="input-group form-input mb-3 w-75">
                    <input
                        id="retrieveRange"
                        type="range"
                        className="form-range"
                        min="0"
                        step="0.001"
                        max={funds}
                        value={retrieveAmount}
                        onChange={(e) => {
                            setRetrieveAmount(e.target.value);
                        }}
                    />
                    <label htmlFor="retrieveRange" className="fs-3">
                        {retrieveAmount} ETH
                    </label>
                </div>
                <button
                    onClick={retrieveFunds}
                    className="btn btn-outline-danger rounded fs-5 mb-3"
                >
                    Retrieve funds
                </button>
            </section>
        </aside>
    );
}

export default FundsControl;