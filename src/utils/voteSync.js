import { ref, set } from "firebase/database"
import { db } from "../firebase"
import { normalizeWalletKey } from "./wallet"

/** Ghi phiếu lên Firebase (NO) + lưu hoạt động theo ví. */
export async function recordVoteFull(proposalId, walletAddress, support, title = "") {
  const key = normalizeWalletKey(walletAddress)
  if (!key) return

  const payload = {
    support: Boolean(support),
    votedAt: Date.now()
  }

  await set(ref(db, `votes/${proposalId}/${key}`), payload)

  await set(ref(db, `userActivity/${key}/votes/${proposalId}`), {
    proposalId,
    support: Boolean(support),
    title: title || "",
    votedAt: Date.now()
  })
}
