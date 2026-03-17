import { ethers } from "ethers"
import abi from "../abi/EVoteDAO.json"
import { EVOTE_ADDRESS } from "./addresses"

export function getEVoteContractWithSigner(signer){
  if(!signer){
    throw new Error("Wallet not connected")
  }
  return new ethers.Contract(EVOTE_ADDRESS,abi,signer)
}

