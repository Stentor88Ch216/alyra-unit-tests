const Voting = artifacts.require("voting");

const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');


contract("Voting", accounts => {

    const _owner = accounts[0];
    const _voter1 = accounts[1];
    const _voter2 = accounts[2];

    let votingInstance;

    
    describe("ADDING/GETTING VOTER/PROPOSAL", function () {

        before(async function(){
            votingInstance = await Voting.new({from: _owner});
        });

        it("adds voters added by owner + gets details", async () => {
            await votingInstance.addVoter(_owner);
            await votingInstance.addVoter(_voter1);
            const voter1 = await votingInstance.getVoter(_voter1);

            expect(voter1.isRegistered).to.be.true; // only "isRegisterd" property is initialized by ".addVoter"
        });

        
        it("refuses voter added by non-owner", async () => {
            await expectRevert(votingInstance.addVoter(_voter2, {from: _voter1}),"Ownable: caller is not the owner");
        });

        it("refuses voter if already registered", async () => {
            await expectRevert(votingInstance.addVoter(_voter1, {from: _owner}),"Already registered");
        });

        it("adds a proposal + gets details", async () => {
            await votingInstance.startProposalsRegistering();
            await votingInstance.addProposal("Proposal 1");
            const proposal = await votingInstance.getOneProposal(new BN(1));

            expect(proposal.description).to.equal("Proposal 1");
        });

        it("refuses empty proposal", async () => {
            await expectRevert(votingInstance.addProposal("", {from: _owner}),"Vous ne pouvez pas ne rien proposer");
        });

        it("refuses proposal from non-registered voter", async () => {
            await expectRevert(votingInstance.addProposal("Malicious proposal", {from: _voter2}),"You're not a voter");
        });
        

    });

    
    describe("VOTING TESTS", function () {

        before(async function(){
            votingInstance = await Voting.new({from: _owner});
            await votingInstance.addVoter(_owner);
            await votingInstance.addVoter(_voter1);
            await votingInstance.startProposalsRegistering();
            await votingInstance.addProposal("Proposal 1");
            await votingInstance.addProposal("Proposal 2");
            await votingInstance.endProposalsRegistering();
            await votingInstance.startVotingSession();
        });

        it("sets vote", async () => {
            await votingInstance.setVote(new BN(1), {from: _voter1});
            const votedProposal = await votingInstance.getOneProposal(new BN(1));

            expect(new BN(votedProposal.voteCount)).to.be.bignumber.equal(new BN(1));
        });

        it("refuses vote from non-registered voter", async () => {
            await expectRevert(votingInstance.setVote(new BN(1), {from: _voter2}),"You're not a voter");
        });

        it("refuses invalid vote", async () => {
            await expectRevert(votingInstance.setVote(new BN(3), {from: _owner}),"Proposal not found");
        });

    });
    

    
    describe("TALLY TEST", function () {

        before(async function(){
            votingInstance = await Voting.new({from: _owner});
            await votingInstance.addVoter(_owner);
            await votingInstance.addVoter(_voter1);
            await votingInstance.startProposalsRegistering();
            await votingInstance.addProposal("Proposal 1");
            await votingInstance.addProposal("Proposal 2");
            await votingInstance.endProposalsRegistering();
            await votingInstance.startVotingSession();
            // Two voters (_voter1 and _owner) are voting for the 2nd proposal :
            await votingInstance.setVote(new BN(2), {from: _voter1});
            await votingInstance.setVote(new BN(2), {from: _owner});
            await votingInstance.endVotingSession();
        });

        it("finds winner", async () => {
            await votingInstance.tallyVotes({from: _owner});
            const winner = new BN(await votingInstance.winningProposalID());

            expect(winner).to.be.bignumber.equal(new BN(2));
        });
    });
    

    
    describe("BASIC EVENTS", function () {

        before(async function(){
            votingInstance = await Voting.new({from: _owner});
        });

        it("gets VoterRegistered event", async () => {
            const findEvent = await votingInstance.addVoter(_voter1, {from: _owner});
            expectEvent(findEvent,"VoterRegistered", {voterAddress: _voter1});
        });

        it("gets ProposalRegistered event", async () => {
            await votingInstance.addVoter(_owner);
            await votingInstance.startProposalsRegistering();
            const findEvent = await votingInstance.addProposal("My proposal", {from: _owner});
            expectEvent(findEvent,"ProposalRegistered", {proposalId: new BN(1)});
        });

        it("gets Voted event", async () => {
            await votingInstance.endProposalsRegistering();
            await votingInstance.startVotingSession();
            const findEvent = await votingInstance.setVote(new BN(1), {from: _owner});
            expectEvent(findEvent,"Voted", {voter: _owner, proposalId: new BN(1)});
        });

    });


    describe("WORKFLOW STATUS EVENTS", function () {

        before(async function(){
            votingInstance = await Voting.new({from: _owner});
        });

        it("gets RegisteringVoters > ProposalsRegistrationStarted", async () => {
            const findEvent = await votingInstance.startProposalsRegistering();
            expectEvent(findEvent,"WorkflowStatusChange", {previousStatus: new BN(0), newStatus: new BN(1)});
        });

        it("gets ProposalsRegistrationStarted > ProposalsRegistrationEnded", async () => {
            const findEvent = await votingInstance.endProposalsRegistering();
            expectEvent(findEvent,"WorkflowStatusChange", {previousStatus: new BN(1), newStatus: new BN(2)});
        });

        it("gets ProposalsRegistrationEnded > VotingSessionStarted", async () => {
            const findEvent = await votingInstance.startVotingSession();
            expectEvent(findEvent,"WorkflowStatusChange", {previousStatus: new BN(2), newStatus: new BN(3)});
        });

        it("gets VotingSessionStarted > VotingSessionEnded", async () => {
            const findEvent = await votingInstance.endVotingSession();
            expectEvent(findEvent,"WorkflowStatusChange", {previousStatus: new BN(3), newStatus: new BN(4)});
        });

    });

    describe("WORKFLOW STATUS REQUIREMENTS", function () {

        beforeEach(async function(){
            votingInstance = await Voting.new({from: _owner});
            await votingInstance.addVoter(_owner);
        });

        // -TODO: For all the following tests, we might want to test every other status

        it("refuses new voter if status != registeringVoter", async () => {
            await votingInstance.startProposalsRegistering();
            await expectRevert(votingInstance.addVoter(_voter1, {from: _owner}),"Voters registration is not open yet");
        });

        it("refuses new proposal if status != ProposalsRegistrationStarted", async () => {
            // WorkflowStatus is currently reset to "RegisteringVoters"
            await expectRevert(votingInstance.addProposal("My proposal", {from: _owner}),"Proposals are not allowed yet");
        });

        it("refuses new vote if status != VotingSessionStarted,", async () => {
            await votingInstance.startProposalsRegistering();
            await votingInstance.addProposal("My proposal");
            // WorkflowStatus is currently "ProposalsRegistrationStarted"
            await expectRevert(votingInstance.setVote(new BN(1), {from: _owner}),"Voting session havent started yet");
        });

        it("refuses to tally if status != VotingSessionEnded,", async () => {
            // WorkflowStatus is currently reset "RegisteringVoters"
            await expectRevert(votingInstance.tallyVotes({from: _owner}),"Current status is not voting session ended");
        });

        it("refuses to startProposalRegistering if status != RegisteringVoters", async () => {
            await votingInstance.startProposalsRegistering(); 
            await votingInstance.endProposalsRegistering(); 
            // WorkflowStatus is currently "ProposalsRegistrationEnded"
            await expectRevert(votingInstance.startProposalsRegistering({from: _owner}),"Registering proposals cant be started now");
        });

        it("refuses to endProposalRegistering if status != ProposalsRegistrationStarted", async () => {
            // WorkflowStatus is currently reset to "RegisteringVoters"
            await expectRevert(votingInstance.endProposalsRegistering({from: _owner}),"Registering proposals havent started yet");
        });

        it("refuses to startVotingSession if status != ProposalsRegistrationEnded", async () => {
            // WorkflowStatus is currently reset to "RegisteringVoters"
            await expectRevert(votingInstance.startVotingSession({from: _owner}),"Registering proposals phase is not finished");
        });

        it("refuses to endVotingSession if status != VotingSessionStarted", async () => {
            // WorkflowStatus is currently reset to "RegisteringVoters"
            await expectRevert(votingInstance.endVotingSession({from: _owner}),"Voting session havent started yet");
        });


    });



});