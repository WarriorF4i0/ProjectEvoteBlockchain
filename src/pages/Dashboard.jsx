import StatsCard from "../components/StatsCard"

export default function Dashboard(){

  return(

    <div>

      <h1 className="text-3xl mb-8 font-bold">
        Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-6">

        <StatsCard title="Total Transactions" value="12"/>
        <StatsCard title="Pending" value="3"/>
        <StatsCard title="Executed" value="9"/>

      </div>

      <div className="mt-10">

        <h2 className="text-xl mb-4">
          Recent Transactions
        </h2>

        <div className="bg-gray-800 rounded p-4">

          <div className="flex justify-between border-b border-gray-700 pb-2">
            <span>Tx Hash</span>
            <span>Status</span>
          </div>

          <div className="flex justify-between mt-3">
            <span>0x83a21...</span>
            <span className="text-green-400">Success</span>
          </div>

          <div className="flex justify-between mt-3">
            <span>0x91bc3...</span>
            <span className="text-yellow-400">Pending</span>
          </div>

        </div>

      </div>

    </div>

  )

}