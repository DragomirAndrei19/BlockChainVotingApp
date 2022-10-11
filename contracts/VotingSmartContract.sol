// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

contract VotingSmartContract {
    address public ownerAddress; // Deployer of smart contract address
    bytes32 public adminPublicKey; // Admin public key for data encryption
    uint256 numVoters; // Number of voters in the election
    uint256 public numCandidatesRegistered; // Number of candidates in the election
    uint256 public numDeletedCandidates; // Numbers of candidates deleted before the election starts

    bool registrationStarted; // True if registration started, false if not
    bool registrationEnded; // True if registration ended, false if not
    bool sessionStarted; // True if election started, false if not
    bool sessionEnded; // True if election ended, false if not

    uint256 public votingPhaseCounter;
    uint256 public registrationPhaseCounter;

    ///// Homomorphic encryption for vote count

    // Public key for homomorphic encryption
    uint256 public n; // property of the public key
    uint256 public nSquared;
    uint256 public initialZeroCount; // the initial '0' votes for each candidate
    uint256 public encIncrement; // the encrypted '1' value everyone adds
    uint256 public g; // property of the public key

    // Private key for homomorphic decryption - to be published when election ends
    uint256 public mu;
    uint256 public lambda;

    // Constructor to set the default values
    constructor() {
        ownerAddress = msg.sender;
        adminPublicKey = 0; // adminPublicKey = 0x0000....
        numVoters = 0;
        numCandidatesRegistered = 0;
        numDeletedCandidates = 0;
        registrationStarted = false;
        registrationEnded = false;
        sessionStarted = false;
        sessionEnded = false;
        votingPhaseCounter = 0;
        registrationPhaseCounter = 0;
    }

    // Function to return address of smart contract owner = getOwner
    function getOwnerAddress() public view returns (address) {
        return ownerAddress;
    }

    // Section that only the election administrator can access = onlyAdmin
    // Modifier that allows only owner of the contract/admin of election to perform action
    modifier adminPermissionsOnly() {
        require(
            msg.sender == ownerAddress,
            "Only admins can perform this action. If you are an admin, please login into a whitelisted account"
        );
        _;
    }

    // Structure for the properties of an election candidate
    struct Candidate {
        string name;
        string party;
        string description; //
        uint256 encNumVotes; //
        uint256 constituency;
        uint256 uniqueID; //
    }

    // Structure for publicly available properties of a candidate
    struct CandidatePublicData {
        string name;
        string party;
        string description;
        uint256 constituency;
        uint256 uniqueID;
    }

    // Mapping each candidate to an uint id
    mapping(uint256 => Candidate) private candidatesHashMap; //

    // Function to add candidates. Only admins are able to add new candidates 

    function registerCandidate(
        string memory _name,
        string memory _party,
        string memory _description,
        uint256 _constituency
    ) public adminPermissionsOnly {
        require(
            sessionStarted == false && sessionEnded == false,
            "New candidates cannot be added once the election already started or ended"
        );

        Candidate memory newCandidate = Candidate({
            name: _name,
            party: _party,
            description: _description,
            encNumVotes: 0,
            constituency: _constituency,
            uniqueID: numCandidatesRegistered
        });

        candidatesHashMap[numCandidatesRegistered] = newCandidate;
        numCandidatesRegistered++;
    }

    function editCandidate(
        uint256 uniqueID,
        string memory _name,
        string memory _party,
        string memory _description,
        uint256 _constituency
    ) external adminPermissionsOnly {
        require(
            sessionStarted == false && sessionEnded == false,
            "Admins cannot edit candidates once the election has started or already ended"
        );
        candidatesHashMap[uniqueID].name = _name;
        candidatesHashMap[uniqueID].party = _party;
        candidatesHashMap[uniqueID].description = _description;
        candidatesHashMap[uniqueID].constituency = _constituency;
    }

    function deleteCandidate(uint256 uniqueID) external adminPermissionsOnly {
        require(
            sessionStarted == false && sessionEnded == false,
            "You cannot edit candidates once the election has started or already ended"
        );
        delete candidatesHashMap[uniqueID];
        numDeletedCandidates++;
    }

    // Function to return the total number of candidates initially registered into the app (without the deleted ones)

    function getCandidatesCounter() public view returns (uint256) {
        return numCandidatesRegistered;
    }

    // Function to return the total number of candidates participating in current election = getCandidateNumber

    function getNumCandidates() public view returns (uint256) {
        return numCandidatesRegistered - numDeletedCandidates;
    }

    // Structure describing the properties of a generic voter in the current election
    struct Voter {
        address voterAddress;
        bytes name;
        bytes cnp;
        uint256 constituency;
        bool hasVoted;
        bool isVerified;
        uint verifiedTime;
        uint votedTime;
    }

    // Structure describing the publicly & privately available info about a voter
    struct VoterPublicData {
        address voterAddress;
        uint256 constituency;
        bool hasVoted;
        bool isVerified;
        uint verifiedTime;
        uint votedTime;
    }

    // Array of addresses to store the public addresses of the voters
    address[] public votersAddresses; 

    // Mapping of each voter to a certain public address
    mapping(address => Voter) private votersHashMap; //

    // Function by which a voter requires participation rights in the election. Admin has to approve requests = requestVoter

    function applyToVote(
        bytes memory _name,
        bytes memory _cnp,
        uint256 _constituency
    ) public {
        require(
            registrationStarted == true && registrationEnded == false,
            "You can only aply to vote in an open registration phase"
        );

        Voter memory newVoter = Voter({
            voterAddress: msg.sender,
            name: _name,
            cnp: _cnp,
            constituency: _constituency,
            hasVoted: false,
            isVerified: false,
            verifiedTime: 0,
            votedTime: 0
        });

        votersHashMap[msg.sender] = newVoter;
        votersAddresses.push(msg.sender);
        numVoters++;
    }

    // Function returning the total number of voters participating in the election = getVoterCount
    function getNumVoters() public view returns (uint256) {
        return numVoters;
    }

    // Function that allows other to get the admin public key
    function getAdminPublicKey() public view returns (bytes32) {
        return adminPublicKey;
    }

    // Function that allows an election admin to approve a request of participation in the current election session = verifyVoter
    function approveParticipationRequest(address _address)
        public
        adminPermissionsOnly
    {
        votersHashMap[_address].isVerified = true;
        votersHashMap[_address].verifiedTime = block.timestamp;
    }

    // Function that allows voting for a candidate, Only verified voters are allowed = vote
    function castVote(uint256 uniqueID) public {
        require(
            votersHashMap[msg.sender].hasVoted == false,
            "A participant can cast a sigle vote only!"
        );
        require(
            votersHashMap[msg.sender].isVerified == true,
            "Cannot cast vote before being approved by an admin!"
        );
        require(
            sessionStarted == true,
            "The voting session has not started yet!"
        );
        require(sessionEnded == false, "The voting session has already ended!");

        require(
            votersHashMap[msg.sender].constituency ==
                candidatesHashMap[uniqueID].constituency
        );

        // Homomorphic add

        uint256 encNumVotesInner = candidatesHashMap[uniqueID].encNumVotes;
        uint256 nSquaredInner = nSquared;
        uint256 encNumVotesTemp;
        uint256 encIncrementInner = encIncrement;
        assembly {
            
            let _encNumVotes := encNumVotesInner
            let _encIncrement := encIncrementInner
            let _nSquared := nSquaredInner
            encNumVotesTemp := mulmod(
                _encNumVotes,
                _encIncrement,
                _nSquared
            )
        }
        candidatesHashMap[uniqueID].encNumVotes = encNumVotesTemp;

        votersHashMap[msg.sender].hasVoted = true;
        votersHashMap[msg.sender].votedTime = block.timestamp;
    }

    // Function that allows admin to publish public key/start registration phase
    function startRegistrationPhase(bytes32 publishedKey)
        public
        adminPermissionsOnly
    {
        if (registrationPhaseCounter == 0) {
            adminPublicKey = publishedKey;
            registrationStarted = true;
            registrationEnded = false;

            registrationPhaseCounter++;
        } else {
            uint256 noVoters = getNumVoters();
            for (uint256 i = 0; i < noVoters; i++) {
                delete votersHashMap[votersAddresses[i]];
                votersAddresses.pop();
            }

            for (uint256 id = 0; id < numCandidatesRegistered; id++) {
                candidatesHashMap[id].encNumVotes = 0;
            }

            numVoters = 0;

            adminPublicKey = publishedKey;
            registrationStarted = true;
            registrationEnded = false;

            registrationPhaseCounter++;
        }
    }

    function endRegistrationPhase() public adminPermissionsOnly {
        adminPublicKey = 0;
        registrationEnded = true;
        registrationStarted = false;
    }

    // Function to start a current election session. Can only be called by election admin
    function startElection(uint256 _g, uint256 _n, uint256 _nSquared, uint256 _initialZeroCount, uint256 _encIncrement) public adminPermissionsOnly {

        n = _n;
        nSquared = _nSquared;
        g = _g;
        initialZeroCount = _initialZeroCount;
        encIncrement = _encIncrement;

        if (votingPhaseCounter == 0) {
            sessionStarted = true;
            sessionEnded = false;

            registrationStarted = false;
            registrationEnded = true;

             for (uint256 id = 0; id < numCandidatesRegistered; id++) {
                candidatesHashMap[id].encNumVotes = initialZeroCount;
            }

            votingPhaseCounter++;


        } else {


             for (uint256 id = 0; id < numCandidatesRegistered; id++) {
                candidatesHashMap[id].encNumVotes = initialZeroCount;
            }
           

            sessionStarted = true;
            sessionEnded = false;

            registrationStarted = false;
            registrationEnded = true;

            votingPhaseCounter++;
        }
    }

    // Function to end the current election session. Can only be called by election admin
    function endElection() public adminPermissionsOnly {
        sessionEnded = true;
        sessionStarted = false;
    }

    // Getters for the registration phase

    function hasRegistrationStarted() public view returns (bool) {
        return registrationStarted;
    }

    function hasRegistrationEnded() public view returns (bool) {
        return registrationEnded;
    }

    // Getters for the current election state = getStart/getEnd
    function getStartStatus() public view returns (bool) {
        return sessionStarted;
    }

    function getEndStatus() public view returns (bool) {
        return sessionEnded;
    }

    // Retrieve functions for votersHashMap & candidatesHashMap
    function retrieveVoterPublicData(address _address)
        external
        view
        returns (VoterPublicData memory retrievedVoter)
    {
        VoterPublicData memory voterPublicData = VoterPublicData({
            voterAddress: votersHashMap[_address].voterAddress,
            constituency: votersHashMap[_address].constituency,
            hasVoted: votersHashMap[_address].hasVoted,
            isVerified: votersHashMap[_address].isVerified,
            verifiedTime: votersHashMap[_address].verifiedTime,
            votedTime: votersHashMap[_address].votedTime
        });
        return (voterPublicData);
    }

    function retrieveCandidatePublicData(uint256 uniqueID)
        external
        view
        returns (CandidatePublicData memory retrievedCandidate)
    {
        CandidatePublicData memory candidatePublicData = CandidatePublicData({
            name: candidatesHashMap[uniqueID].name,
            party: candidatesHashMap[uniqueID].party,
            description: candidatesHashMap[uniqueID].description,
            constituency: candidatesHashMap[uniqueID].constituency,
            uniqueID: candidatesHashMap[uniqueID].uniqueID
        });
        return (candidatePublicData);
    }

    function retrieveAllCandidateData(uint256 uniqueID)
        external
        view
        adminPermissionsOnly
        returns (Candidate memory retrievedCandidate)
    {
        require(
            sessionEnded == true,
            "Results cannot be revealed until the election session ends!"
        );
        return (candidatesHashMap[uniqueID]);
    }

    function retrieveAllVoterData(address _address)
        external
        view
        adminPermissionsOnly
        returns (Voter memory retrievedVoter)
    {
        return votersHashMap[_address];
    }


    //////////
    mapping(uint256 => Candidate) private resultsHashMap; 

    function publishResults(uint256[] memory decryptedVotes, uint256 _mu, uint256 _lambda) external adminPermissionsOnly {

        require(
            sessionEnded == true,
            "Results cannot be published until the election session ends!"
        );

       for(uint256 i=0; i<numCandidatesRegistered; i++)
       {
         Candidate memory newCandidate = Candidate({
            name: candidatesHashMap[i].name,
            party: candidatesHashMap[i].party,
            description: "",
            encNumVotes: decryptedVotes[i],
            constituency: candidatesHashMap[i].constituency,
            uniqueID: candidatesHashMap[i].uniqueID
        });

        resultsHashMap[i] = newCandidate;
        mu = _mu;
        lambda = _lambda;
       }

    }

    function retrievePublicResults(uint256 uniqueID)
        external
        view
        returns (Candidate memory retrievedCandidate)
    {
        require(
            sessionEnded == true,
            "Results cannot be revealed until the election session ends!"
        );
        return (resultsHashMap[uniqueID]);
    }

}
