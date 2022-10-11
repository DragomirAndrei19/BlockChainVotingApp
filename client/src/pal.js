const paillierBigint = require('paillier-bigint')

async function paillierTest () {
    // (asynchronous) creation of a random private, public key pair for the Paillier cryptosystem
    //const { publicKey, privateKey } = await paillierBigint.generateRandomKeys(128)
  
    // Optionally, you can create your public/private keys from known parameters
     const publicKey = new paillierBigint.PublicKey(305288616858957887050477944554188074457n, 12587503825624890619837994846255715022866919074742581515335951797406835362996n)
     const privateKey = new paillierBigint.PrivateKey(3634388295939974845404470667607799220n, 196396355056724007288032363524247528441n, publicKey)

   
    const rezultat = privateKey.decrypt(59863898128583159369217881420278034019093292690843394070110082389192904830026n)
    console.log(rezultat)
  
    // // encryption/decryption
    // const c1 = publicKey.encrypt(m1)
    // console.log(privateKey.decrypt(c1)) // 12345678901234567890n
  
    // // homomorphic addition of two ciphertexts (encrypted numbers)
    // const c2 = publicKey.encrypt(m2)
    // const encryptedSum = publicKey.addition(c1, c2)
    // console.log(privateKey.decrypt(encryptedSum)) // m1 + m2 = 12345678901234567895n
  
    // // multiplication by k
    // const k = 10n
    // const encryptedMul = publicKey.multiply(c1, k)
    // console.log(privateKey.decrypt(encryptedMul)) // k · m1 = 123456789012345678900n
  }
  paillierTest() 