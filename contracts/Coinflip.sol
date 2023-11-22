// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
contract Coinflip {

    address public owner;

    address payable public heads = payable(address(0x0));
    address payable public tails = payable(address(0x0));
    
    uint256 min_bet = 1;
    
    bool heads_start = false;
    bool tails_start = false;

    event CoinFlipResult(bool heads_win, uint256 amount_win);

    constructor() {
        owner = msg.sender;
    }
    
    function resetCoinflip() public {
        require(msg.sender == owner, "You need to be the owner to do this");
        heads_start = false;
        tails_start = false;
        heads = payable(address(0x0));
        tails = payable(address(0x0));
    }

    function enter(uint256 selection) external payable {
        require(selection == 0 || selection == 1, "Selection must be 0 (heads) or 1 (tails)");
        if (selection == 0) {
            require(heads == payable(address(0x0)), "Heads (0) is taken");
        } else {
            require(tails == payable(address(0x0)), "Tails (1) is taken");
        }
        require(msg.value >= min_bet, "Amount must be bigger than the minimum bet");
        if (selection == 0) {
            heads = payable(msg.sender);
        } else {
            tails = payable(msg.sender);
        }
    }

    function voteStart() external {
        require(payable(msg.sender) == heads || payable(msg.sender) == tails, "You are not registered for the coinflip");
        if (payable(msg.sender) == heads) {
            require(heads_start == false, "You have already voted for the start");
            heads_start = true;
        } else {
            require(tails_start == false, "You have already voted for the start");
            tails_start = true;
        }

        if(heads_start && tails_start) {
            // Start the coinflip
            coinFlip();
        }
    }

    function coinFlip() private {
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(blockhash( block.number), block.timestamp)));
        bool result = (randomNumber % 2) == 0;
        emit CoinFlipResult(result, address(this).balance);
        if (result) {
            heads.transfer(address(this).balance);
        } else {
            tails.transfer(address(this).balance);
        }
    }
}