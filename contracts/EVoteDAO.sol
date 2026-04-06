 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMultiSigFund {
    function createFundingTransaction(
        address recipient,
        uint amount,
        address[] calldata yesVoters
    ) external;
}

contract EVoteDAO {

    address public admin;
    IMultiSigFund public multisig;

    constructor(address multisigAddress) {
        admin = msg.sender;
        multisig = IMultiSigFund(multisigAddress);
    }

    struct Proposal {
        uint256 id;
        string title;
        string description;
        uint256 amount;
        address recipient;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 deadline;
        bool finalized;
        address creator;

        bool reported;
        uint256 reportCount;
    }

    struct Report {
        address reporter;
        string reason;
    }

    uint256 public proposalCount;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public voted;
    mapping(uint256 => address[]) public yesVoters;

    mapping(uint256 => mapping(address => bool)) public reportedBy;
    mapping(uint256 => Report[]) public reports;

    mapping(uint256 => bool) public cancelled;
    mapping(uint256 => string) public cancelReason;

    // ===== CREATE =====
    function createProposal(
        string memory title,
        string memory description,
        uint256 amount,
        address recipient,
        uint256 duration
    ) public {

        require(msg.sender != admin, "Admin cannot create");
        require(duration > 0, "Invalid duration");

        proposalCount++;

        proposals[proposalCount] = Proposal({
            id: proposalCount,
            title: title,
            description: description,
            amount: amount,
            recipient: recipient,
            yesVotes: 0,
            noVotes: 0,
            deadline: block.timestamp + duration,
            finalized: false,
            creator: msg.sender,
            reported: false,
            reportCount: 0
        });
    }

    //VOTE
    function vote(uint256 proposalId, bool support) public {

        require(msg.sender != admin, "Admin cannot vote");

        Proposal storage p = proposals[proposalId];

        require(p.id != 0, "Invalid");
        require(block.timestamp < p.deadline, "Ended");
        require(!voted[proposalId][msg.sender], "Voted");
        require(!cancelled[proposalId], "Cancelled");

        voted[proposalId][msg.sender] = true;

        if (support) {
            p.yesVotes++;
            yesVoters[proposalId].push(msg.sender);
        } else {
            p.noVotes++;
        }
    }

    //END EARLY
    function endVotingEarly(uint256 proposalId) public {

        Proposal storage p = proposals[proposalId];

        require(msg.sender == p.creator, "Only creator");
        require(!p.finalized, "Finalized");

        p.deadline = block.timestamp - 1;
    }

    //REPORT
    function reportProposal(uint256 proposalId, string calldata reason) public {

        Proposal storage p = proposals[proposalId];

        require(!p.finalized, "Finalized");
        require(bytes(reason).length > 0, "No reason");
        require(!reportedBy[proposalId][msg.sender], "Already reported");
        require(!cancelled[proposalId], "Cancelled");

        reportedBy[proposalId][msg.sender] = true;

        reports[proposalId].push(
            Report(msg.sender, reason)
        );

        p.reportCount++;

        if (p.reportCount > 0) {
            p.reported = true;
        }
    }

    function getReports(uint proposalId) public view returns (Report[] memory) {
        return reports[proposalId];
    }

    // CANCEL(ADMIN)
    function cancelProposal(uint proposalId, string calldata reason) public {

        require(msg.sender == admin, "Only admin");

        Proposal storage p = proposals[proposalId];

        require(!p.finalized, "Finalized");
        require(p.reportCount > 0, "No reports"); 

        cancelled[proposalId] = true;
        p.finalized = true;

        cancelReason[proposalId] = reason;
    }

    // FINALIZE 
    function finalizeProposal(uint256 proposalId) public {

        require(msg.sender == admin, "Only admin");

        Proposal storage p = proposals[proposalId];

        require(!p.finalized, "Finalized");
        require(block.timestamp >= p.deadline, "Not ended");
        require(!cancelled[proposalId], "Cancelled");


        p.finalized = true;

        uint total = p.yesVotes + p.noVotes;
        require(total > 0, "No votes");

        uint percentYes = (p.yesVotes * 100) / total;

        if (percentYes >= 70) {
            multisig.createFundingTransaction(
                p.recipient,
                p.amount,
                yesVoters[proposalId]
            );
        }
    }

    // ===== VIEW =====
    function getProposal(uint id)
        public view
        returns (
            uint256,
            string memory,
            string memory,
            uint256,
            address,
            uint256,
            uint256,
            uint256,
            bool,
            address,
            bool,
            uint256
        )
    {
        Proposal memory p = proposals[id];

        return (
            p.id,
            p.title,
            p.description,
            p.amount,
            p.recipient,
            p.yesVotes,
            p.noVotes,
            p.deadline,
            p.finalized,
            p.creator,
            p.reported,
            p.reportCount
        );
    }
}