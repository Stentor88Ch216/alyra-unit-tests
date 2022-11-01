# testvoting.js

## Description
testvoting.js is a unit testing file for the "Voting" smart contract (provided by Alyra). It aims to test all of its functionalities.
It is structured in 6 parts :
* ADDING/GETTING VOTER/PROPOSAL
* VOTING TESTS
* TALLY TEST
* BASIC EVENTS
* WORKFLOW STATUS EVENTS
* WORKFLOW STATUS REQUIREMENTS

## Dependencies
testvoting.js relies on [openzeppelin](https://docs.openzeppelin.com/test-helpers/0.5/) and [chai](https://www.chaijs.com) test helpers.
Make sure to install those dependencies in order to run the tests.

## Usage
You can deploy the "Voting" smart contract on a Ganache network via Truffle and run the tests.

## Details

### ADDING/GETTING VOTER/PROPOSAL

The following tests verify the "addVoter", "getVoter", "AddProposal", and "getOneProposal" functions.
They verify the getters, the setters, and their "requires". They don't test the "requires" concerning the workFlowStatus changes (those are tested later in the "WORKFLOW STATUS REQUIREMENTS" part).

    ✔ adds voters added by owner + gets details
    ✔ refuses voter added by non-owner
    ✔ refuses voter if already registered
    ✔ adds a proposal + gets details
    ✔ refuses empty proposal
    ✔ refuses proposal from non-registered voter

### VOTING TESTS

The following tests verify the "setVote" function and its "requires".

    ✔ sets vote
    ✔ refuses vote from non-registered voter
    ✔ refuses invalid vote

### TALLY TEST

The following test verifies the "tallyVotes" function.

    ✔ finds winner

### BASIC EVENTS

The following tests verify the 3 main events emited during the lifetime of the contract.

    ✔ gets VoterRegistered event
    ✔ gets ProposalRegistered event
    ✔ gets Voted event

### WORKFLOW STATUS EVENTS

The following tests verify the "WorkflowStatusChanged" event, from one status to another.

    ✔ gets RegisteringVoters > ProposalsRegistrationStarted
    ✔ gets ProposalsRegistrationStarted > ProposalsRegistrationEnded
    ✔ gets ProposalsRegistrationEnded > VotingSessionStarted
    ✔ gets VotingSessionStarted > VotingSessionEnded

### WORKFLOW STATUS REQUIREMENTS

The following tests verify all the "requires" that are related to the workflow status.

    ✔ refuses new voter if status != registeringVoter
    ✔ refuses new proposal if status != ProposalsRegistrationStarted
    ✔ refuses new vote if status != VotingSessionStarted
    ✔ refuses to tally if status != VotingSessionEnded
    ✔ refuses to startProposalRegistering if status != RegisteringVoters
    ✔ refuses to endProposalRegistering if status != ProposalsRegistrationStarted
    ✔ refuses to startVotingSession if status != ProposalsRegistrationEnded
    ✔ refuses to endVotingSession if status != VotingSessionStarted
