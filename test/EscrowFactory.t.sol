// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {Escrow} from "../src/escrow.sol";
import {EscrowFactory} from "../src/EscrowFactory.sol";

contract EscrowFactoryTest is Test {
    EscrowFactory public factory;

    address public buyer = makeAddr("buyer");
    address public seller = makeAddr("seller");
    address public arbiter = makeAddr("arbiter");

    uint256 public constant AMOUNT = 1 ether;

    function setUp() public {
        factory = new EscrowFactory();
        vm.deal(buyer, 100 ether);
    }

    // createEscrow

    function test_CreateEscrow_SetsRolesAndAmount() public {
        vm.prank(buyer);
        address escrowAddr = factory.createEscrow{value: AMOUNT}(seller, arbiter);

        Escrow escrow = Escrow(escrowAddr);
        assertEq(escrow.buyer(), buyer);
        assertEq(escrow.seller(), seller);
        assertEq(escrow.arbiter(), arbiter);
        assertEq(escrow.amount(), AMOUNT);
        assertEq(escrowAddr.balance, AMOUNT);
        assertFalse(escrow.buyerApproved());
        assertFalse(escrow.sellerApproved());
        assertFalse(escrow.isDisputeRaised());
    }

    function test_CreateEscrow_RevertsOnInvalidSeller() public {
        vm.expectRevert(EscrowFactory.EscrowFactory__InvalidSeller.selector);
        factory.createEscrow{value: AMOUNT}(address(0), arbiter);
    }

    function test_CreateEscrow_RevertsOnInvalidArbiter() public {
        vm.expectRevert(EscrowFactory.EscrowFactory__InvalidArbiter.selector);
        factory.createEscrow{value: AMOUNT}(seller, address(0));
    }

    function test_CreateEscrow_EmitsEvent() public {
        vm.recordLogs();

        vm.prank(buyer);
        address escrowAddr = factory.createEscrow{value: AMOUNT}(seller, arbiter);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        assertEq(entries.length, 1);
        assertEq(entries[0].emitter, address(factory));
        assertEq(entries[0].topics[0], keccak256("EscrowCreated(address,address,address,address,uint256)"));
        assertEq(address(uint160(uint256(entries[0].topics[1]))), escrowAddr);
        assertEq(address(uint160(uint256(entries[0].topics[2]))), buyer);
        assertEq(address(uint160(uint256(entries[0].topics[3]))), seller);
        (address emittedArbiter, uint256 emittedAmount) = abi.decode(entries[0].data, (address, uint256));
        assertEq(emittedArbiter, arbiter);
        assertEq(emittedAmount, AMOUNT);
    }

    // registry

    function test_GetEscrows_ReturnsCreatedEscrows() public {
        vm.prank(buyer);
        address first = factory.createEscrow{value: AMOUNT}(seller, arbiter);

        vm.prank(buyer);
        address second = factory.createEscrow{value: AMOUNT * 2}(seller, arbiter);

        address[] memory all = factory.getEscrows();
        assertEq(all.length, 2);
        assertEq(all[0], first);
        assertEq(all[1], second);
        assertEq(factory.escrowsCount(), 2);
        assertEq(factory.escrows(0), first);
        assertEq(factory.escrows(1), second);
    }

    // end-to-end through the factory

    function test_FactoryEscrow_FullFlow_ReleasesToSeller() public {
        vm.prank(buyer);
        address escrowAddr = factory.createEscrow{value: AMOUNT}(seller, arbiter);
        Escrow escrow = Escrow(escrowAddr);

        uint256 sellerBalanceBefore = seller.balance;

        vm.prank(buyer);
        escrow.approveByBuyer();

        vm.prank(seller);
        escrow.approveBySeller();

        assertEq(escrowAddr.balance, 0);
        assertEq(seller.balance, sellerBalanceBefore + AMOUNT);
    }

    function test_FactoryEscrow_DisputeFlow_PaysBuyer() public {
        vm.prank(buyer);
        address escrowAddr = factory.createEscrow{value: AMOUNT}(seller, arbiter);
        Escrow escrow = Escrow(escrowAddr);

        uint256 buyerBalanceBefore = buyer.balance;

        vm.prank(seller);
        escrow.raiseDispute();

        vm.prank(arbiter);
        escrow.resolveDispute(false);

        assertEq(escrowAddr.balance, 0);
        assertEq(buyer.balance, buyerBalanceBefore + AMOUNT);
    }
}
