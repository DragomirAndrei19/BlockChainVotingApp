// Import styling
import '../../App.css';
// Importing Smart Contract as JSON
import VotingSmartContract from "../../contracts/VotingSmartContract.json"

// Importing utiltiies

import getWeb3 from "../../getWeb3"
import { Link } from 'react-router-dom';

// Importing components

import React, { Component } from 'react'
import NavbarAdmin from '../Navbar/NavbarAdmin';
import NavbarVoter from '../Navbar/NavbarVoter';
import Banner from '../Banner';
import { Card, Row, Col, ListGroup, ListGroupItem, Button } from 'react-bootstrap';

export class CandidatesList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentAccount: null,
      ContractInstance: undefined,
      isContractOwner: false,
      web3: null,
      numCandidates: 0,
      candidatesCounter: 0,
      listOfCandidates: null,
      hasElectionStarted: false,
      hasElectionEnded: false
      
    }
  }

  

  deleteCandidate = async (uniqueID) => {

    await this.state.ContractInstance.methods.deleteCandidate(uniqueID)
      .send({
        from: this.state.currentAccount,
        gas: 1000000
      })

    window.location.reload(false);

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

      let candidatesCounter = await contractInstance.methods.getCandidatesCounter().call();
      let numCandidates = await contractInstance.methods.getNumCandidates().call();
      let hasElectionStarted = await contractInstance.methods.getStartStatus().call();
      let hasElectionEnded = await contractInstance.methods.getEndStatus().call();

      this.setState({
        ContractInstance: contractInstance, currentAccount: listOfAccounts[0],
        web3: web3, numCandidates: numCandidates, candidatesCounter: candidatesCounter, 
        hasElectionStarted: hasElectionStarted, hasElectionEnded: hasElectionEnded
      });

      let listOfCandidates = [], candidate, i;
      for (i = 0; i < candidatesCounter; i++) {
        candidate = await contractInstance.methods.retrieveCandidatePublicData(i).call();
        if (candidate.constituency != 0) {
          // This is because it iterates through the deleted candidates from the mapping too
          listOfCandidates.push(candidate);
        }
      }
      this.setState({ listOfCandidates: listOfCandidates })



      const contractOwner = await contractInstance.methods.getOwnerAddress().call();
      if (this.state.currentAccount === contractOwner) {
        this.setState({ isContractOwner: true })
      }

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        "An error occured while trying to load accounts, web3 or the contract. Please check the console for more details!"
      );
      console.error(error);
    }
  }

  render() {

    if (!this.state.web3) {
      return (
        <div>
          <Banner bannerText={"Loading contract, list of accounts and web3..."}></Banner>
          {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}
          <div className='body-content'>
            <div>The application is loading. Please be patient</div>
            <img className='img-fluid' src={process.env.PUBLIC_URL + '/loading.gif'} alt="loading"></img>

          </div>
        </div>
      )
    }

    let listOfCandidates;
    if (this.state.listOfCandidates) {
      listOfCandidates = this.state.listOfCandidates.map((candidate) => {
        return (
          <Col key={candidate.uniqueID}>
            <div className='candidate'>
              <Card border="primary">
                <Card.Img variant="top" src={process.env.PUBLIC_URL + '/loading.gif'} alt="loading" />
                <Card.Body>
                  <Card.Title>{candidate.name}</Card.Title>
                  <Card.Text>
                    <b>Political platform:</b> {candidate.description}
                  </Card.Text>
                  <ListGroup className="list-group-flush">
                    <ListGroupItem><b>Candidate's unique ID: </b>{candidate.uniqueID}</ListGroupItem>
                    <ListGroupItem style={{ color: "red" }}><b>Candidate's constituency number: </b>{candidate.constituency}</ListGroupItem>
                    <ListGroupItem><b>Candidate's party: </b>{candidate.party}</ListGroupItem>

                    {this.state.isContractOwner && !this.state.hasElectionStarted && !this.state.hasElectionEnded
                      ? <>  <Link to="/EditCandidates" state={{sentItem: candidate}} className='btn btn-primary'>Edit Participant</Link>
                        <Button variant="danger" onClick={() => { this.deleteCandidate(candidate.uniqueID) }}>Delete Candidate</Button></>
                      : ""}
                  </ListGroup>
                </Card.Body>
              </Card>
            </div>
          </Col>
        )
      })
    }

    return (

      <>
        <Banner bannerText="List of candidates"></Banner>
        {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}

        <div className='ListOfCandidates-sub-title'>
          {
            this.state.numCandidates === 0 ? <>No candidates have been added yet</>
              : <>There are {this.state.numCandidates} candidates to choose from in this election session</>}
        </div>

        <div>
          <Row xs={1} md={3} className="g-4">
            {listOfCandidates}
          </Row>
        </div>

      </>


    )
  }
}

export default CandidatesList