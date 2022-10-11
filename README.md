# BlockChainVotingApp
Ethereum blockchain web application for open voting scenarios (built using Solidity/Truffle/React.JS)


===== Ethereum BlockChain web application for transparent/open voting scenarios (with some degree of optional privacy) =====

- Ethereum key pair based authentication
- Node.JS/Javascript & React.JS frontend
- Smart Contract based backed (using Solidity language)
- Uses Truffle JS & MetaMask for interaction

Required: Node.JS, Ganache (to emulate a local blockchain)

![image](https://user-images.githubusercontent.com/56070218/195163310-3c0ea7c2-0129-4977-bdae-89e740045eef.png)


Capabiltiies:

General Use-Case UML Diagram
![image](https://user-images.githubusercontent.com/56070218/195162765-60ed9c60-f524-4f78-9b65-834bfcab9285.png)

- Unique vote is enforced
- Encrypted voter authentication data using xsalsa20-poly1305
![image](https://user-images.githubusercontent.com/56070218/195162976-815b532f-79bb-4bba-9ac9-271a6e9449d3.png)
- Role-based authorization (two roles - voter and election administrator)
- Manual approval of the voters
- Distributed data storage (specific to BlockChain)
- Uses homomorphic encryption (Paillier) to hide the vote count 
- All the roles are constrained to follow the mutually estabilished rules of the smart contract
- Backend and frontend validation of the form received data

How to run:
1) Install node modules
2) Start Ganache (CLI or GUI)
3) truffle migrate --reset (to do migration & contract compilation)
4) npm run start (to run the frontend side of the web app)

Screenshots

a) Home Page 
![image](https://user-images.githubusercontent.com/56070218/195163427-ca9104c6-f944-41f8-80c8-4380c831df99.png)
b) Pending requests page 
![image](https://user-images.githubusercontent.com/56070218/195163087-147f3ec2-099e-4bde-8870-cd83338145da.png)
c) Page with the list of candidates
![image](https://user-images.githubusercontent.com/56070218/195163198-e83ff2f0-38f2-4f5d-8330-f444472b2997.png)
d) Register Candidates page
![image](https://user-images.githubusercontent.com/56070218/195163507-8b790183-c6e5-4305-aa9b-28cb3266f6b5.png)
e) Approval prompt 
![image](https://user-images.githubusercontent.com/56070218/195163600-987ea8e9-f66a-4837-af01-67622e3fc7e1.png)
f) Administrator panel
![image](https://user-images.githubusercontent.com/56070218/195163622-a1c781fe-a44e-4625-acb8-06354fb0621b.png)




