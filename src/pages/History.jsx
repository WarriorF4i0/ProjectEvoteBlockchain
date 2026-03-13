import { useEffect,useState } from "react"
import { getContract } from "../abi/constract"

export default function History(){

  const [history,setHistory] = useState([])

  async function load(){

    try{

      const contract = await getContract()

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
    }

  }

  useEffect(()=>{
    load()
  },[])

  return(

    <div>

      <h1 className="text-3xl mb-6 font-bold">
        Voting History
      </h1>

      {history.map(h=>(

        <div
          key={h.id}
          className="bg-gray-800 p-4 mb-3 rounded"
        >

          <p className="font-bold text-lg">
            Proposal #{h.id}
          </p>

          <p className="text-yellow-400 font-semibold mt-1">
            {h.title}
          </p>

          <p className="text-gray-400 mt-1">
            {h.description}
          </p>

          <div className="mt-3">

            <p> YES: {h.yes}</p>
            <p> NO: {h.no}</p>

          </div>

        </div>

      ))}

    </div>
  )
}