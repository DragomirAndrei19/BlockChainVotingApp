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
import { Button, Card, Row } from 'react-bootstrap';
import Banner from '../Banner';
import cryptoUtilities from '../../cryptoUtilities';






export class ApproveVoters extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentAccount: null,
      ContractInstance: undefined,
      isContractOwner: false,
      web3: null,
      listOfVoters: null,



    }
  }

  decryptVoterData = async (voter) => {

    var foundIndex = this.state.listOfVoters.findIndex(x => x.name === voter.name); // indexul la care se afla obiectul ce trebuie inlocuit

    var decryptedName = await cryptoUtilities.decryptData(this.state.currentAccount, voter.name)
    var decryptedCNP = await cryptoUtilities.decryptData(this.state.currentAccount, voter.cnp)
    decryptedName = decryptedName.toString();
    decryptedCNP = decryptedCNP.toString();
    

    let modifiedObject = Object.assign({}, this.state.listOfVoters[foundIndex], {name: decryptedName, cnp: decryptedCNP});
   
    let listOfVoters = this.state.listOfVoters;
    listOfVoters[foundIndex] = modifiedObject;
    this.setState({listOfVoters: listOfVoters});





  
















  }

  approveParticipationRequest = async event => {
    let voterAddress = event.target.value;
    await this.state.ContractInstance.methods.approveParticipationRequest(voterAddress)
      .send({
        from: this.state.currentAccount,
        gas: 1000000
      })
    // Reload
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

      let numVoters, voterAddress, voterCompleteData, i, listOfVoters = [];

      numVoters = await contractInstance.methods.getNumVoters().call();


      for (i = 0; i < numVoters; i++) {
        voterAddress = await contractInstance.methods.votersAddresses(i).call();
        voterCompleteData = await contractInstance.methods.retrieveAllVoterData(voterAddress).call();
        if (!voterCompleteData.hasVoted) {
          listOfVoters.push(voterCompleteData);
        }
      }
      this.setState({ listOfVoters: listOfVoters })





    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        "An error occured while trying to load accounts, web3 or the contract. Please check the console for more details!"
      );
      console.error(error);
    }
  }

  render() {

    let listOfVoters;

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
            Only an election administrator can approve voters
          </div>

        </div>

      )
    }


    if (this.state.listOfVoters) {
      listOfVoters = this.state.listOfVoters.map((voter) => {
        return (


          <div className='candidate' key={voter.voterAddress}>
            <Card className='mt-5' border="primary">
              <Card.Header as="h5">{voter.name}</Card.Header>
              <Card.Body>
                <Card.Title>Voter's Address: {voter.voterAddress}</Card.Title>
                <Card.Text>
                  <b>Voter's CNP/SSN:</b> {voter.cnp}
                </Card.Text>
                <Card.Text>
                  <b> Voter's constituency: </b> {voter.constituency}
                </Card.Text>
                <div className="d-grid gap-2">
                  <Button onClick={() => { this.decryptVoterData(voter) }} variant="primary" size="lg">
                    Decrypt Personal Data
                  </Button>

                </div>
                {voter.isVerified ? <Button className='button-verified'>Voter verified</Button>
                  : <Button className='button-verify' onClick={this.approveParticipationRequest} value={voter.voterAddress}>Verify Voter</Button>}
              </Card.Body>
            </Card>
          </div>






        )
      })
    }


    return (
      <div>
        <>
          <Banner bannerText={"Verification requests pending"}>/</Banner>
        </>
        {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}


        <Row xs={1} md={1} className="g-4">
          <div>{listOfVoters}</div>
        </Row>

      </div>
    )


  }
}

export default ApproveVoters;