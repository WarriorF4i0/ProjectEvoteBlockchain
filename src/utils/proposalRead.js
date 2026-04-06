import { ethers } from "ethers"
import { get, ref } from "firebase/database"
import { db } from "../firebase"
import { normalizeWalletKey } from "./wallet"

const ZERO = "0x0000000000000000000000000000000000000000"

const LEGACY_GET_PROPOSAL = [
  "function getProposal(uint256 id) view returns (uint256,string,string,uint256,address,uint256,uint256,uint256,bool)"
]

function normAddr(a) {
  if (a == null || a === undefined) return ""
  const s = typeof a === "string" ? a : String(a)
  const l = s.toLowerCase()
  if (!l || l === ZERO) return ""
  return normalizeWalletKey(l)
}

/**
 * Đọc getProposal: hỗ trợ contract 9 hoặc 10 field (có creator).
 * Nếu ABI 10 field nhưng contract cũ 9 field → fallback decode legacy.
 */
export async function getProposalFlexible(contract, id) {
  try {
    const r = await contract.getProposal(id)
    const parts = [...r]
    if (parts.length >= 10){
      return { ok:true, parts, legacy:false }
    }
    if (parts.length === 9){
      return { ok:true, parts: [...parts, ethers.ZeroAddress], legacy:true }
    }
    return { ok:true, parts, legacy:true }
  } catch (firstErr) {
    try {
      const iface = new ethers.Interface(LEGACY_GET_PROPOSAL)
      const data = iface.encodeFunctionData("getProposal", [BigInt(id)])
      const target = contract.target
      const provider = contract.runner?.provider
      if(!provider) throw firstErr
      const raw = await provider.call({ to: target, data })
      const decoded = iface.decodeFunctionResult("getProposal", raw)
      const p = [...decoded]
      return { ok:true, parts:[...p, ethers.ZeroAddress], legacy:true }
    } catch {
      console.error("getProposal failed for id", id, firstErr)
      return { ok:false, parts:null, legacy:true }
    }
  }
}

/** Creator on-chain hoặc từ proposalsMeta (Firebase) khi contract cũ / creator = 0. */
export async function resolveProposalCreator(proposalId, onChainCreator) {
  const fromChain = normAddr(onChainCreator)
  if(fromChain) return fromChain
  try{
    const snap = await get(ref(db, `proposalsMeta/${proposalId}`))
    if(!snap.exists()) return ""
    return normalizeWalletKey(snap.val().createdBy || "")
  }catch{
    return ""
  }
}
