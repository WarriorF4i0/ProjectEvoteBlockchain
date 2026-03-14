/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/immutability */
import { useEffect,useState } from "react"
import { getEVoteContract } from "../config/evote"

export default function Vote(){

  const [proposals,setProposals] = useState([])
  const [admin,setAdmin] = useState("")
  const [account,setAccount] = useState("")

  useEffect(()=>{
    load()
  },[])

  async function load(){

    const contract = await getEVoteContract()

    const signer = await contract.runner.getAddress()
    setAccount(signer.toLowerCase())

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

  }

  async function vote(id,value){

    const contract = await getEVoteContract()

    const tx = await contract.vote(id,value)

    await tx.wait()

    load()

  }

  async function finalize(id){

    const contract = await getEVoteContract()

    const tx = await contract.finalizeProposal(id)

    await tx.wait()

    load()

  }

  return(

    <div style={{padding:"30px"}}>

      <h2>Vote Proposals</h2>

      {proposals.map(p=>{

        const total = p.yes + p.no

        const yesPercent = total ? ((p.yes/total)*100).toFixed(1) : 0
        const noPercent = total ? ((p.no/total)*100).toFixed(1) : 0

        const isAdmin = account === admin

        const now = Date.now()/1000
        const ended = now > p.deadline

        const deadlineText = new Date(
          p.deadline*1000
        ).toLocaleString()

        return(

          <div
            key={p.id}
            style={{
              background:"#0f172a",
              padding:"25px",
              marginBottom:"25px",
              borderRadius:"12px",
              border:"1px solid #1e293b",
              maxWidth:"600px"
            }}
          >

            <h3>{p.title}</h3>

            <p>{p.description}</p>

            <p><b>Recipient:</b> {p.recipient}</p>

            <p><b>Amount:</b> {p.amount}</p>

            <p><b>Deadline:</b> {deadlineText}</p>

            <p><b>YES:</b> {p.yes}</p>
            <p><b>NO:</b> {p.no}</p>

            {!p.finalized && !ended && (

              <div>

                <button
                  onClick={()=>vote(p.id,true)}
                  style={{
                    marginRight:"10px",
                    padding:"10px",
                    background:"#22c55e",
                    border:"none",
                    borderRadius:"6px"
                  }}
                >
                  Vote YES
                </button>

                <button
                  onClick={()=>vote(p.id,false)}
                  style={{
                    padding:"10px",
                    background:"#ef4444",
                    border:"none",
                    borderRadius:"6px"
                  }}
                >
                  Vote NO
                </button>

              </div>

            )}

            {isAdmin && !p.finalized && (

              <button
                onClick={()=>finalize(p.id)}
                style={{
                  marginTop:"15px",
                  padding:"10px 18px",
                  background:"#6366f1",
                  border:"none",
                  borderRadius:"6px"
                }}
              >
                FINALIZE
              </button>

            )}

            {p.finalized && (

              <p style={{
                color:"#22c55e",
                marginTop:"10px"
              }}>
                Proposal Finalized
              </p>

            )}

          </div>

        )

      })}

    </div>

  )

}