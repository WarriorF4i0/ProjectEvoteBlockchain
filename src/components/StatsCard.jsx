export default function StatsCard({ title, value }) {

  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">

      <p className="text-gray-400">
        {title}
      </p>

      <h2 className="text-2xl font-bold mt-2">
        {value}
      </h2>

    </div>
  )

}