import { useState } from "react"

export default function WalletButton() {

  const [wallet, setWallet] = useState(null)

  async function connectWallet() {

    if (window.ethereum) {

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      })

      setWallet(accounts[0])

    } else {

      alert("Please install MetaMask")

    }
  }

  return (
    <button
      onClick={connectWallet}
      className="bg-blue-600 px-4 py-2 rounded-lg"
    >
      {wallet
        ? wallet.slice(0,6) + "..." + wallet.slice(-4)
        : "Connect Wallet"}
    </button>
  )
}