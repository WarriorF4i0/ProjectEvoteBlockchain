/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/immutability */
import { useEffect,useState } from "react"
import { useWeb3 } from "../web3/useWeb3"
import { getEVoteContractWithSigner } from "../contracts/evote"
import { useToast } from "../components/Toaster"
import { sendTx } from "../web3/tx"
import { Clock, Coins, UserRound } from "lucide-react"
import { Skeleton } from "../components/Skeleton"

export default function Vote(){

  const [proposals,setProposals] = useState([])
  const [admin,setAdmin] = useState("")
  const { signer, account } = useWeb3()
  const toast = useToast()
  const [txBusy,setTxBusy] = useState(null)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState("")
  const [votedMap,setVotedMap] = useState({})

  useEffect(()=>{
    if(!signer) return
    load()
  },[signer])

  async function load(){

    setError("")
    setLoading(true)
    try{
      const contract = getEVoteContractWithSigner(signer)

      const adminAddr = await contract.admin()
      setAdmin(adminAddr.toLowerCase())

      const count = Number(await contract.proposalCount())

      const list = []
      for(let i=1;i<=count;i++){
        const p = await contract.getProposal(i)
        list.push({
          id:Number(p[0]),
          title:p[1],
          description:p[2],
          amount:Number(p[3]),
          recipient:p[4],
          yes:Number(p[5]),
          no:Number(p[6]),
          deadline:Number(p[7]),
          finalized:p[8]
        })
      }

      setProposals(list)

      if(account){
        const entries = await Promise.all(list.map(async (p)=>{
          try{
            const voted = await contract.hasVoted(p.id,account)
            return [p.id,Boolean(voted)]
          }catch{
            return [p.id,false]
          }
        }))
        setVotedMap(Object.fromEntries(entries))
      }else{
        setVotedMap({})
      }
    }catch(err){
      console.error(err)
      setError(err?.shortMessage || err?.message || "Failed to load proposals")
      setProposals([])
    }finally{
      setLoading(false)
    }

  }

  async function vote(id,value){

    const contract = getEVoteContractWithSigner(signer)

    setTxBusy(`vote_${id}`)
    const res = await sendTx(
      ()=>contract.vote(id,value),
      { toast, title: value ? "Vote YES" : "Vote NO" }
    )
    setTxBusy(null)
    if(res.status === "success"){
      load()
    }

  }

  async function finalize(id){

    const contract = getEVoteContractWithSigner(signer)

    setTxBusy(`finalize_${id}`)
    const res = await sendTx(
      ()=>contract.finalizeProposal(id),
      { toast, title:"Finalize proposal" }
    )
    setTxBusy(null)
    if(res.status === "success"){
      load()
    }

  }

  return(

    <div className="w-full">

      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-3xl font-bold">Vote Proposals</h1>
          <p className="text-slate-400 mt-1">
            Cast your vote and track results in real time.
          </p>
        </div>

        <div className="text-sm text-slate-300">
          <div className="flex flex-col items-end">
            <span className="text-slate-500">Connected</span>
            <span className="font-mono">
              {account ? `${account.slice(0,6)}...${account.slice(-4)}` : "-"}
            </span>
          </div>
        </div>
      </div>

      {proposals.length === 0 && (
        <div className="card">
          <div className="card-inner">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : error ? (
              <>
                <p className="text-rose-300 font-semibold">Could not load proposals</p>
                <p className="text-slate-300 mt-1 text-sm break-words">{error}</p>
                <button className="btn-primary mt-4" onClick={load}>
                  Retry
                </button>
              </>
            ) : (
              <p className="text-slate-300">No proposals yet.</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {loading && proposals.length === 0 && (
          <>
            <div className="card"><div className="card-inner space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-10 w-48 mt-4" />
            </div></div>
            <div className="card"><div className="card-inner space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-40 mt-4" />
            </div></div>
          </>
        )}
        {proposals.map(p=>{

          const total = p.yes + p.no

          const yesPercent = total ? ((p.yes/total)*100) : 0
          const noPercent = total ? ((p.no/total)*100) : 0

          const isAdmin = (account?.toLowerCase?.() ?? "") === admin

          const now = Date.now()/1000
          const ended = now > p.deadline

          const deadlineText = new Date(
            p.deadline*1000
          ).toLocaleString()

          const statusBadge = p.finalized
            ? "FINALIZED"
            : ended
              ? "ENDED"
              : "ACTIVE"

          const alreadyVoted = Boolean(votedMap?.[p.id])

          return(

            <div key={p.id} className="card">
              <div className="card-inner">

                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-slate-400 text-sm">
                      Proposal #{p.id}
                    </p>
                    <h3 className="text-xl font-bold mt-1 break-words">
                      {p.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {statusBadge === "ACTIVE" && (
                      <span className="badge-warning">ACTIVE</span>
                    )}
                    {statusBadge === "ENDED" && (
                      <span className="badge-muted">ENDED</span>
                    )}
                    {statusBadge === "FINALIZED" && (
                      <span className="badge-success">FINALIZED</span>
                    )}
                    {isAdmin && (
                      <span className="badge-muted">ADMIN</span>
                    )}
                    {alreadyVoted && (
                      <span className="badge-success">VOTED</span>
                    )}
                  </div>
                </div>

                <p className="text-slate-300 mt-3">
                  {p.description}
                </p>

                <div className="divider mt-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 text-sm">
                  <div className="space-y-1">
                    <p className="text-slate-500">Recipient</p>
                    <div className="flex items-start gap-2">
                      <UserRound className="mt-0.5 h-4 w-4 text-slate-500 shrink-0" />
                      <p className="font-mono break-all text-slate-200">
                        {p.recipient}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-slate-500">Amount</p>
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-slate-500 shrink-0" />
                      <p className="text-slate-200 font-semibold">
                        {p.amount}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <p className="text-slate-500">Deadline</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-500 shrink-0" />
                      <p className="text-slate-200">
                        {deadlineText}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-emerald-300 font-semibold">
                      YES: {p.yes} ({yesPercent.toFixed(1)}%)
                    </p>
                    <p className="text-rose-300 font-semibold">
                      NO: {p.no} ({noPercent.toFixed(1)}%)
                    </p>
                  </div>

                  <div className="mt-3 h-2.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${Math.min(100,Math.max(0,yesPercent))}%` }}
                    />
                  </div>
                </div>

                {!p.finalized && !ended && (
                  <div className="flex gap-3 mt-6 flex-wrap">
                    <button
                      onClick={()=>vote(p.id,true)}
                      className="btn-success"
                      disabled={txBusy != null || alreadyVoted}
                    >
                      Vote YES
                    </button>

                    <button
                      onClick={()=>vote(p.id,false)}
                      className="btn-danger"
                      disabled={txBusy != null || alreadyVoted}
                    >
                      Vote NO
                    </button>
                  </div>
                )}

                {isAdmin && !p.finalized && (
                  <div className="mt-6">
                    <button
                      onClick={()=>finalize(p.id)}
                      className="btn-purple"
                      disabled={txBusy != null}
                    >
                      Finalize
                    </button>
                  </div>
                )}

                {p.finalized && (
                  <p className="text-emerald-300 mt-4 font-semibold">
                    Proposal finalized.
                  </p>
                )}

              </div>
            </div>

          )

        })}
      </div>

    </div>

  )

}