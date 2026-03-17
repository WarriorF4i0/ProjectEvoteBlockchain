/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useWeb3 } from "../web3/useWeb3"
import { getMultisigContractWithSigner } from "../contracts/multisig"
import { useToast } from "../components/Toaster"
import { sendTx } from "../web3/tx"
import { Skeleton } from "../components/Skeleton"

export default function Multisig(){

  const [txs,setTxs] = useState([])
  const [loading,setLoading] = useState(true)
  const { signer } = useWeb3()
  const toast = useToast()
  const [txBusy,setTxBusy] = useState(null)
  const [error,setError] = useState("")

  useEffect(()=>{
    if(!signer) return
    loadTx()
  },[signer])

  async function loadTx(){

    try{

      setError("")
      setLoading(true)
      const contract = getMultisigContractWithSigner(signer)

      const count = Number(await contract.transactionsLength())

      const list = []

      for(let i=0;i<count;i++){

        const tx = await contract.transactions(i)

        const amount = ethers.formatEther(tx.totalAmount)
        const perUser = ethers.formatEther(tx.amountPerUser)

        list.push({
          id:i,
          to:tx.to,
          amount:amount,
          amountPerUser:perUser,
          required:tx.requiredConfirmations.toString(),
          confirmations:tx.confirmCount.toString(),
          executed:tx.executed
        })

      }

      setTxs(list)

    }catch(err){
      console.error(err)
      setError(err?.shortMessage || err?.message || "Failed to load transactions")
      setTxs([])
    }

    setLoading(false)

  }

  async function confirm(id,value){

    try{

      if(!value || value === "0"){
        alert("Invalid amount per voter")
        return
      }

      const contract = getMultisigContractWithSigner(signer)

      setTxBusy(`confirm_${id}`)
      const res = await sendTx(()=>contract.confirmAndPay(
          id,
          {
            value: ethers.parseEther(value)
          }
        ),
        { toast, title:"Confirm & Pay" }
      )
      setTxBusy(null)
      if(res.status === "success"){
        loadTx()
      }

    }catch(err){

      console.error(err)
      alert(err.reason || "Confirm failed")

    }

  }

  async function execute(id){

    try{

      const contract = getMultisigContractWithSigner(signer)

      setTxBusy(`execute_${id}`)
      const res = await sendTx(
        ()=>contract.executeTransaction(id),
        { toast, title:"Execute transaction" }
      )
      setTxBusy(null)
      if(res.status === "success"){
        loadTx()
      }

    }catch(err){

      console.error(err)
      alert(err.reason || "Execute failed")

    }

  }

  if(loading){
    return (
      <div className="w-full space-y-4">
        <div className="card"><div className="card-inner space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div></div>
        <div className="card"><div className="card-inner space-y-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div></div>
      </div>
    )
  }

  return(

    <div className="w-full">

      <h1 className="text-3xl font-bold mb-2">
        Multisig Transactions
      </h1>

      <p className="text-slate-400 mb-6">
        Confirm and execute payouts once enough confirmations are collected.
      </p>

      {error && (
        <div className="card mb-6">
          <div className="card-inner">
            <p className="text-rose-300 font-semibold">Could not load transactions</p>
            <p className="text-slate-300 mt-1 text-sm break-words">{error}</p>
            <button className="btn-primary mt-4" onClick={loadTx}>
              Retry
            </button>
          </div>
        </div>
      )}

      {txs.length === 0 && (
        <div className="card">
          <div className="card-inner">
            <p className="text-slate-300">No transactions yet.</p>
          </div>
        </div>
      )}

      {txs.map(tx=>(

        <div key={tx.id} className="card mb-6">
          <div className="card-inner">

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-slate-400 text-sm">
                  Transaction #{tx.id}
                </p>
                <p className="mt-1">
                  <span className="text-slate-500">Status:</span>{" "}
                  {tx.executed
                    ? <span className="badge-success">EXECUTED</span>
                    : <span className="badge-warning">PENDING</span>
                  }
                </p>
              </div>

              <div className="text-sm text-slate-300">
                <p className="text-slate-500">Confirmations</p>
                <p className="font-semibold">
                  {tx.confirmations} / {tx.required}
                </p>
              </div>
            </div>

            <div className="mt-4 h-2.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-blue-500"
                style={{
                  width: `${tx.required === "0"
                    ? 0
                    : Math.min(100,Math.max(0,(Number(tx.confirmations) / Number(tx.required)) * 100))
                  }%`
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 text-sm">
              <div className="space-y-1 md:col-span-2">
                <p className="text-slate-500">Recipient</p>
                <p className="font-mono break-all text-slate-200">
                  {tx.to}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-500">Total Amount</p>
                <p className="font-semibold text-slate-200">
                  {tx.amount} ETH
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-500">Amount per voter</p>
                <p className="font-semibold text-slate-200">
                  {tx.amountPerUser} ETH
                </p>
              </div>
            </div>

          {!tx.executed && (

            <div className="mt-6 flex gap-3 flex-wrap">

              <button
                onClick={()=>confirm(tx.id,tx.amountPerUser)}
                className="btn-warning"
                disabled={txBusy != null}
              >
                Confirm & Pay
              </button>

              <button 
                onClick={()=>execute(tx.id)}
                className="btn-purple"
                disabled={txBusy != null}
              >
                Execute
              </button>

            </div>

          )}

          </div>
        </div>

      ))}

    </div>

  )

}
