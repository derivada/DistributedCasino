import React, { useState, useEffect } from "react";
import Web3 from "web3";

const WalletComponent = () => {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState("");

    useEffect(() => {
        // Check if Web3 is injected by the browser (MetaMask)
        if (window.ethereum) {
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);

            // Request account access if needed
            window.ethereum
                .request({ method: "eth_requestAccounts" })
                .then((accounts) => {
                    setAccount(accounts[0]);
                })
                .catch((error) => {
                    console.error(error);
                });
        } else {
            console.error(
                "MetaMask not detected! Please install MetaMask extension."
            );
        }
    }, []);

    return (
        <div>
            {web3 && account && (
                <div>
                    <p>Connected to MetaMask!</p>
                    <p>Current Account: {account}</p>
                </div>
            )}
        </div>
    );
};

export default WalletComponent;
