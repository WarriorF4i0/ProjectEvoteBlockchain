import { ethers } from "ethers"
import abi from "../abi/MultiSigFund.json"

const address = "Your_Multisig_Address_here"

export async function getMultisigContract(){

  if(!window.ethereum){
    alert("Please install MetaMask")
    throw new Error("MetaMask not found")
  }

  const provider = new ethers.BrowserProvider(window.ethereum)

  const signer = await provider.getSigner()

  console.log("contract code:", address)

  const contract = new ethers.Contract(
    address,
    abi,
    signer
  )

  return contract
}