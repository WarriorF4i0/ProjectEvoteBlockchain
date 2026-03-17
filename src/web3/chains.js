export const HARDHAT_CHAIN_ID_DEC = 1337
export const HARDHAT_CHAIN_ID_HEX = "0x539"

export const HARDHAT_CHAIN_PARAMS = {
  chainId: HARDHAT_CHAIN_ID_HEX,
  chainName: "Ganache Local",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: ["http://127.0.0.1:7545"],
  blockExplorerUrls: []
}

export function isHardhatChain(chainId){
  return Number(chainId) === HARDHAT_CHAIN_ID_DEC
}

