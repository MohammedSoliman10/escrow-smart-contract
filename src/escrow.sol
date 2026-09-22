// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Escrow {
    // custome errors

    error Escrow__OnlyBuyer();
    error Escrow__OnlySeller();
    error Escrow__OnlyBuyerOrSeller();
    error Escrow__OnlyArbiter();
    error Escrow__NoDisputeRaised();
    error Escrow__TransferFailed();

    address public buyer;
    address public seller;
    address public arbiter;

    uint256 public amount;

    bool public buyerApproved;
    bool public sellerApproved;

    bool public isDisputeRaised;

    // constructor

    constructor(address _buyer, address _seller, address _arbiter) payable {
        buyer = _buyer;
        seller = _seller;
        arbiter = _arbiter;
        amount = msg.value;
    }

    // buyer approves the realease

    function approveByBuyer() external {
        if (msg.sender != buyer) revert Escrow__OnlyBuyer();
        buyerApproved = true;
        releaseIfAgreed();
    }

    // seller aprove the the realease of funds
    function approveBySeller() external {
        if (msg.sender != seller) revert Escrow__OnlySeller();

        sellerApproved = true;
        releaseIfAgreed();
    }

    // arbiter resolves the dispute
    function resolveDispute(bool _approveForSeller) external {
        if (msg.sender != arbiter) revert Escrow__OnlyArbiter();
        if (!isDisputeRaised) revert Escrow__NoDisputeRaised();

        if (_approveForSeller) {
            (bool success,) = seller.call{value: amount}("");
            if (!success) revert Escrow__TransferFailed();
        } else {
            (bool success,) = buyer.call{value: amount}("");
            if (!success) revert Escrow__TransferFailed();
        }
    }

    // both partis approve the realease the funds
    function releaseIfAgreed() internal {
        if (buyerApproved && sellerApproved && !isDisputeRaised) {
            (bool success,) = seller.call{value: amount}("");
            if (!success) revert Escrow__TransferFailed();
        }
    }

    // if no agreement , raise dipute
    function raiseDispute() external {
        if (msg.sender != buyer && msg.sender != seller) revert Escrow__OnlyBuyerOrSeller();

        isDisputeRaised = true;
    }
}
