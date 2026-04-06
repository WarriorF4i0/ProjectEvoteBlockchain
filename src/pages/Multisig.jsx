/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback } from "react"
import { ethers } from "ethers"
import { getMultisigContract } from "../config/multisig"
import { formatHiddenAddress } from "../utils/wallet"

export default function Multisig(){

  const [txs,setTxs] = useState([])
  const [loading,setLoading] = useState(true)
  const [payById,setPayById] = useState({})

  const loadTx = useCallback(async ()=>{

    try{

      const contract = await getMultisigContract()

      const count = Number(await contract.transactionsLength())

      const list = []

      for(let i=0;i<count;i++){

        const tx = await contract.transactions(i)

        const amount = ethers.formatEther(tx.totalAmount)
        const collected = ethers.formatEther(tx.amountCollected)
        const min = ethers.formatEther(tx.minContribution)

        const req = Number(tx.requiredConfirmations)
        const conf = Number(tx.confirmCount)

        list.push({
          id:i,
          to:tx.to,
          amount,
          collected,
          minContribution:min,
          required:tx.requiredConfirmations.toString(),
          confirmations:tx.confirmCount.toString(),
          executed:tx.executed,
          canExecute: conf >= req && !tx.executed && Number(collected) >= Number(amount),
          waitingConf: conf < req && !tx.executed
        })

      }

      setTxs(list)

    }catch(err){
      console.error(err)
    }

    setLoading(false)

  },[])

  useEffect(()=>{
    loadTx()
    const t = setInterval(loadTx, 8000)
    window.addEventListener("walletChanged", loadTx)
    return ()=>{
      clearInterval(t)
      window.removeEventListener("walletChanged", loadTx)
    }
  }, [loadTx])

  function setPayAmount(id, value){
    setPayById((prev)=> ({ ...prev, [id]: value }))
  }

  async function confirm(id){

    const raw = payById[id]?.trim()
    const txRow = txs.find((t)=>t.id === id)
    const fallback = txRow?.minContribution || "0"
    const value = raw || fallback

    try{

      if(!value || value === "0"){
        alert("Nhập số ETH (hoặc để trống để dùng mức tối thiểu).")
        return
      }

      const contract = await getMultisigContract()

      const req = await contract.confirmAndPay(
        id,
        {
          value: ethers.parseEther(value)
        }
      )

      await req.wait()

      loadTx()

    }catch(err){

      console.error(err)
      alert(err.reason || err.shortMessage || "Confirm failed")

    }

  }

  async function execute(id){

    try{

      const contract = await getMultisigContract()

      const tx = await contract.executeTransaction(id)

      await tx.wait()

      loadTx()

    }catch(err){

      console.error(err)
      alert(err.reason || err.shortMessage || "Execute failed")

    }

  }

  if(loading){
    return <p className="text-slate-400">Đang tải…</p>
  }

  return(

    <div className="w-full max-w-none text-white">

      <h1 className="mb-8 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
        Multisig
      </h1>

      {txs.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
          Chưa có giao dịch.
        </p>
      )}

      <div className="space-y-6">
        {txs.map(tx=>(

          <article
            key={tx.id}
            className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/40"
          >

            <div className="border-b border-slate-800/80 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">TX #{tx.id}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  tx.executed
                    ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    : tx.canExecute
                      ? "border border-violet-500/40 bg-violet-500/10 text-violet-200"
                      : "border border-amber-500/40 bg-amber-500/10 text-amber-200"
                }`}>
                  {tx.executed ? "Đã chi" : tx.canExecute ? "Sẵn sàng execute" : "Chờ xác nhận"}
                </span>
              </div>
            </div>

            <div className="grid gap-3 px-6 py-4 text-sm sm:grid-cols-2">
              <p>
                <span className="text-slate-500">Người nhận:</span>{" "}
                <span className="font-mono text-slate-200" title={tx.to}>
                  {formatHiddenAddress(tx.to)}
                </span>
              </p>

              <p><span className="text-slate-500">Tổng:</span> {tx.amount} ETH</p>

              <p>
                <span className="text-slate-500">Đã góp:</span>{" "}
                {tx.collected} / {tx.amount} ETH
              </p>

              <p>
                <span className="text-slate-500">Tối thiểu mỗi voter:</span>{" "}
                {tx.minContribution} ETH
              </p>

              <p>
                <span className="text-slate-500">Xác nhận:</span>{" "}
                {tx.confirmations} / {tx.required}
              </p>
            </div>

            {!tx.executed && (

              <div className="flex flex-wrap items-end gap-3 border-t border-slate-800/60 px-6 py-4">

                <div className="min-w-[140px] flex-1">
                  <label htmlFor={`pay-${tx.id}`} className="mb-1 block text-xs text-slate-500">
                    Gửi kèm (ETH)
                  </label>
                  <input
                    id={`pay-${tx.id}`}
                    type="text"
                    inputMode="decimal"
                    placeholder={tx.minContribution}
                    value={payById[tx.id] ?? ""}
                    onChange={(e)=>setPayAmount(tx.id, e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={()=>confirm(tx.id)}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400"
                >
                  Confirm & Pay
                </button>

                <button
                  type="button"
                  onClick={()=>execute(tx.id)}
                  disabled={!tx.canExecute}
                  title={!tx.canExecute ? "Chưa đủ điều kiện" : ""}
                  className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Execute
                </button>

              </div>

            )}

          </article>

        ))}
      </div>

    </div>

  )

}