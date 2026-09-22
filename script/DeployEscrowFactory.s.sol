// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {EscrowFactory} from "../src/EscrowFactory.sol";

contract DeployEscrowFactory is Script {
    function run() external returns (EscrowFactory factory) {
        vm.startBroadcast();
        factory = new EscrowFactory();
        vm.stopBroadcast();

        console.log("EscrowFactory deployed at:", address(factory));
    }
}
