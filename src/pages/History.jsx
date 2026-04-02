import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { getEVoteContract } from "../config/evote"
import { ADMIN_ADDRESS } from "../config/admin"
import { normalizeWalletKey, formatHiddenAddress } from "../utils/wallet"
import { ref, get } from "firebase/database"
import { db } from "../firebase"
import { getProposalFlexible, resolveProposalCreator } from "../utils/proposalRead"

export default function History(){

  const [items,setItems] = useState([])
  const [wallet,setWallet] = useState(()=>normalizeWalletKey(localStorage.getItem("wallet") || ""))
  const [loading,setLoading] = useState(true)

  useEffect(()=>{

    function sync(){
      setWallet(normalizeWalletKey(localStorage.getItem("wallet") || ""))
    }

    window.addEventListener("walletChanged", sync)
    return ()=>window.removeEventListener("walletChanged", sync)

  },[])

  useEffect(()=>{
    async function load(){

      setLoading(true)

      try{

        const w = normalizeWalletKey(localStorage.getItem("wallet") || "")
        if(!w){
          setItems([])
          setLoading(false)
          return
        }

        const contract = await getEVoteContract()
        const addr = ethers.getAddress(w)
        const count = Number(await contract.proposalCount())
        const adminChain = (await contract.admin()).toLowerCase()
        const isAdminWallet =
          w === adminChain ||
          w === normalizeWalletKey(ADMIN_ADDRESS)

        const createdSnap = await get(ref(db, `userActivity/${w}/created`))
        const createdIds = new Set()
        if(createdSnap.exists()){
          Object.keys(createdSnap.val()).forEach((k)=>{
            createdIds.add(Number(k))
          })
        }

        const now = Math.floor(Date.now()/1000)
        const rows = []

        for(let i=1;i<=count;i++){

          const g = await getProposalFlexible(contract, i)
          if(!g.ok || !g.parts){
            continue
          }

          const p = g.parts
          const voted = await contract.voted(i, addr)
          const isCreator = createdIds.has(i)
          const creatorResolved = await resolveProposalCreator(i, p[9])

          if(isAdminWallet){

            const finalized = p[8]
            const deadline = Number(p[7])
            let phase = "Đang vote"
            if(finalized){
              phase = "Đã finalize"
            }else if(now >= deadline){
              phase = "Chờ duyệt"
            }

            rows.push({
              id:i,
              title:p[1],
              description:p[2],
              amountWei:p[3],
              recipient:p[4],
              yes:Number(p[5]),
              no:Number(p[6]),
              deadline,
              finalized,
              voted,
              isCreator,
              creatorLabel: creatorResolved ? formatHiddenAddress(creatorResolved) : "—",
              role: phase
            })

            continue
          }

          if(!voted && !isCreator) continue

          const yes = Number(p[5])
          const no = Number(p[6])
          const deadline = Number(p[7])
          const finalized = p[8]

          rows.push({
            id:i,
            title:p[1],
            description:p[2],
            amountWei:p[3],
            recipient:p[4],
            yes,
            no,
            deadline,
            finalized,
            voted,
            isCreator,
            creatorLabel: null,
            role: isCreator && voted ? "Tạo & vote" : isCreator ? "Đã tạo" : "Đã vote"
          })

        }

        setItems(rows.reverse())

      }catch(err){
        console.error(err)
        setItems([])
      }

      setLoading(false)

    }

    load()

  }, [wallet])

  if(loading){
    return (
      <p className="text-slate-400">Đang tải…</p>
    )
  }

  if(!wallet){
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
        Kết nối ví.
      </div>
    )
  }

  return(

    <div className="w-full min-w-0 text-white">

      <div className="mb-8">
        <h1 className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
          Lịch sử
        </h1>
        <p className="mt-2 font-mono text-xs text-slate-500" title={wallet}>
          {formatHiddenAddress(wallet)}
        </p>
      </div>

      {items.length === 0 && (
        <p className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-500">
          Chưa có dữ liệu.
        </p>
      )}

      <ul className="space-y-4">
        {items.map((h)=>(

          <li
            key={h.id}
            className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/40"
          >

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 px-5 py-3">
              <span className="text-xs font-medium text-slate-500">#{h.id}</span>
              <span className="rounded-full border border-slate-600 bg-slate-950/50 px-2.5 py-0.5 text-xs text-slate-300">
                {h.role}
              </span>
            </div>

            <div className="px-5 py-4">
              <h2 className="font-semibold text-slate-100">{h.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{h.description}</p>
              {h.creatorLabel && (
                <p className="mt-2 text-xs text-slate-500">
                  Người tạo:{" "}
                  <span className="font-mono text-slate-400">{h.creatorLabel}</span>
                </p>
              )}
              <div className="mt-3 grid gap-1 text-sm text-slate-300 sm:grid-cols-2">
                <p>Người nhận:{" "}
                  <span className="font-mono text-xs" title={h.recipient}>
                    {formatHiddenAddress(h.recipient)}
                  </span>
                </p>
                <p>Số tiền: {ethers.formatEther(h.amountWei)} ETH</p>
                <p>YES / NO: {h.yes} / {h.no}</p>
                <p>Trạng thái: {h.finalized ? "Đã finalize" : "Chưa finalize"}</p>
              </div>
            </div>

          </li>

        ))}
      </ul>

    </div>

  )

}
