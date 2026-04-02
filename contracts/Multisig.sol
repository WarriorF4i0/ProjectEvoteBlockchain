// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiSigFund {

    struct Transaction {
        address to;
        uint totalAmount;
        uint amountCollected;
        uint minContribution;
        uint requiredConfirmations;
        uint confirmCount;
        bool executed;
    }

    Transaction[] public transactions;

    mapping(uint => mapping(address => bool)) public allowedVoters;
    mapping(uint => mapping(address => bool)) public confirmed;

    function transactionsLength() public view returns(uint){
        return transactions.length;
    }

    function createFundingTransaction(
        address recipient,
        uint amount,
        address[] calldata yesVoters
    ) external {

        uint yesCount = yesVoters.length;
        require(yesCount > 0, "No voters");

        uint minContribution = amount / yesCount;

        transactions.push(
            Transaction({
                to: recipient,
                totalAmount: amount,
                amountCollected: 0,
                minContribution: minContribution,
                requiredConfirmations: yesCount,
                confirmCount: 0,
                executed: false
            })
        );

        uint txId = transactions.length - 1;

        for(uint i = 0; i < yesCount; i++){
            allowedVoters[txId][yesVoters[i]] = true;
        }
    }

    function confirmAndPay(uint txId) external payable {

        Transaction storage t = transactions[txId];

        require(!t.executed, "Executed");
        require(allowedVoters[txId][msg.sender], "Not voter");
        require(!confirmed[txId][msg.sender], "Already confirmed");
        require(msg.value >= t.minContribution, "Below minimum");

        confirmed[txId][msg.sender] = true;
        t.confirmCount++;

        t.amountCollected += msg.value;
    }

    function executeTransaction(uint txId) public {

        Transaction storage t = transactions[txId];

        require(!t.executed, "Executed");

        require(
            t.confirmCount >= t.requiredConfirmations,
            "Not enough confirmations"
        );

        require(
            t.amountCollected >= t.totalAmount,
            "Not enough funds"
        );

        t.executed = true;

        (bool success, ) = payable(t.to).call{value: t.totalAmount}("");
        require(success, "Transfer failed");
    }

    receive() external payable {}
}