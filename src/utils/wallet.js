import { ethers } from "ethers"

/** Chuẩn hóa key Firebase / localStorage (Ethereum không phân biệt hoa thường). */
export function normalizeWalletKey(address) {
  if (!address || typeof address !== "string") return ""
  return address.toLowerCase()
}

/** Hiển thị dạng 0x0231ab...3jnao */
export function formatShortAddress(address, headChars = 6, tailChars = 5) {
  if (!address) return ""
  const a = address.startsWith("0x") ? address : `0x${address}`
  const lower = a.toLowerCase()
  if (lower.length < 2 + headChars + tailChars) return lower
  return `${lower.slice(0, 2 + headChars)}...${lower.slice(-tailChars)}`
}

/**
 * Địa chỉ "ẩn" kiểu EIP-55: 0x877ED9b6a381b...cAB1e7b9
 */
export function formatHiddenAddress(address) {
  if (!address) return ""
  try {
    const a = ethers.getAddress(address.trim())
    if (a.length <= 24) return a
    return `${a.slice(0, 14)}...${a.slice(-12)}`
  } catch {
    return formatShortAddress(address)
  }
}

