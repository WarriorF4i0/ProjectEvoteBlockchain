import { ethers } from "ethers"
import abi from "../abi/MultiSigFund.json"

const address = "0xEdfAe8403C274cF1ee3d13DBa544AEd34Ad86F68"

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