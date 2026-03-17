import { createContext, useCallback, useEffect, useMemo, useState } from "react"
import { ethers } from "ethers"
import {
  HARDHAT_CHAIN_PARAMS,
  HARDHAT_CHAIN_ID_DEC,
  isHardhatChain
} from "./chains"

export const Web3Context = createContext(null)

function getEthereum(){
  if(typeof window === "undefined") return null
  return window.ethereum ?? null
}

export default function Web3Provider({ children }){

  const [hasProvider] = useState(()=>Boolean(getEthereum()))
  const [provider,setProvider] = useState(null)
  const [signer,setSigner] = useState(null)
  const [account,setAccount] = useState(null)
  const [chainId,setChainId] = useState(null)
  const [balanceEth,setBalanceEth] = useState(null)
  const [connecting,setConnecting] = useState(false)

  const isCorrectNetwork = useMemo(
    ()=> chainId != null && isHardhatChain(chainId),
    [chainId]
  )

  const refreshBalance = useCallback(async ()=>{
    if(!provider || !account) return
    const bal = await provider.getBalance(account)
    setBalanceEth(ethers.formatEther(bal))
  },[provider,account])

  const hydrateFromEthereum = useCallback(async ()=>{
    const eth = getEthereum()
    if(!eth) return

    const p = new ethers.BrowserProvider(eth)
    setProvider(p)

    const network = await p.getNetwork()
    setChainId(Number(network.chainId))

    const accounts = await p.send("eth_accounts",[])
    if(accounts?.length){
      setAccount(accounts[0])
      try{ localStorage.setItem("wallet",accounts[0]) }catch{}
      const s = await p.getSigner()
      setSigner(s)
    }else{
      setAccount(null)
      setSigner(null)
      setBalanceEth(null)
      try{ localStorage.removeItem("wallet") }catch{}
      return
    }

    const bal = await p.getBalance(accounts[0])
    setBalanceEth(ethers.formatEther(bal))
  },[])

  const connect = useCallback(async ()=>{
    const eth = getEthereum()
    if(!eth) throw new Error("MetaMask not found")

    setConnecting(true)
    try{
      const p = new ethers.BrowserProvider(eth)
      setProvider(p)

      const accounts = await p.send("eth_requestAccounts",[])
      const network = await p.getNetwork()

      setChainId(Number(network.chainId))
      setAccount(accounts[0] ?? null)
      if(accounts?.[0]){
        try{ localStorage.setItem("wallet",accounts[0]) }catch{}
      }

      if(accounts?.length){
        const s = await p.getSigner()
        setSigner(s)
        const bal = await p.getBalance(accounts[0])
        setBalanceEth(ethers.formatEther(bal))
      }
      return accounts?.[0] ?? null
    }finally{
      setConnecting(false)
    }
  },[])

  const disconnect = useCallback(()=>{
    setSigner(null)
    setAccount(null)
    setBalanceEth(null)
    try{ localStorage.removeItem("wallet") }catch{}
  },[])

  const switchToHardhat = useCallback(async ()=>{
    const eth = getEthereum()
    if(!eth) throw new Error("MetaMask not found")

    try{
      await eth.request({
        method:"wallet_switchEthereumChain",
        params:[{ chainId: HARDHAT_CHAIN_PARAMS.chainId }]
      })
    }catch(err){
      if(err?.code === 4902){
        await eth.request({
          method:"wallet_addEthereumChain",
          params:[HARDHAT_CHAIN_PARAMS]
        })
      }else{
        throw err
      }
    }

    await hydrateFromEthereum()
  },[hydrateFromEthereum])

  useEffect(()=>{
    hydrateFromEthereum()
  },[hydrateFromEthereum])

  useEffect(()=>{
    const eth = getEthereum()
    if(!eth) return

    const onAccountsChanged = async (accounts)=>{
      if(!accounts?.length){
        disconnect()
        return
      }
      setAccount(accounts[0])
      if(provider){
        const s = await provider.getSigner()
        setSigner(s)
        const bal = await provider.getBalance(accounts[0])
        setBalanceEth(ethers.formatEther(bal))
      }
    }

    const onChainChanged = async ()=>{
      await hydrateFromEthereum()
    }

    eth.on?.("accountsChanged",onAccountsChanged)
    eth.on?.("chainChanged",onChainChanged)

    return ()=>{
      eth.removeListener?.("accountsChanged",onAccountsChanged)
      eth.removeListener?.("chainChanged",onChainChanged)
    }
  },[provider,disconnect,hydrateFromEthereum])

  const value = useMemo(()=>({
    hasProvider,
    provider,
    signer,
    account,
    chainId,
    isCorrectNetwork,
    hardhatChainId: HARDHAT_CHAIN_ID_DEC,
    balanceEth,
    connecting,
    connect,
    disconnect,
    switchToHardhat,
    refreshBalance
  }),[
    hasProvider,
    provider,
    signer,
    account,
    chainId,
    isCorrectNetwork,
    balanceEth,
    connecting,
    connect,
    disconnect,
    switchToHardhat,
    refreshBalance
  ])

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  )
}

