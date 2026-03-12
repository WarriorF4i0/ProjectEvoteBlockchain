export default function Multisig(){

  const txs=[
    {id:1,to:"0x123...",amount:"1 ETH",approve:"1/3"},
    {id:2,to:"0x881...",amount:"0.5 ETH",approve:"2/3"}
  ]

  return(

    <div>

      <h1 className="text-3xl mb-6 font-bold">
        MultiSig Wallet
      </h1>

      <div className="flex flex-col gap-6">

        {txs.map(tx=>(
          <div
          key={tx.id}
          className="bg-gray-800 p-4 rounded"
          >

            <p>To: {tx.to}</p>
            <p>Amount: {tx.amount}</p>
            <p>Approvals: {tx.approve}</p>

            <div className="flex gap-4 mt-3">

              <button className="bg-yellow-500 px-3 py-1 rounded">
                Approve
              </button>

              <button className="bg-green-500 px-3 py-1 rounded">
                Execute
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>

  )

}