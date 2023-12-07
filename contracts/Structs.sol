// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

library Structs {
    // A payment struct containing the address and the amount to be payed
    struct Payment {
        address addr;
        int256 amount; // The amount (positive or negativeo) to be modified from the account
    }
}