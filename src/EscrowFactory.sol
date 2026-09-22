// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Escrow} from "./escrow.sol";

contract EscrowFactory {
    // custom errors
    error EscrowFactory__InvalidArbiter();
    error EscrowFactory__InvalidSeller();

    // state
    address[] public escrows;

    // events
    event EscrowCreated(
        address indexed escrow, address indexed buyer, address indexed seller, address arbiter, uint256 amount
    );

    // create a new escrow funded with msg.value, buyer = caller
    function createEscrow(address _seller, address _arbiter) external payable returns (address) {
        if (_seller == address(0)) revert EscrowFactory__InvalidSeller();
        if (_arbiter == address(0)) revert EscrowFactory__InvalidArbiter();

        Escrow escrow = new Escrow{value: msg.value}(msg.sender, _seller, _arbiter);
        address escrowAddress = address(escrow);

        escrows.push(escrowAddress);

        emit EscrowCreated(escrowAddress, msg.sender, _seller, _arbiter, msg.value);

        return escrowAddress;
    }

    // views
    function getEscrows() external view returns (address[] memory) {
        return escrows;
    }

    function escrowsCount() external view returns (uint256) {
        return escrows.length;
    }
}
