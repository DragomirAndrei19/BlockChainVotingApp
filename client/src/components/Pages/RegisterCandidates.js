// Import styling
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap
import '../../App.css'; // custom styling
// Importing Smart Contract as JSON
import VotingSmartContract from "../../contracts/VotingSmartContract.json"

// Importing utiltiies

import getWeb3 from "../../getWeb3"

// Importing components

import React, { Component } from 'react'
import NavbarAdmin from '../Navbar/NavbarAdmin';
import NavbarVoter from '../Navbar/NavbarVoter';
import { Button, FormControl, FormGroup } from 'react-bootstrap';
import Banner from '../Banner';


export class RegisterCandidates extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentAccount: null,
      ContractInstance: undefined,
      isContractOwner: false,
      web3: null,
      candidateName: "",
      candidateParty: "",
      candidateDescription: "",
      candidateConstituency: "",
      errors: {},
      sessionStarted: false,
      sessionEnded: false
    }
  }

  formValidation = () => {
    const { candidateName, candidateParty, candidateDescription, candidateConstituency } = this.state;
    let isValid = true;
    const errors = {};
    if (candidateName.trim().length < 3 || candidateName.trim().length > 50) {
      errors.nameLength = "Candidate's name must be at least 3 characters long and at most 50";
      isValid = false;
    }
    if (isNaN(candidateConstituency.trim())) {
      errors.constituencyError = "The enter constituency is not a number"
      isValid = false;
    }
    if (parseInt(candidateConstituency) < 1 || parseInt(candidateConstituency) > 43) {
      errors.constituencyError = "Invalid constituency (must be a number between 1 and 43)"
      isValid = false;
    }
    if (candidateParty.trim().length < 3 || candidateParty.trim().length > 50) {
      errors.partyLength = "Party Name must be at least 3 characters long and at most 50";
      isValid = false;
    }
    if (candidateDescription.trim().length < 3 || candidateDescription.trim().length > 50) {
      errors.descriptionLength = "Description must be at least 3 characters long and at most 50";
      isValid = false;
    }
    this.setState({ errors })
    return isValid;
  }


  registerCandidate = async () => {

    const isValid = this.formValidation();
    if (isValid) {
      await this.state.ContractInstance.methods.registerCandidate(
        this.state.candidateName,
        this.state.candidateParty,
        this.state.candidateDescription,
        this.state.candidateConstituency

      ).send({
        from: this.state.currentAccount,
        gas: 1000000
      })

      // Reload page (clear inputs)
      window.location.reload(false);
    }


  }

  updateCandidateName = (event) => {
    this.setState({ candidateName: event.target.value })
    this.setState({ errors: "" })
  }

  updateCandidateParty = (event) => {
    this.setState({ candidateParty: event.target.value })
    this.setState({ errors: "" })
  }

  updateCandidateDescription = (event) => {
    this.setState({ candidateDescription: event.target.value })
    this.setState({ errors: "" })
  }

  updateCandidateConstituency = (event) => {
    this.setState({ candidateConstituency: event.target.value })
    this.setState({ errors: "" })
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


      let sessionStarted = await contractInstance.methods.getStartStatus().call();
      let sessionEnded = await contractInstance.methods.getEndStatus().call();


      this.setState({ ContractInstance: contractInstance, currentAccount: listOfAccounts[0], web3: web3,
      sessionStarted: sessionStarted, sessionEnded: sessionEnded });


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


    if (this.state.sessionStarted || this.state.sessionEnded) {
      return (
        <div>
          <Banner bannerText="Can't add candidates after election start!"></Banner>
          {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}

          <div className='body-content'>
            Impossible to add new candidates while an election session has already started/ended
          </div>

        </div>

      )
    }

    const { errors } = this.state;
    // Normal rendering conditions
    return (
      <div className='App'>
        <Banner bannerText={"Register Candidates"}></Banner>
        {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}

        <div className='form'>


          <FormGroup>
            <div className='form-label'>Enter candidate's name</div>
            <div className='form-input'>
              <FormControl
                input="text"
                value={this.state.candidateName}
                onChange={this.updateCandidateName}
              />
            </div>
          </FormGroup>

          <FormGroup>
            <div className='form-label'>Enter candidate's constituency number</div>
            <div className='form-input'>
              <FormControl
                input="text"
                value={this.state.candidateConstituency}
                onChange={this.updateCandidateConstituency}
              />
            </div>
          </FormGroup>


          <FormGroup>
            <div className='form-label'>Enter candidate's party</div>
            <div className='form-input'>
              <FormControl
                input="text"
                value={this.state.candidateParty}
                onChange={this.updateCandidateParty}
              />
            </div>
          </FormGroup>


          <FormGroup>
            <div className='form-label'>Enter candidate's political platform description</div>
            <div className='form-input'>
              <FormControl as="textarea" rows={3}
                input="text"
                value={this.state.candidateDescription}
                onChange={this.updateCandidateDescription}
              />
            </div>
          </FormGroup>


          <Button className='button-vote' onClick={this.registerCandidate}>
            Register Candidate
          </Button>
          {Object.keys(errors).map((key) => {
            return <div className='validation' key={key}>{"Validation error: " + errors[key]}</div>
          })}




        </div>
      </div>
    )



  }
}

export default RegisterCandidates