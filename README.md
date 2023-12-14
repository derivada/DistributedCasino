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
1. First open ganache and set a network on port 7545
2. To compile the contracts, use `truffle migrate`
3. To test the contracts use `truffle test`
4. To run the frontend first install the NPM libraries using `yarn install` and then start the server `yarn start` in `/distributed-casino`