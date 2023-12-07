import React, { useEffect, useState } from 'react'

import Web3 from "web3";

import mainContractService from "../Contracts/MainContractService";

import "../Styles/custom.css";

function FundsDisplay({display}) {
    //const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [funds, setFunds] = useState("0");

    useEffect(() => {
        if (display) {
            mainContractService.init().then(() => {

                mainContractService.getAccount().then((result) => {
                    setAccount(result);

                })

                mainContractService.getFunds().then((result) => {
                    setFunds(result.toString() + ' ETH');
                })
            })
            
        // Check if Web3 is injected by the browser (MetaMask)
        /*if (window.ethereum) {
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);

            // Request account access if needed
            window.ethereum
                .request({ method: "eth_requestAccounts" })
                .then((accounts) => {
                    setAccount(accounts[0]);
                    web3Instance.eth.getBalance(accounts[0]).then((balanceWei) => {
                        const balanceEth = web3Instance.utils.fromWei(balanceWei, "ether");
                        setFunds(balanceEth);
                    }).catch((error) => {
                        console.error(error);
                    });
                })
                .catch((error) => {
                    console.error(error);
                });
        } else {
            console.error(
                "MetaMask not detected! Please install MetaMask extension."
            );
        }*/
        }
    },[display])

    return (
        <div className="card rounded col-3 m-2 px-2 rounded bg-primary-subtle">
            Account: {account}
            <br/>
            Funds: {funds}
        </div>
    );
}

export default FundsDisplay;
