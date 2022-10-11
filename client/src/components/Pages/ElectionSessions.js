// Import styling
import '../../App.css';

// Importing Smart Contract
import VotingSmartContract from "../../contracts/VotingSmartContract.json"

// Importing utiltiies

import getWeb3 from "../../getWeb3"
import cryptoUtilities from '../../cryptoUtilities';

// Importing components

import React, { Component } from 'react'
import NavbarAdmin from '../Navbar/NavbarAdmin';
import NavbarVoter from '../Navbar/NavbarVoter';
import { Button, Alert } from 'react-bootstrap';
import Banner from "../Banner"
const paillierBigint = require('paillier-bigint')



export class ElectionSessions extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentAccount: null,
      ContractInstance: undefined,
      isContractOwner: false,
      web3: null,
      sessionStarted: false,
      sessionEnded: false,
      registrationStarted: false,
      registrationEnded: false,


      toggleKeysWarning: false,
      g: 0,
      nSquared: 0,
      lambda: 0,
      mu: 0



    }
  }

  startRegistration = async () => {
    let myPublicKey = await cryptoUtilities.getAccountPublicKey(this.state.currentAccount);
    await this.state.ContractInstance.methods.startRegistrationPhase(myPublicKey)
      .send({
        from: this.state.currentAccount,
        gas: 1000000
      })
    window.location.reload(false);
  }

  endRegistration = async () => {
    await this.state.ContractInstance.methods.endRegistrationPhase()
      .send({
        from: this.state.currentAccount,
        gas: 1000000
      })
    window.location.reload(false);
  }

  startElectionSession = async () => {


    let { g, n, nSquared, lambda, mu, increment, initialZeroCount } = await cryptoUtilities.generatePaillierKeys();
    
    this.setState({lambda: lambda.toString(), mu: mu.toString(), toggleKeysWarning: true });
    


    await this.state.ContractInstance.methods.startElection(
      g, n, nSquared, initialZeroCount, increment
    )
      .send({
        from: this.state.currentAccount,
        gas: 1000000
      })
    window.location.reload(false);
  }


  endElectionSession = async () => {
    await this.state.ContractInstance.methods.endElection()
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


      this.setState({ ContractInstance: contractInstance, currentAccount: listOfAccounts[0], web3: web3 });

      const contractOwner = await contractInstance.methods.getOwnerAddress().call();
      if (this.state.currentAccount === contractOwner) {
        this.setState({ isContractOwner: true })
      }

      let registrationStarted, registrationEnded, sessionStarted, sessionEnded;


      registrationStarted = await contractInstance.methods.hasRegistrationStarted().call();
      registrationEnded = await contractInstance.methods.hasRegistrationEnded().call();
      sessionStarted = await contractInstance.methods.getStartStatus().call();
      sessionEnded = await contractInstance.methods.getEndStatus().call();

      this.setState({
        sessionStarted: sessionStarted, sessionEnded: sessionEnded,
        registrationStarted: registrationStarted, registrationEnded: registrationEnded
      })





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



    return (
      <div className='App'>
        <div>
          <Banner bannerText={"Election session control"}></Banner>
        </div>
        {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}

        <div className='body-content'>

          <h1>1. Start registration phase/Publish the public key</h1>

          {this.state.registrationStarted
            ? <Button className='admin-buttons-start-s' onClick={this.startRegistration}>Start Registration Phase</Button>
            : <Button className='admin-buttons-start-e' onClick={this.startRegistration}>Start Registration Phase</Button>
          }
          {
            this.state.registrationEnded
              ? <Button className='admin-buttons-end-s' onClick={this.endRegistration}>End Registration Phase</Button>
              : <Button className='admin-buttons-end-e' onClick={this.endRegistration}>End Registration Phase</Button>
          }

          <h1>2. Panel for starting/stopping an election session</h1>
          <div className='admin-buttons'>
            {
              this.state.sessionStarted
                ? <Button className='admin-buttons-start-s' onClick={this.startElectionSession}>Start Election Session</Button>
                : <Button className='admin-buttons-start-e' onClick={this.startElectionSession}>Start Election Session</Button>
            }
            {
              this.state.sessionEnded
                ? <Button className='admin-buttons-end-s' onClick={this.endElectionSession}>End Election Session</Button>
                : <Button className='admin-buttons-end-e' onClick={this.endElectionSession}>End Election Session</Button>
            }

            {this.state.toggleKeysWarning
              ? <Alert variant="danger" onClose={() => this.setState({ toggleKeysWarning: false })} dismissible>
                <Alert.Heading>Please note the lambda and mu values!</Alert.Heading>
                <p><b>MU: </b> {this.state.mu}</p>
                <p><b>LAMBDA: {this.state.lambda}</b></p>
              </Alert>
              : ''}

          </div>
        </div>
      </div>
    )


  }
}

export default ElectionSessions;