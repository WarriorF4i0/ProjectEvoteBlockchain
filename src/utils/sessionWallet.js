/** MetaMask vẫn còn kết nối sau "logout"; dùng cờ để coi như đã thoát phiên app. */
export const WALLET_LOGOUT_FLAG = "evote_wallet_explicit_logout"

export function markWalletExplicitLogout() {
  localStorage.setItem(WALLET_LOGOUT_FLAG, "1")
}

export function clearWalletExplicitLogout() {
  localStorage.removeItem(WALLET_LOGOUT_FLAG)
}

export function isWalletExplicitLogout() {
  return localStorage.getItem(WALLET_LOGOUT_FLAG) === "1"
}
