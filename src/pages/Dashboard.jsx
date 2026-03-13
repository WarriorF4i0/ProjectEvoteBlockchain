import { useEffect,useState } from "react"
import { getContract } from "../abi/constract"

export default function Dashboard(){

  const [proposals,setProposals]=useState([])

  async function loadProposals(){

    const contract = await getContract()

    const count = await contract.proposalCount()

    let list=[]

    for(let i=1;i<=Number(count);i++){

      const p = await contract.getProposal(i)

      const deadline = Number(p[7])
      const now = Math.floor(Date.now()/1000)

      let result="ACTIVE"

      if(now >= deadline){

        const approved = await contract.getResult(i)

        result = approved ? "APPROVED" : "REJECTED"
      }

      list.push({
        id:i,
        title:p[1],
        description:p[2],
        yes:p[5].toString(),
        no:p[6].toString(),
        deadline:deadline,
        result:result
      })

    }

    setProposals(list)
  }

  useEffect(()=>{
    loadProposals()
  },[])

  async function voteYes(id){

    const contract = await getContract()

    const tx = await contract.vote(id,true)

    await tx.wait()

    loadProposals()
  }

  async function voteNo(id){

    const contract = await getContract()

    const tx = await contract.vote(id,false)

    await tx.wait()

    loadProposals()
  }

  return(

    <div>

      <h1 className="text-3xl mb-8 font-bold">
        RESULT DASHBOARD
      </h1>

      {proposals.map(p=>(

        <div
        key={p.id}
        className="bg-gray-800 p-4 mb-4 rounded"
        >

          <p className="font-bold text-lg">
            {p.title}
          </p>

          <p className="text-gray-400">
            {p.description}
          </p>

          <p className="mt-2">YES: {p.yes}</p>
          <p>NO: {p.no}</p>

          <p className="mt-2">
            Status: 
            {p.result === "ACTIVE" && (
              <span className="text-yellow-400 ml-2">Voting...</span>
            )}

            {p.result === "APPROVED" && (
              <span className="text-green-400 ml-2">APPROVED</span>
            )}

            {p.result === "REJECTED" && (
              <span className="text-red-400 ml-2">REJECTED</span>
            )}
          </p>

          {p.result === "ACTIVE" && (

            <div className="flex gap-4 mt-3">

              <button
              onClick={()=>voteYes(p.id)}
              className="bg-green-500 px-3 py-1 rounded"
              >
              Vote YES
              </button>

              <button
              onClick={()=>voteNo(p.id)}
              className="bg-red-500 px-3 py-1 rounded"
              >
              Vote NO
              </button>

            </div>

          )}

        </div>

      ))}

    </div>
  )
}