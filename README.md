# Distributed Systems Project -- AllInCasino

A gambling website in the Ethereum blockchain. Built-in trust and transparency by usage of Smart Contracts, as well as anonimity from using account addresses instead of real names. For more details see our "Transparency" page.

### Authors:
- Pablo Landrove Pérez-Gorgoroso
- Pablo Díaz Viñambres

### How to test with multiple people
Since we are not deploying this contracts to any actual network, we tested the interactions using Visual Studio Code Liveshare. This tool lets you share both code for pair programming and servers (in our case port 3000 for the Frontend and port 7545 for Ganache).

### Technologies used
- Solidity for smart contracts
- Truffle suite for deployment and testing
- Ganache for local ethereum network
- NPM and Yarn for package management
- React and Bootstrap for the frontend

### Usage
To compile the contracts and move the ABI to the frontend folder, use `truffle init && node move.js`
To test the contracts use `truffle test`
To run the frontend run `yarn install` and then `yarn start` in `/distributed-casino`