import { useMemo } from "react"
import { useWeb3 } from "../web3/useWeb3"

export default function RequireWallet({ children }){
  const {
    hasProvider,
    account,
    connecting,
    connect,
    chainId,
    isCorrectNetwork,
    switchToHardhat
  } = useWeb3()

  const chainLabel = useMemo(()=>{
    if(chainId == null) return "-"
    return String(chainId)
  },[chainId])

  if(!hasProvider){
    return (
      <div className="w-full max-w-xl">
        <div className="card">
          <div className="card-inner">
            <h1 className="text-2xl font-bold">MetaMask required</h1>
            <p className="text-slate-400 mt-2">
              Please install MetaMask to use this dApp.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if(!account){
    return (
      <div className="w-full max-w-xl">
        <div className="card">
          <div className="card-inner">
            <h1 className="text-2xl font-bold">Connect your wallet</h1>
            <p className="text-slate-400 mt-2">
              You need a wallet connection to access this page.
            </p>
            <button
              className="btn-success mt-6"
              onClick={connect}
              disabled={connecting}
            >
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if(!isCorrectNetwork){
    return (
      <div className="w-full max-w-xl">
        <div className="card">
          <div className="card-inner">
            <h1 className="text-2xl font-bold">Wrong network</h1>
            <p className="text-slate-400 mt-2">
              Current chain id: <span className="font-mono text-slate-200">{chainLabel}</span>. Switch to Ganache Local (1337).
            </p>
            <button
              className="btn-primary mt-6"
              onClick={switchToHardhat}
            >
              Switch to Ganache
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
}

