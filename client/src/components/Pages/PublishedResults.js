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
import PieChart from '../PieChart';
const paillierBigint = require('paillier-bigint')


export class PublishedResults extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentAccount: null,
      ContractInstance: undefined,
      isContractOwner: false,
      web3: null,
      listOfCandidates: null,
      electionResults: null,
      sessionStarted: false,
      sessionEnded: false,
      constituency: "",
      toggleConstituencyList: false,
      decryptedConstituencyVotes: [],
      constituencyCandidatesNames: [],
      muValue: 0,
      lambdaValue: 0



    }
  }

  getElectionResults = async () => {
    let electionResults = [], mostVotes = BigInt(-1), listOfCandidates = [], numCandidates, i, candidate;
    let constituencyCandidatesNames = []; let decryptedConstituencyVotes = [];
   


    numCandidates = await this.state.ContractInstance.methods.getCandidatesCounter().call();

    for (i = 0; i < numCandidates; i++) {
      candidate = await this.state.ContractInstance.methods.retrievePublicResults(i).call();
      
      //candidate.encNumVotes = await privateKey.decrypt(BigInt(candidate.encNumVotes))


      if (candidate.constituency === this.state.constituency) {
        listOfCandidates.push(candidate);
        constituencyCandidatesNames.push(candidate.name);
        decryptedConstituencyVotes.push(candidate.encNumVotes);

        if (candidate.encNumVotes === mostVotes) {
          electionResults.push(candidate)
          

        } else if (candidate.encNumVotes > mostVotes) {
          electionResults.splice(0, electionResults.length) // clear array
          electionResults.push(candidate);
          mostVotes = candidate.encNumVotes;

        }
      }
      

     
    }

   

    this.setState({ electionResults: electionResults, toggleConstituencyList: true, listOfCandidates: listOfCandidates,
    decryptedConstituencyVotes, constituencyCandidatesNames })
  }

  publishTheResults = async () => {
    let publishableResults = [], listOfCandidates = [], numCandidates, i, candidate;
    let n, g;




    numCandidates = await this.state.ContractInstance.methods.getCandidatesCounter().call();

    for (i = 0; i < numCandidates; i++) {
      candidate = await this.state.ContractInstance.methods.retrievePublicResults(i).call();
      
      
      publishableResults.push(candidate.encNumVotes);

      this.setState({publishableResults})
     
    }

    await this.state.ContractInstance.methods.publishResults(publishableResults).send({
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

      let muValue, lambdaValue;

      muValue = await contractInstance.methods.mu().call();
      lambdaValue = await contractInstance.methods.lambda().call();


      this.setState({ sessionStarted: sessionStarted, sessionEnded: sessionEnded, muValue, lambdaValue})





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



            <Button className='button-vote' onClick={this.getElectionResults}>Get final election results</Button>
          </FormGroup>
        </div>

        <br></br>
        
        <div className='CandidateDetails-mid-sub-title'>
        <h1>Mu value is: {this.state.muValue}</h1>
        <h1>Lamba value is: {this.state.lambdaValue}</h1>
        </div>

        {this.state.toggleConstituencyList ?
          <div>
            <div className='CandidateDetails-mid-sub-title'>
            Results
             </div>

             <div className='body-content'>
             <PieChart decryptedVotes={this.state.decryptedConstituencyVotes}
                       candidatesNames={this.state.constituencyCandidatesNames}
                       selectedConstituency={this.state.constituency}
             
             ></PieChart>
                </div>



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

export default PublishedResults;