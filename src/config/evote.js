import { ethers } from "ethers";
import abi from "../abi/EVoteDAO.json";

export const EVOTE_ADDRESS = "0x2A057951593dDAD64d75a54F55DD0E90F3A99b06";

export async function getEVoteContract() {

  const provider = new ethers.BrowserProvider(window.ethereum);

  const signer = await provider.getSigner();

  const contract = new ethers.Contract(
    EVOTE_ADDRESS,
    abi,
    signer
  );

  return contract;
}
