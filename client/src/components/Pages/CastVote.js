// Import styling
import '../../App.css';
// Importing Smart Contract
import VotingSmartContract from "../../contracts/VotingSmartContract.json"

// Importing utiltiies

import getWeb3 from "../../getWeb3"

// Importing components

import React, { Component } from 'react'
import NavbarAdmin from '../Navbar/NavbarAdmin';
import NavbarVoter from '../Navbar/NavbarVoter';
import { Button, FormControl, FormGroup, Row, Col, Card, ListGroup, ListGroupItem, Alert, Container } from 'react-bootstrap';
import Banner from '../Banner';
import { Link } from 'react-router-dom';

export class CastVote extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentAccount: null,
      ContractInstance: undefined,
      isContractOwner: false,
      web3: null,
      listOfCandidates: null,
      candidateID: "",
      voterAccount: null,
      listOfConstituencyCandidates: null,
      toggleConstituencyWarning: false,
      sessionStarted: false,
      sessionEnded: false


    }
  }




  castVote = async () => {
    let candidate;
    candidate = await this.state.ContractInstance.methods.retrieveCandidatePublicData(this.state.candidateID).call();


    if (this.state.voterAccount.constituency !== candidate.constituency) {
      this.setState({ toggleConstituencyWarning: true })
    } else {
      await this.state.ContractInstance.methods.castVote(this.state.candidateID)
        .send({
          from: this.state.currentAccount,
          gas: 1000000
        })
      this.setState({ toggleConstituencyWarning: false })
      // Reload
      window.location.reload(false);
    }
  }

  updateCandidateID = (event) => {
    this.setState({ candidateID: event.target.value });
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

      let voterAccount, numCandidates, candidate, i, sessionStarted, sessionEnded, listOfCandidates = [];

      numCandidates = await contractInstance.methods.getCandidatesCounter().call();


      voterAccount = await contractInstance.methods.retrieveVoterPublicData(this.state.currentAccount).call();
      this.setState({ voterAccount: voterAccount })

      for (i = 0; i < numCandidates; i++) {
        candidate = await contractInstance.methods.retrieveCandidatePublicData(i).call();
        if (voterAccount.constituency === candidate.constituency) {
          listOfCandidates.push(candidate);
        }
      }

      //console.log(listOfAccounts)

      this.setState({ listOfConstituencyCandidates: listOfCandidates })


      const contractOwner = await contractInstance.methods.getOwnerAddress().call();
      if (this.state.currentAccount === contractOwner) {
        this.setState({ isContractOwner: true })
      }

      sessionStarted = await contractInstance.methods.getStartStatus().call();
      sessionEnded = await contractInstance.methods.getEndStatus().call();

      this.setState({ sessionStarted: sessionStarted, sessionEnded: sessionEnded })




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
          <Banner bannerText={"Loading contract, list of accounts and web3..."}></Banner>
          {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}
          <div className='body-content'>
            <div>The application is loading. Please be patient</div>
            <img className='img-fluid' src={process.env.PUBLIC_URL + '/loading.gif'} alt="loading"></img>

          </div>
        </div>
      )
    }


    if (!this.state.sessionStarted) {
      return (
        <div>
          <Banner bannerText={"The voting session has not started yet!"}></Banner>

          <div className='ListOfCandidates-sub-title'>
            Please wait for the administrator to start an election session
          </div>
          {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}

          <div className='body-content'>

            Once a voting session is initiated, you can cast your vote using the unique candidate's ID
          </div>

        </div>
      )
    }

    if (this.state.sessionEnded) {
      return (
        <div>

          <Banner bannerText={"The voting session has already ended"}></Banner>

          <div className='ListOfCandidates-sub-title'>
            You can only vote if the administrator opens the session again.
          </div>
          {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}

          <div className='body-content'>
            You have missed the appointed voting session
          </div>

        </div>
      )
    }

    if (this.state.voterAccount) {

      //CASE 1
      if (!this.state.voterAccount.isVerified) {
        return (
          <div>
            
            <Banner bannerText={"Account is unverified!"}></Banner>
            {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}

            <div className='ListOfCandidates-sub-title'>
              You must be verified by an administrator first in order to cast your vote!
            </div>

            <div className='body-content'>
              You can request approval <Link to="/ApplyToVote">HERE</Link> and will be notified when progress is made.
            </div>
           
          </div>
        )
      }

      if (this.state.voterAccount.hasVoted) {
        return (
          <div>
             <Banner bannerText={"You have successfully voted"}></Banner>

            <div className='ListOfCandidates-sub-title'>
              You can vote a single time during an election session!
            </div>
            {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}

            <div className='body-content'>
              <p> The coresponding transaction can be checked.</p>
              <p>Attempting to vote more than a single time is considered fraud in accordance to the voting laws!</p>
              <p><img src={process.env.PUBLIC_URL + '/vote-success.png'} alt="vote-success"></img></p>
            </div>
          </div>
        )
      }
    }

    let listOfCandidates;


    if (this.state.listOfConstituencyCandidates) {
      listOfCandidates = this.state.listOfConstituencyCandidates.map((candidate) => {
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
                    <ListGroupItem><b>Candidate's constituency number: </b>{candidate.constituency}</ListGroupItem>
                    <ListGroupItem><b>Candidate's party: </b>{candidate.party}</ListGroupItem>
                  </ListGroup>
                </Card.Body>
              </Card>
            </div>
          </Col>
        )
      })
    }

    return (
      <div className='App'>
        <div>
          <Banner bannerText={"Cast your vote"}></Banner>
        </div>
        {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}

        <div className='form'>
          <FormGroup>
            <div className='form-label'>Enter desired candidate's ID -</div>
            <div className='form-input'>
              <FormControl
                input='text'
                value={this.state.candidateID}
                onChange={this.updateCandidateID}
              />
            </div>

            <Button className='button-vote' onClick={this.castVote}>Cast your vote</Button>
          </FormGroup>
        </div>

        {this.state.toggleConstituencyWarning
          ? <Alert variant="danger" onClose={() => this.setState({ toggleConstituencyWarning: false })} dismissible>
            <Alert.Heading>Candidate is not in your constituency!</Alert.Heading>
            <p>
              You can only vote for a candidate in your constituency!
            </p>
          </Alert>
          : ''}

        <div className='CandidateDetails-mid-sub-title'>
          List of candidates from your own constituency
        </div>

        <Container>
        <Row xs={1} md={2} className="g-4">
          {listOfCandidates}
        </Row>
        </Container>
      </div>
    )


  }
}

export default CastVote