import { ethers } from "ethers";
import abi from "../abi/EVoteDAO.json";

const EVOTE_ADDRESS = "Your_Evoting_Address_here";


console.log("EVOTE_ADDRESS", EVOTE_ADDRESS);
export { EVOTE_ADDRESS };

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
