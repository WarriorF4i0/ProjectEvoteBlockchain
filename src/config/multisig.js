import { ethers } from "ethers"
import abi from "../abi/MultiSigFund.json"

const address = "0x4a42BEA78d51fF0cec8b797A7dD458a86432EAB3"

export async function getMultisigContract(){

  if(!window.ethereum){
    alert("Please install MetaMask")
    throw new Error("MetaMask not found")
  }

  const provider = new ethers.BrowserProvider(window.ethereum)

  const signer = await provider.getSigner()

  const contract = new ethers.Contract(
    address,
    abi,
    signer
  )

  return contract
}