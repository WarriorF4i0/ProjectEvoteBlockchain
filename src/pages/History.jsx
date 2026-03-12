export default function History(){

  const txs=[
    {hash:"0xabc",type:"Create",status:"Success"},
    {hash:"0xdef",type:"Approve",status:"Pending"}
  ]

  return(

    <div>

      <h1 className="text-3xl mb-6 font-bold">
        Transaction History
      </h1>

      <table className="w-full bg-gray-800 rounded">

        <thead className="border-b border-gray-700">

          <tr>
            <th className="p-3">Tx Hash</th>
            <th className="p-3">Type</th>
            <th className="p-3">Status</th>
          </tr>

        </thead>

        <tbody>

          {txs.map((tx,i)=>(
            <tr key={i} className="text-center">

              <td className="p-3">{tx.hash}</td>
              <td className="p-3">{tx.type}</td>
              <td className="p-3">{tx.status}</td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>

  )

}