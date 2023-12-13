# Distributed Systems Project -- AllInCasino

A gambling website in the Ethereum blockchain. Built-in trust and transparency by usage of Smart Contracts, as well as anonimity from using account addresses instead of real names. For more details see our "Transparency" page.

### Authors:
- Pablo Landrove Pérez-Gorgoroso
- Pablo Díaz Viñambres

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