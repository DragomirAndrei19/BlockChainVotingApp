// Import styling
import '../../App.css';

// Importing Smart Contract
import VotingSmartContract from "../../contracts/VotingSmartContract.json"

// Importing utiltiies

import getWeb3 from "../../getWeb3"
/* global BigInt */


// Importing components

import React, { Component } from 'react'
import NavbarAdmin from '../Navbar/NavbarAdmin';
import NavbarVoter from '../Navbar/NavbarVoter';
import { Button, FormControl, FormGroup, Col, Card, ListGroup, ListGroupItem, Row, Accordion } from 'react-bootstrap';
import Banner from '../Banner';



export class VotersList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            currentAccount: null,
            ContractInstance: undefined,
            isContractOwner: false,
            web3: null,
            listOfVoters: null,
            listOfConstituencyVoters: null,
            numVoters: 0,
            constituency: "",
            toggleConstituencyList: false,
            toggleAllList: false,
            noConstituencyVoters: 0,
            noVerifiedConstituencyVoters: 0,
            noVotedConstituencyVoters: 0,

        }
    }


    seeAllVoters = () => {
        this.setState({ toggleAllList: true, toggleConstituencyList: false })
    }

    seeConstituencyVoters = () => {
        let listOfConstituencyVoters = [];
        let { numVoters, constituency, listOfVoters } = this.state;
        let i, noConstituencyVoters = 0;
        let noVerifiedConstituencyVoters = 0;
        let noVotedConstituencyVoters = 0;

        for (i = 0; i < numVoters; i++) {
            if (listOfVoters[i].constituency === constituency) {
                listOfConstituencyVoters.push(listOfVoters[i]);
                noConstituencyVoters++;
                if (listOfVoters[i].isVerified) noVerifiedConstituencyVoters++;
                if (listOfVoters[i].hasVoted) noVotedConstituencyVoters++;
            }
        }
        this.setState({
            listOfConstituencyVoters, toggleAllList: false, toggleConstituencyList: true,
            noConstituencyVoters, noVerifiedConstituencyVoters, noVotedConstituencyVoters
        })

    }

    updateConstituencyResults = (event) => {
        this.setState({
            constituency: event.target.value
        })
    }



    componentDidMount = async () => {
        // This refreshes our page, causing our web3 instance to be loaded every time
        if (!window.location.hash) {
            window.location = window.location + '#web3Loaded';
            window.location.reload();
        }

        try {
            // Fetching the web3 instance + network provider
            const web3 = await getWeb3();

            // We utilize web3 in order to fetch all the user's accounts
            const listOfAccounts = await web3.eth.getAccounts();

            // Fetching an instance of the contract

            const networkId = await web3.eth.net.getId();
            const deployedNetwork = VotingSmartContract.networks[networkId];
            const contractInstance = new web3.eth.Contract(
                VotingSmartContract.abi,
                deployedNetwork && deployedNetwork.address,
            );
            // Set web3, accounts, and contract to the state. We can now interact with the contract's methods


            this.setState({ ContractInstance: contractInstance, currentAccount: listOfAccounts[0], web3: web3 });

            const contractOwner = await contractInstance.methods.getOwnerAddress().call();
            if (this.state.currentAccount === contractOwner) {
                this.setState({ isContractOwner: true })
            }



            let numVoters, i, voterAddress, voterPublicData, listOfVoters = [];
            numVoters = await contractInstance.methods.getNumVoters().call();


            for (i = 0; i < numVoters; i++) {
                voterAddress = await contractInstance.methods.votersAddresses(i).call();
                voterPublicData = await contractInstance.methods.retrieveAllVoterData(voterAddress).call();

                listOfVoters.push(voterPublicData);

            }
            this.setState({ listOfVoters: listOfVoters, numVoters: numVoters })





        } catch (error) {
            // Catch any errors for any of the above operations.
            alert(
                "An error occured while trying to load accounts, web3 or the contract. Please check the console for more details!"
            );
            console.error(error);
        }
    }

    render() {



        // If web3 has not loaded yet
        if (!this.state.web3) {
            return (
                <div>
                    <div className='Banner-title'>
                        <h1>Loading contract, list of accounts and web3...</h1>
                    </div>
                    {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}
                </div>
            )
        }




        let listOfVoters;

        if (this.state.listOfVoters) {
            listOfVoters = this.state.listOfVoters.map((voter) => {


                //console.log(voter.verificationTime)
                let verificationTime = new Date(voter.verifiedTime * 1000); // seconds -> milis
                let votingTime = new Date(voter.votedTime * 1000); // seconds -> milis




                return (


                    <Accordion key={voter.voterAddress} flush>
                        <Accordion.Item eventKey="0">
                            <Accordion.Header><h3> Voter: {voter.voterAddress} </h3></Accordion.Header>
                            <Accordion.Body>
                                <ListGroup as="ul">
                                    <ListGroup.Item as="li" active>
                                        Voter's Constituency: {voter.constituency}
                                    </ListGroup.Item>
                                    <ListGroup.Item as="li">Is verified: {voter.isVerified ? "YES" : "NO"}</ListGroup.Item>
                                    {voter.isVerified ?
                                        <ListGroup.Item as="li">Verification time: {verificationTime.toString()} </ListGroup.Item>
                                        : ""}
                                    <ListGroup.Item as="li">Has voted: {voter.hasVoted ? "YES" : "NO"}</ListGroup.Item>
                                    {voter.hasVoted ?
                                        <ListGroup.Item as="li">Voting time: {votingTime.toString()} </ListGroup.Item>
                                        : ""}


                                </ListGroup>

                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>



                )
            })
        }


        let listOfConstituencyVoters;

        if (this.state.listOfConstituencyVoters) {
            listOfConstituencyVoters = this.state.listOfConstituencyVoters.map((voter) => {



                let verificationTime = new Date(voter.verifiedTime * 1000); // seconds -> milis
                let votingTime = new Date(voter.verifiedTime * 1000); // seconds -> milis

                console.log(votingTime)


                return (


                    <Accordion key={voter.voterAddress} flush>
                        <Accordion.Item eventKey="0">
                            <Accordion.Header><h3> Voter: {voter.voterAddress} </h3></Accordion.Header>
                            <Accordion.Body>
                                <ListGroup as="ul">
                                    <ListGroup.Item as="li" active>
                                        Voter's Constituency: {voter.constituency}
                                    </ListGroup.Item>
                                    <ListGroup.Item as="li">Is verified: {voter.isVerified ? "YES" : "NO"}</ListGroup.Item>
                                    {voter.isVerified ?
                                        <ListGroup.Item as="li">Verification time: {verificationTime.toString()} </ListGroup.Item>
                                        : ""}
                                    <ListGroup.Item as="li">Has voted: {voter.hasVoted ? "YES" : "NO"}</ListGroup.Item>
                                    {voter.hasVoted ?
                                        <ListGroup.Item as="li">Voting time: {votingTime.toString()} </ListGroup.Item>
                                        : ""}


                                </ListGroup>

                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>






                )
            })
        }




        return (
            <div className='App'>
                <div>
                    <Banner bannerText={"List of voters"}></Banner>
                </div>
                {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}

                <div className='form'>
                    <FormGroup>
                        <div className='form-label'>Constituency to show voters in: </div>
                        <div className='form-input'>
                            <FormControl
                                input="text"
                                value={this.state.constituency}
                                onChange={this.updateConstituencyResults}

                            />
                        </div>


                        <Button className='button-vote' onClick={this.seeAllVoters}>See All Voters</Button>
                        <Button className='button-vote' onClick={this.seeConstituencyVoters}>See Constituency Voters</Button>
                    </FormGroup>
                </div>

                {this.state.toggleAllList
                    ? <div className='body-content'>
                        <div className="CandidateDetails-mid-sub-title">
                            All voters - {this.state.numVoters}
                        </div>
                        <Row xs={1} md={1} className="g-4">
                            {listOfVoters}
                        </Row>


                    </div>
                    : ""}
                {this.state.toggleConstituencyList
                    ? <div className="body-content">
                        <div className="CandidateDetails-mid-sub-title">
                            <div>Voters in selected constituency - {this.state.noConstituencyVoters}</div>
                            <div>Voters verified in constituency - {this.state.noVerifiedConstituencyVoters}</div>
                            <div>Voters who have voted in constituency - {this.state.noVotedConstituencyVoters}</div>

                        </div>
                        <Row xs={1} md={1} className="g-4">
                            {listOfConstituencyVoters}
                        </Row>


                    </div>
                    : ""}



            </div>
        )


    }
}

export default VotersList;