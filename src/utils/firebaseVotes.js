import { ref, get } from "firebase/database"
import { db } from "../firebase"

/** Danh sách địa chỉ vote NO từ Firebase (đồng bộ khi user vote). */
export async function loadNoVoterAddresses(proposalId) {
  const snap = await get(ref(db, `votes/${proposalId}`))
  if (!snap.exists()) return []
  const out = []
  snap.forEach((child) => {
    const v = child.val()
    if (v && v.support === false) out.push(child.key)
  })
  return out
}
