// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {Escrow} from "../src/escrow.sol";

//  @dev helper contract
contract RejectEther {
    // empty contract  -- no recive or fallback
}

contract EscrowTest is Test {
    Escrow public escrow;

    address public buyer = makeAddr("buyer");
    address public seller = makeAddr("seller");
    address public arbiter = makeAddr("arbiter");

    uint256 public constant AMOUNT = 1 ether;

    // set up
    function setUp() public {
        escrow = new Escrow{value: AMOUNT}(buyer, seller, arbiter);
    }

    // constructor
    function test_constructor() public view {
        assertEq(escrow.buyer(), buyer);
        assertEq(escrow.seller(), seller);
        assertEq(escrow.arbiter(), arbiter);
        assertEq(escrow.amount(), AMOUNT);
        assertEq(address(escrow).balance, AMOUNT);
        assertFalse(escrow.buyerApproved());
        assertFalse(escrow.sellerApproved());
        assertFalse(escrow.isDisputeRaised());
    }

    // approve by buyer
    function test_approveByBuyer_RevertsIfNotBuyer() public {
        vm.prank(seller);
        vm.expectRevert(Escrow.Escrow__OnlyBuyer.selector);
        escrow.approveByBuyer();
    }

    function test_approveByBuyer_NoReleaseWhenSellerNotApproved() public {
        vm.prank(buyer);
        escrow.approveByBuyer();

        assertTrue(escrow.buyerApproved());
        assertFalse(escrow.sellerApproved());
        assertEq(address(escrow).balance, AMOUNT);
        assertEq(seller.balance, 0);
    }

    // approve by seller

    function test_approveBySeller_RevertsIfNotSeller() public {
        vm.prank(buyer);
        vm.expectRevert(Escrow.Escrow__OnlySeller.selector);
        escrow.approveBySeller();
    }

    function test_approveBySeller_NoReleaseWhenBuyerNotApproved() public {
        vm.prank(seller);
        escrow.approveBySeller();

        assertTrue(escrow.sellerApproved());
        assertFalse(escrow.buyerApproved());
        assertEq(address(escrow).balance, AMOUNT);
        assertEq(seller.balance, 0);
    }

    // release if agreed
    function test_Release_WhenBuyerThenSellerApprove_TrasnferFundsToSeller() public {
        uint256 sellerBalanceBefore = seller.balance;
        vm.prank(buyer);
        escrow.approveByBuyer();

        vm.prank(seller);
        escrow.approveBySeller();

        assertEq(address(escrow).balance, 0);
        assertEq(seller.balance, sellerBalanceBefore + AMOUNT);
    }

    function test_Release_WhenSellerThenBuyerApprove_TrasnferFundsToSeller() public {
        uint256 sellerBalanceBefore = seller.balance;

        vm.prank(seller);
        escrow.approveBySeller();

        vm.prank(buyer);
        escrow.approveByBuyer();

        assertEq(address(escrow).balance, 0);
        assertEq(seller.balance, sellerBalanceBefore + AMOUNT);
    }

    function testRelease_DoesNotHappen_WhenDisputeRaised() public {
        uint256 sellerBalanceBefore = seller.balance;

        vm.prank(buyer);
        escrow.approveByBuyer();

        vm.prank(buyer);
        escrow.raiseDispute();

        vm.prank(seller);
        escrow.approveBySeller();

        assertTrue(escrow.buyerApproved());
        assertTrue(escrow.sellerApproved());
        assertTrue(escrow.isDisputeRaised());
        assertEq(address(escrow).balance, AMOUNT);
        assertEq(seller.balance, sellerBalanceBefore);
    }

    function test_release_RevertOnTransferFaliure_WhenSellerCannotReceiveEther() public {
        RejectEther badSeller = new RejectEther();

        Escrow badEscrow = new Escrow{value: AMOUNT}(buyer, address(badSeller), arbiter);

        vm.prank(buyer);
        badEscrow.approveByBuyer();

        vm.prank(address(badSeller));
        vm.expectRevert(Escrow.Escrow__TransferFailed.selector);
        badEscrow.approveBySeller();
    }

    // raise dipute

    function test_RaiseDispute_revertIfNotBuyerOrSeller() public {
        vm.prank(arbiter);
        vm.expectRevert(Escrow.Escrow__OnlyBuyerOrSeller.selector);
        escrow.raiseDispute();
    }

    function test_RaiseDisputByBuyer() public {
        vm.prank(buyer);
        escrow.raiseDispute();
        assertTrue(escrow.isDisputeRaised());
    }

    function test_RaiseDisputBySeller() public {
        vm.prank(seller);
        escrow.raiseDispute();
        assertTrue(escrow.isDisputeRaised());
    }

    //////////////// reslove dispute

    function test_resoveDispute_revertIfNotArbituer() public {
        vm.prank(buyer);
        escrow.raiseDispute();

        vm.prank(buyer);
        vm.expectRevert(Escrow.Escrow__OnlyArbiter.selector);
        escrow.resolveDispute(false);
    }

    function test_ResolveDispute_revertIfNoDisputeRaised() public {
        vm.prank(arbiter);
        vm.expectRevert(Escrow.Escrow__NoDisputeRaised.selector);
        escrow.resolveDispute(true);
    }

    function test_ResolveDispute_ApproveforSeller() public {
        uint256 sellerBalanceBefore = seller.balance;
        vm.prank(buyer);
        escrow.raiseDispute();

        vm.prank(arbiter);
        escrow.resolveDispute(true);

        assertEq(address(escrow).balance, 0);
        assertEq(seller.balance, sellerBalanceBefore + AMOUNT);
    }

    function test_ResolveDispute_ApproveForSBuyer() public {
        uint256 buyerBalanceBefore = buyer.balance;
        vm.prank(buyer);
        escrow.raiseDispute();

        vm.prank(arbiter);
        escrow.resolveDispute(false);

        assertEq(address(escrow).balance, 0);
        assertEq(buyer.balance, buyerBalanceBefore + AMOUNT);
    }

    function test_ResolveDispute_revertOn_trasnferFalure_toSeller() public {
        RejectEther badSeller = new RejectEther();
        Escrow badEscrow = new Escrow{value: AMOUNT}(buyer, address(badSeller), arbiter);

        vm.prank(buyer);
        badEscrow.raiseDispute();

        vm.prank(arbiter);
        vm.expectRevert(Escrow.Escrow__TransferFailed.selector);
        badEscrow.resolveDispute(true);
    }

    function test_ResolveDispute_revertOn_trasnferFalure_tobuyer() public {
        RejectEther badBuyer = new RejectEther();
        Escrow badEscrow = new Escrow{value: AMOUNT}(address(badBuyer), seller, arbiter);

        vm.prank(seller);
        badEscrow.raiseDispute();

        vm.prank(arbiter);
        vm.expectRevert(Escrow.Escrow__TransferFailed.selector);
        badEscrow.resolveDispute(false);
    }
}
