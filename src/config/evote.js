import { ethers } from "ethers";
import abi from "../abi/EVoteDAO.json";

export const EVOTE_ADDRESS = "0x1fBB97aC42aD12f9dE695919092f1C10b2A0fc30";

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
