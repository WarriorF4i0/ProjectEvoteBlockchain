import { ethers } from "ethers"
import abi from "../abi/MultiSigFund.json"
import { MULTISIG_ADDRESS } from "./addresses"

export function getMultisigContractWithSigner(signer){
  if(!signer){
    throw new Error("Wallet not connected")
  }
  return new ethers.Contract(MULTISIG_ADDRESS,abi,signer)
}

