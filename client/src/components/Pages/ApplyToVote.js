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
import { Button, FormControl, FormGroup } from 'react-bootstrap';
import Banner from '../Banner';
import cryptoUtilities from '../../cryptoUtilities';


export class ApplyToVote extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentAccount: null,
      ContractInstance: undefined,
      isContractOwner: false,
      web3: null,
      voterName: "",
      voterCNP: "",
      voterConstituency: "",
      listOfCandidates: null,
      voterHasRegistered: false,
      voterIsVerified: false,
      adminPublicKey: null,
      registrationStarted: false,
      registrationEnded: false,
      errors: {}
    }
  }

  formValidation = () => {
    const { voterName, voterCNP, voterConstituency } = this.state;
    let isValid = true;
    const errors = {};
    if (voterName.trim().length < 3 || voterName.trim().length > 50) {
      errors.nameLength = "Name must be at least 3 characters long and at most 50";
      isValid = false;
    }
    if (isNaN(voterConstituency.trim())) {
      errors.constituencyError = "The enter constituency is not a number"
      isValid = false;
    }
    if (parseInt(voterConstituency) < 1 || parseInt(voterConstituency) > 43) {
      errors.constituencyError = "Invalid constituency (must be a number between 1 and 43)"
      isValid = false;
    }
    if (voterConstituency.length < 1) {
      errors.constituencyError = "You must enter a constituency number beforehand"
      isValid = false;
    }
    if (voterCNP.length !== 13) {
      errors.CNPerror = "Invalid CNP/SSN. Must have exactly 13 digits"
      isValid = false;
    }
    const reg = new RegExp('^[0-9]+$'); // only numbers allowed
    if (reg.test(voterCNP) === false) {
      errors.CNPerror = "Invalid CNP/SSN. Must contain only numbers and be not null"
      isValid = false;
    }



    this.setState({ errors })
    return isValid;
  }





  applyToVote = async () => {

    const isValid = this.formValidation();
    if (isValid) {

      let encryptedName = cryptoUtilities.encryptData(this.state.adminPublicKey, this.state.voterName);
      let encryptedCNP = cryptoUtilities.encryptData(this.state.adminPublicKey, this.state.voterCNP);
      await this.state.ContractInstance.methods.applyToVote(
        encryptedName,
        encryptedCNP,
        this.state.voterConstituency
      ).send({
        from: this.state.currentAccount,
        gas: 1000000
      });
      //Reload
      window.location.reload(false);
    }




  }

  updateVoterName = (event) => {
    this.setState({ voterName: event.target.value })
    this.setState({ errors: "" })
  }

  updateVoterCNP = (event) => {
    this.setState({ voterCNP: event.target.value })
    this.setState({ errors: "" })
  }

  updateVoterConstituency = (event) => {
    this.setState({ voterConstituency: event.target.value })
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


      this.setState({ ContractInstance: contractInstance, currentAccount: listOfAccounts[0], web3: web3 });

      let numVoters, voterHasRegistered, voterAddress, i, voterHasBeenApproved, voter;

      numVoters = await contractInstance.methods.getNumVoters().call();

      for (i = 0; i < numVoters; i++) {

        voterAddress = await contractInstance.methods.votersAddresses(i).call();

        if (voterAddress === this.state.currentAccount) {
          voterHasRegistered = true;
          break;
        }


      }
      // Additional check

      voter = await contractInstance.methods.retrieveVoterPublicData(this.state.currentAccount).call();

      voterHasBeenApproved = voter.isVerified;

      // Obtraining the admin public key from blockchain

      

      let registrationStarted = await contractInstance.methods.hasRegistrationStarted().call();
      let registrationEnded = await contractInstance.methods.hasRegistrationEnded().call();

      if(registrationStarted) {
        let adminPublicKey = await contractInstance.methods.getAdminPublicKey().call();
        this.setState({adminPublicKey: adminPublicKey});
      }

      this.setState({
        voterHasRegistered: voterHasRegistered, voterHasBeenApproved: voterHasBeenApproved,
       registrationStarted: registrationStarted, registrationEnded: registrationEnded
      })


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

    
    // If voters has already requested approval
    if (this.state.voterHasRegistered && !this.state.voterHasBeenApproved) {
      return (
        <div>
          <Banner bannerText={"You have already requested approval"}></Banner>
          {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}
          <div className='body-content'>
            <div>Please be patient. Approvals might take a while</div>
            <img className='img-fluid' src={process.env.PUBLIC_URL + '/loading.gif'} alt="loading"></img>

          </div>
        </div>
      )
    }
    else if (this.state.voterHasBeenApproved) {
      return (
        <div>
          <Banner bannerText={"Verified!"}></Banner>
          {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}
          <div className='body-content'>
            <div>You have been verified and you can cast your vote once the session starts!</div>
            <img className='img-fluid mt-4' src={process.env.PUBLIC_URL + '/verified.png'} alt="verified"></img>

          </div>
        </div>
      )
    }

    if (!this.state.registrationStarted && !this.state.registrationEnded) {
      return (
        <div>
          <Banner bannerText={"The registration phase has not started yet!"}></Banner>

          <div className='ListOfCandidates-sub-title'>
            Please wait for the administrator to start the registration phase
          </div>
          {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}

          <div className='body-content'>

            You can apply to be verified after a registration phase has been initiated
          </div>

        </div>
      )
    }

    if (this.state.registrationEnded) {
      return (
        <div>
          <Banner bannerText={"The registration phase has already ended!"}></Banner>

          <div className='ListOfCandidates-sub-title'>
            Please wait for the administrator to start a new registration phase
          </div>
          {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}

          <div className='body-content'>

            You can only get verified if you register during this phase
          </div>

        </div>
      )
    }


    // Normal rendering
    const { errors } = this.state;
    return (
      <div className='App'>
        <Banner bannerText={"Approval request form"}></Banner>

        {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}


        <div className='form'>
          <FormGroup>
            <div className="form-label">Enter Full Name - </div>
            <div className="form-input">
              <FormControl
                input='text'
                value={this.state.voterName}
                onChange={this.updateVoterName}
              />
            </div>
          </FormGroup>

          <FormGroup>
            <div className="form-label">Enter Your Constituency Number - </div>
            <div className="form-input">
              <FormControl
                input='text'
                value={this.state.voterConstituency}
                onChange={this.updateVoterConstituency}
              />
            </div>
          </FormGroup>

          <FormGroup>
            <div className="form-label">Enter Your CNP/SSN - </div>
            <div className="form-input">
              <FormControl
                input='text'
                value={this.state.voterCNP}
                onChange={this.updateVoterCNP}
              />
            </div>
          </FormGroup>

          <Button className='button-vote' onClick={this.applyToVote}>
            Demand approval
          </Button>
          {Object.keys(errors).map((key) => {
            return <div className='validation' key={key}>{"Validation error: " + errors[key]}</div>
          })}
        </div>

      </div>
    )





  }
}

export default ApplyToVote