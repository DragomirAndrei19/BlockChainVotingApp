import { encrypt } from '@metamask/eth-sig-util';
import Web3 from 'web3';
const ascii85 = require('ascii85');
const paillierBigint = require('paillier-bigint')



const getAccountPublicKey = async (receivedAccount) => {
  // Account is the address provided as string

  let account = receivedAccount;

  // Key is returned as base64
  const keyB64 = await window.ethereum.request({
    method: 'eth_getEncryptionPublicKey',
    params: [account],
  })
  const publicKey = Buffer.from(keyB64, 'base64');

  return publicKey;

}

const encryptData = (publicKey, data) => {
  // Returned object contains 4 properties: version, ephemPublicKey, nonce, ciphertext
  // Each contains data encoded using base64, version is always the same string

  publicKey = Buffer.from(Web3.utils.hexToBytes(publicKey), "utf-8")
  data = Buffer.from(data, "utf-8")

  const enc = encrypt({
    publicKey: publicKey.toString('base64'),
    data: ascii85.encode(data).toString(),
    version: 'x25519-xsalsa20-poly1305',
  });

  // We want to store the data in smart contract, therefore we concatenate them
  // into single Buffer
  const buf = Buffer.concat([
    Buffer.from(enc.ephemPublicKey, 'base64'),
    Buffer.from(enc.nonce, 'base64'),
    Buffer.from(enc.ciphertext, 'base64'),
  ]);

  // In smart contract we are using `bytes[112]` variable (fixed size byte array)
  // you might need to use `bytes` type for dynamic sized array
  // We are also using ethers.js which requires type `number[]` when passing data
  // for argument of type `bytes` to the smart contract function
  // Next line just converts the buffer to `number[]` required by contract function
  // THIS LINE IS USED IN OUR ORIGINAL CODE:
  // return buf.toJSON().data;

  // Return just the Buffer to make the function directly compatible with decryptData function
  return buf;
}

const decryptData = async (accountAddress, data) => {


  let account = accountAddress;
  data = Buffer.from(Web3.utils.hexToBytes(data), "utf-8")


  // account -> string, data -> Buffer, returns Promise<Buffer>
  // Reconstructing the original object outputed by encryption
  const structuredData = {
    version: 'x25519-xsalsa20-poly1305',
    ephemPublicKey: data.slice(0, 32).toString('base64'),
    nonce: data.slice(32, 56).toString('base64'),
    ciphertext: data.slice(56).toString('base64'),
  };
  // Convert data to hex string required by MetaMask
  const ct = `0x${Buffer.from(JSON.stringify(structuredData), 'utf8').toString('hex')}`;
  // Send request to MetaMask to decrypt the ciphertext
  // Once again application must have acces to the account
  const decrypt = await window.ethereum.request({
    method: 'eth_decrypt',
    params: [ct, account],
  });
  // Decode the base85 to final bytes
  return ascii85.decode(decrypt);
}


const generatePaillierKeys = async () => {
  const { publicKey, privateKey } = await paillierBigint.generateRandomKeys(128)
  const g = publicKey.g;
  const n = publicKey.n;
  const nSquared = publicKey._n2;
  const lambda = privateKey.lambda;
  const mu = privateKey.mu;

  const initialZeroCount = publicKey.encrypt(0);
  const increment = publicKey.encrypt(1);

  return {g, n, nSquared, lambda, mu, initialZeroCount, increment};
  
}


const cryptoUtilities = {
  getAccountPublicKey,
  encryptData,
  decryptData,
  generatePaillierKeys
}

export default cryptoUtilities;