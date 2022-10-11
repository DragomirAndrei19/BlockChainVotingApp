// Import styling
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap
import '../../App.css'; // custom styling
// Importing Smart Contract as JSON
import VotingSmartContract from "../../contracts/VotingSmartContract.json"

// Importing utiltiies

import getWeb3 from "../../getWeb3"

// Importing components

import React, { useEffect, useState } from 'react'
import NavbarAdmin from '../Navbar/NavbarAdmin';
import NavbarVoter from '../Navbar/NavbarVoter';
import { Button, FormControl, FormGroup } from 'react-bootstrap';
import Banner from '../Banner';
import { useLocation, Navigate } from 'react-router-dom';


function EditCandidates() {

  const [currentAccount, setCurrentAccount] = useState(null);
  const [contractInstance, setContractInstance] = useState(undefined);
  const [isContractOwner, setIsContractOwner] = useState(false);
  const [web3, setWeb3] = useState(null);
  const [candidateID, setCandidateID] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateParty, setCandidateParty] = useState("");
  const [candidateDescription, setCandidateDescription] = useState("");
  const [candidateConstituency, setCandidateConstituency] = useState("");
  const [errors, setErrors] = useState({});
  const [redirect, setRedirect] = useState(false);
  const { state } = useLocation();


  const formValidation = () => {
    let isValid = true;
    const errors = {};
    if (isNaN(candidateID.trim())) {
      errors.candidateID = "Invalid ID, must be a number"
      isValid = false;
    }
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
    setErrors(errors);
    return isValid;

  }

  const editCandidate = async () => {
    const isValid = formValidation();
    console.log("Avem: " + isValid)
    if (isValid) {
      await contractInstance.methods.editCandidate(
        candidateID,
        candidateName,
        candidateParty,
        candidateDescription,
        candidateConstituency

      ).send({
        from: currentAccount,
        gas: 1000000
      })

      // Redirect
      setRedirect(true);
    }
  }

  const updateCandidateID = (event) => {
    setCandidateID(event.target.value);
    setErrors({});
  }


  const updateCandidateName = (event) => {
    setCandidateName(event.target.value)
    setErrors({});
  }

  const updateCandidateParty = (event) => {
    setCandidateParty(event.target.value);
    setErrors({});
  }

  const updateCandidateDescription = (event) => {
    setCandidateDescription(event.target.value);
    setErrors({});
  }

  const updateCandidateConstituency = (event) => {
    setCandidateConstituency(event.target.value);
    setErrors({});
  }

  useEffect(() => {
    // This refreshes our page, causing our web3 instance to be loaded every time



    async function fetchFromContract() {
      // Fetching the web3 instance + network provider
      const _web3 = await getWeb3();

      // We utilize web3 in order to fetch all the user's accounts
      const listOfAccounts = await _web3.eth.getAccounts();

      // Fetching an instance of the contract

      const networkId = await _web3.eth.net.getId();
      const deployedNetwork = VotingSmartContract.networks[networkId];
      const _contractInstance = new _web3.eth.Contract(
        VotingSmartContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state. We can now interact with the contract's methods

      setContractInstance(_contractInstance);
      setCurrentAccount(listOfAccounts[0]);
      setWeb3(_web3);

      let currentAccountz = listOfAccounts[0];

      const contractOwner = await _contractInstance.methods.getOwnerAddress().call();
      if (currentAccountz === contractOwner) {
        setIsContractOwner(true)
      }

      if (state) {
        setCandidateID(state.sentItem.uniqueID);
        setCandidateName(state.sentItem.name)
        setCandidateConstituency(state.sentItem?.constituency);
        setCandidateDescription(state.sentItem.description);
        setCandidateParty(state.sentItem.party)

      }


    }

    fetchFromContract();




  }, [])


  ///////// Render

  if(redirect) {
    return <Navigate to="/CandidatesList"></Navigate>
  }


  // If web3 has not loaded yet
  if (!web3) {
    return (
      <div>
        <Banner bannerText={"Loading contract, list of accounts and web3..."}></Banner>
        {isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}
        <div className='body-content'>
          <div>The application is loading. Please be patient</div>
          <img className='img-fluid' src={process.env.PUBLIC_URL + '/loading.gif'} alt="loading"></img>

        </div>
      </div>
    )
  }

  // if current account is not an admin
  if (!isContractOwner) {
    return (
      <div>
        <Banner bannerText="You don't have sufficient permissions"></Banner>
        {isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}

        <div className='body-content'>
          Only an election administrator can register new candidates
        </div>

      </div>

    )
  }

  // Normal rendering conditions
  return (
    <div className='App'>
      <Banner bannerText={"Edit Candidates"}></Banner>
      {isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}

      <div className='form2'>

        <FormGroup>
          <div className='form-label'>Candidate to edit (ID)</div>
          <div className='form-input'>
            <FormControl
              input="text"
              value={candidateID}
              onChange={updateCandidateID}
            />
          </div>
        </FormGroup>


        <FormGroup>
          <div className='form-label'>Edit candidate's name</div>
          <div className='form-input'>
            <FormControl
              input="text"
              value={candidateName}
              onChange={updateCandidateName}
            />
          </div>
        </FormGroup>

        <FormGroup>
          <div className='form-label'>Edit candidate's constituency number</div>
          <div className='form-input'>
            <FormControl
              input="text"
              value={candidateConstituency}
              onChange={updateCandidateConstituency}
            />
          </div>
        </FormGroup>


        <FormGroup>
          <div className='form-label'>Edit candidate's party</div>
          <div className='form-input'>
            <FormControl
              input="text"
              value={candidateParty}
              onChange={updateCandidateParty}
            />
          </div>
        </FormGroup>


        <FormGroup>
          <div className='form-label'>Enter candidate's political platform description</div>
          <div className='form-input'>
            <FormControl as="textarea" rows={3}
              input="text"
              value={candidateDescription}
              onChange={updateCandidateDescription}
            />
          </div>
        </FormGroup>


        <Button className='button-vote' onClick={editCandidate}>
          Edit Candidate
        </Button>
        {Object.keys(errors).map((key) => {
          return <div className='validation' key={key}>{"Validation error: " + errors[key]}</div>
        })}




      </div>
    </div>
  )




}



export default EditCandidates