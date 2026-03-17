import { useEffect,useState } from "react"
import { useWeb3 } from "../web3/useWeb3"
import { getEVoteContractWithSigner } from "../contracts/evote"
import { Skeleton } from "../components/Skeleton"

export default function History(){

  const [history,setHistory] = useState([])
  const { signer } = useWeb3()
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState("")

  async function load(){

    try{

      setError("")
      setLoading(true)
      const contract = getEVoteContractWithSigner(signer)

      const count = await contract.proposalCount()

      let list=[]

      for(let i=1;i<=Number(count);i++){

        const p = await contract.getProposal(i)

        list.push({
          id:i,
          title:p[1],
          description:p[2],
          yes:p[5].toString(),
          no:p[6].toString()
        })

      }

      setHistory(list)

    }catch(err){
      console.log(err)
      setError(err?.shortMessage || err?.message || "Failed to load history")
      setHistory([])
    }finally{
      setLoading(false)
    }

  }

  useEffect(()=>{
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if(!signer) return
    load()
  },[signer])

  return(

    <div className="w-full">

      <h1 className="text-3xl mb-2 font-bold">
        Voting History
      </h1>

      <p className="text-slate-400 mb-6">
        Past proposals and their vote counts.
      </p>

      {loading && history.length === 0 && (
        <div className="space-y-4">
          <div className="card"><div className="card-inner space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div></div>
          <div className="card"><div className="card-inner space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
          </div></div>
        </div>
      )}

      {error && (
        <div className="card mb-6">
          <div className="card-inner">
            <p className="text-rose-300 font-semibold">Could not load history</p>
            <p className="text-slate-300 mt-1 text-sm break-words">{error}</p>
            <button className="btn-primary mt-4" onClick={load}>
              Retry
            </button>
          </div>
        </div>
      )}

      {history.map(h=>(

        <div
          key={h.id}
          className="card mb-4"
        >
          <div className="card-inner">

          <p className="font-bold text-lg">
            Proposal #{h.id}
          </p>

          <p className="text-slate-100 font-semibold mt-1">
            {h.title}
          </p>

          <p className="text-gray-400 mt-1">
            {h.description}
          </p>

          <div className="mt-4 flex gap-6 flex-wrap text-sm">

            <p className="text-emerald-300 font-semibold">
              YES: {h.yes}
            </p>
            <p className="text-rose-300 font-semibold">
              NO: {h.no}
            </p>

          </div>

          </div>
        </div>

      ))}

    </div>
  )
}