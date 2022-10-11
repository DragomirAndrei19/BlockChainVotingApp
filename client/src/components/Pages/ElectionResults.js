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
import { Button, FormControl, FormGroup, Col, Card, ListGroup, ListGroupItem, Row } from 'react-bootstrap';
import Banner from '../Banner';
const paillierBigint = require('paillier-bigint')


export class ElectionResults extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentAccount: null,
      ContractInstance: undefined,
      isContractOwner: false,
      web3: null,
      electionResults: null,
      listOfCandidates: null,
      publishableResults: null,
      sessionStarted: false,
      sessionEnded: false,
      constituency: "",
      toggleConstituencyList: false,

      muValue: 0,
      lambdaValue: 0



    }
  }

  getElectionResults = async () => {
    let electionResults = [], mostVotes = BigInt(-1), listOfCandidates = [], numCandidates, i, candidate;
    let n, g;

    let {lambdaValue, muValue} = this.state;


    n= await this.state.ContractInstance.methods.n().call();
    g= await this.state.ContractInstance.methods.g().call();
    const publicKey = new paillierBigint.PublicKey(BigInt(n), BigInt(g));
    const privateKey = new paillierBigint.PrivateKey(BigInt(lambdaValue), BigInt(muValue), publicKey)


    numCandidates = await this.state.ContractInstance.methods.getCandidatesCounter().call();

    for (i = 0; i < numCandidates; i++) {
      candidate = await this.state.ContractInstance.methods.retrieveAllCandidateData(i).call();
      
      //candidate.encNumVotes = await privateKey.decrypt(BigInt(candidate.encNumVotes))

      let tempCandidate = Object.assign({}, candidate)
      let decryptedNumVotes = await privateKey.decrypt(BigInt(tempCandidate.encNumVotes));
      tempCandidate.encNumVotes = Number(decryptedNumVotes);
      
      console.log(tempCandidate)

      if (tempCandidate.constituency === this.state.constituency) {
        listOfCandidates.push(tempCandidate);

        if (tempCandidate.encNumVotes === mostVotes) {
          electionResults.push(tempCandidate)

        } else if (tempCandidate.encNumVotes > mostVotes) {
          electionResults.splice(0, electionResults.length) // clear array
          electionResults.push(tempCandidate);
          mostVotes = tempCandidate.encNumVotes;

        }
      }

     
    }

    this.setState({ electionResults: electionResults, toggleConstituencyList: true, listOfCandidates: listOfCandidates })
  }

  publishTheResults = async () => {
    let publishableResults = [], listOfCandidates = [], numCandidates, i, candidate;
    let n, g;

    let {lambdaValue, muValue} = this.state;


    n= await this.state.ContractInstance.methods.n().call();
    g= await this.state.ContractInstance.methods.g().call();
    const publicKey = new paillierBigint.PublicKey(BigInt(n), BigInt(g));
    const privateKey = new paillierBigint.PrivateKey(BigInt(lambdaValue), BigInt(muValue), publicKey)


    numCandidates = await this.state.ContractInstance.methods.getCandidatesCounter().call();

    for (i = 0; i < numCandidates; i++) {
      candidate = await this.state.ContractInstance.methods.retrieveAllCandidateData(i).call();
      
      //candidate.encNumVotes = await privateKey.decrypt(BigInt(candidate.encNumVotes))

      let tempCandidate = Object.assign({}, candidate)
      let decryptedNumVotes = await privateKey.decrypt(BigInt(tempCandidate.encNumVotes));
      tempCandidate.encNumVotes = Number(decryptedNumVotes);
      
      publishableResults.push(tempCandidate.encNumVotes);

      this.setState({publishableResults})
     
    }

    await this.state.ContractInstance.methods.publishResults(publishableResults, this.state.muValue, this.state.lambdaValue).send({
      from: this.state.currentAccount,
      gas: 1000000
    })
  }

  updateConstituencyResults = (event) => {
    this.setState({
      constituency: event.target.value
    })
  }

  updateMUValue = (event) => {
    this.setState({
      muValue: event.target.value
    })
  }

  updateLambdaValue = (event) => {
    this.setState({
      lambdaValue: event.target.value
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

      let sessionStarted, sessionEnded;

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
          <div className='Banner-title'>
            <h1>Loading contract, list of accounts and web3...</h1>
          </div>
          {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}
        </div>
      )
    }

    // if current account is not an admin
    if (!this.state.isContractOwner) {
      return (
        <div>
          <Banner bannerText="You don't have sufficient permissions"></Banner>
          {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}

          <div className='body-content'>
            Only an election administrator can register new candidates
          </div>

        </div>

      )
    }

    if (!this.state.sessionEnded && this.state.sessionStarted) {
      return (


        <div>
          <Banner bannerText={"Results will be available only after elections ending"}></Banner>
          {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}
          <div className='body-content'>
            <h1>Results cannot be viewed before all participants casted their votes!</h1>
          </div>
        </div>

      )
    }

    if (!this.state.sessionEnded && !this.state.sessionStarted) {
      return (
        <div>
          <Banner bannerText={"No voting session is currently in progress"}></Banner>
          {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}
          <div className='body-content'>
            <h1>Results will be displayed once a session has been started and finalized!</h1>
          </div>
        </div>
      )
    }



    let electionLeadersList;

    if (this.state.electionResults) {


      electionLeadersList = this.state.electionResults.map((candidate) => {
        return (
          <Col key={candidate.uniqueID}>
            <div className='candidate'>
              <Card border="primary">
                <Card.Header as="h5">Candidate has: {candidate.encNumVotes} votes</Card.Header>

                <Card.Body>
                  <Card.Title>{candidate.name}</Card.Title>
                  <Card.Text>
                    <b>Political platform:</b> {candidate.description}
                  </Card.Text>
                  <ListGroup className="list-group-flush">
                    <ListGroupItem><b>Candidate's unique ID: </b>{candidate.uniqueID}</ListGroupItem>
                    <ListGroupItem style={{ color: "red" }}><b>Candidate's constituency number: </b>{candidate.constituency}</ListGroupItem>
                    <ListGroupItem><b>Candidate's party: </b>{candidate.party}</ListGroupItem>
                  </ListGroup>
                </Card.Body>
              </Card>
            </div>
          </Col>
        )
      })

    }

    let constituencyCandidatesList;

    if (this.state.listOfCandidates) {

      constituencyCandidatesList = this.state.listOfCandidates.map((candidate) => {
        return (
          <Col key={candidate.uniqueID}>
            <div className='candidate'>
              <Card border="primary">
                <Card.Header as="h5">Candidate has: {candidate.encNumVotes} votes</Card.Header>
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
          <Banner bannerText={"Final results"}></Banner>
        </div>
        {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}

        <div className='form'>
          <FormGroup>
            <div className='form-label'>The constituency you want to see the results of is: </div>
            <div className='form-input'>
              <FormControl
                input="text"
                value={this.state.constituency}
                onChange={this.updateConstituencyResults}

              />
            </div>


            <div className='form-label'>MU value: </div>
            <div className='form-input'>
              <FormControl
                input="text"
                value={this.state.muValue}
                onChange={this.updateMUValue}

              />
            </div>

            <div className='form-label'>LAMBDA value: </div>
            <div className='form-input'>
              <FormControl
                input="text"
                value={this.state.lambdaValue}
                onChange={this.updateLambdaValue}

              />
            </div>

            <Button className='button-vote' onClick={this.getElectionResults}>Get final election results</Button>
            <Button className='button-vote' onClick={this.publishTheResults}>Publish the results and key</Button>
          </FormGroup>
        </div>

        <br></br>

        {this.state.toggleConstituencyList ?
          <div>
            <div className="CandidateDetails-mid-sub-title">
              Election leaders -
            </div>
            <Row xs={1} md={1} className="g-4">
              {electionLeadersList}
            </Row>

            <div className="CandidateDetails-mid-sub-title">
              Constituency Votes -
            </div>
            <Row xs={1} md={3} className="g-4">
              {constituencyCandidatesList}
            </Row>
          </div>


          : ''}
      </div>
    )


  }
}

export default ElectionResults;