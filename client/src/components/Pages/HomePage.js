
// Import styling
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap
import '../../App.css'; // custom styling

// Importing Smart Contract in JSON format
import VotingSmartContract from "../../contracts/VotingSmartContract.json"

// Importing utiltiies

import getWeb3 from "../../getWeb3"

// Importing components

import React, { Component } from 'react'
import NavbarAdmin from '../Navbar/NavbarAdmin';
import NavbarVoter from '../Navbar/NavbarVoter';
import Banner from '../Banner';
import { Link } from 'react-router-dom';


export class HomePage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentAccount: null,
      ContractInstance: undefined,
      isContractOwner: false,
      web3: null
    }
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

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        "An error occured while trying to load accounts, web3 or the contract. Please check the console for more details!"
      );
      console.error(error);
    }
  }

  render() {

    // Loading page
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


    // Normal rendering conditions
    return (
      <div className='App'>

        <Banner bannerText={"ISMBlockVoter"}></Banner>
        {this.state.isContractOwner ? <NavbarAdmin /> : <NavbarVoter />}

        <div className='body-content'>
          <h1>Welcome to BlockVoter - Secure BlockChain Voting App</h1>
          <div>
            <h2><i>- You can read the process flow below -</i></h2>
            <hr></hr>
          </div>
          <div className='body-text-content'>
            <ol>
              <li>In order to be able to vote, you have to register into the app during a limited registration phase. This registration phase is started
                by election administrators. If the period of time is missed, you cannot be verified and therefore cannot cast your vote in the current session.
                You can register <Link color='red' to={"/ApplyToVote"}>HERE</Link> during the announced period.
              </li>
              <li>
                You can see the progress of your verification request on the same page you have used to register. Your personal data, such as name or CNP/SSN are encrypted and can only be decrypted by an administrator.
              </li>
              <li>Once you have been approved by an administrator, you can consult the list of candidates and other related data
                <Link to={"CandidatesList"}> HERE</Link>. Every candidate has a <i>unique code</i> used for casting the vote.
                The page will display all candidates from all constituencies and their details.
              </li>
              <li>
                You can cast your vote <Link to={"/CastVote"}>HERE</Link> but only  during an active voting session.
                The Administrator is responsible for starting and ending a voting session. You can only cast a vote for a candidate in the same
                constituency as your previously registered one. A list of candidates from your constituency is available on the voting page.
                You can only cast your vote once using the unique ID number of your preffered candidate.
              </li>
              <li>
                After the election has ended, the administrator can visualize the results in each constituency and reveal them to the public.
              </li>
            </ol>
          </div>

        </div>


      </div>

    )
  }
}

export default HomePage