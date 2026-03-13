import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { getContract } from "../abi/constract"
import WalletButton from "../components/WalletButton"

export default function Vote() {

  const [proposalId, setProposalId] = useState("")
  const [support, setSupport] = useState(true)
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(false)
  const [account, setAccount] = useState("")

  async function loadProposals() {

    try {

      const contract = await getContract()
      const count = await contract.proposalCount()

      let list = []

      for (let i = 1; i <= Number(count); i++) {

        const p = await contract.getProposal(i)

        list.push({
          id: i,
          title: p[1],
          description: p[2],
          amount: ethers.formatEther(p[3]),
          recipient: p[4],
          yesVotes: p[5].toString(),
          noVotes: p[6].toString(),
          deadline: Number(p[7]),
          finalized: p[8]
        })
      }

      setProposals(list)

    } catch (err) {

      console.error("Error loading proposals:", err)

    }

  }

  async function vote() {

    if (!proposalId) {
      alert("Please enter proposal ID")
      return
    }

    setLoading(true)

    try {

      const contract = await getContract()

      const signer = await contract.runner.getAddress()

      const hasVoted = await contract.hasVoted(proposalId, signer)

      if (hasVoted) {

        alert("You already voted")

        setLoading(false)

        return
      }

      const tx = await contract.vote(proposalId, support)

      await tx.wait()

      alert(`Voted ${support ? "YES" : "NO"} on proposal #${proposalId}`)

      await loadProposals()

      setProposalId("")

    } catch (err) {

      console.error(err)

      alert("Vote failed: " + (err.reason || err.message))

    }

    setLoading(false)

  }

  // vote trực tiếp từ danh sách proposal
  async function voteDirect(id, support) {

    try {

      const contract = await getContract()

      const tx = await contract.vote(id, support)

      await tx.wait()

      alert(`Voted ${support ? "YES" : "NO"} on proposal #${id}`)

      loadProposals()

    } catch (err) {

      alert(err.reason || err.message)

    }

  }

  useEffect(() => {

    loadProposals()

    if (window.ethereum) {

      window.ethereum.request({ method: "eth_accounts" })

        .then(accounts => {

          if (accounts.length > 0) setAccount(accounts[0])

        })

    }

  }, [])

  const now = Math.floor(Date.now() / 1000)

  const activeProposals = proposals.filter(p => !p.finalized && p.deadline > now)

  return (

    <div className="max-w-6xl mx-auto p-6">

      <div className="flex justify-between items-center mb-8">

        <h1 className="text-3xl font-bold">Vote on Proposals</h1>

        <WalletButton account={account} setAccount={setAccount} />

      </div>


      {/* vote bằng ID */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">

        <h2 className="text-xl font-bold mb-4">Cast Your Vote</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">

          <input
            type="number"
            placeholder="Proposal ID"
            className="bg-gray-700 p-3 rounded"
            value={proposalId}
            onChange={(e) => setProposalId(e.target.value)}
          />

          <div className="flex gap-4 items-center">

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={support === true}
                onChange={() => setSupport(true)}
              />
              YES
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={support === false}
                onChange={() => setSupport(false)}
              />
              NO
            </label>

          </div>

        </div>

        <button
          onClick={vote}
          disabled={loading || !account}
          className="bg-blue-600 p-3 rounded w-full"
        >

          {loading ? "Voting..." : "Submit Vote"}

        </button>

      </div>


      {/* Active Proposals */}

      <h2 className="text-2xl font-bold mb-4">

        Active Proposals

      </h2>


      <div className="space-y-4">

        {activeProposals.map(p => (

          <div
            key={p.id}
            className="bg-gray-800 p-5 rounded-lg border border-gray-700"
          >

            <h3 className="text-xl font-bold">

              #{p.id} {p.title}

            </h3>

            <p className="text-gray-400 mt-2">

              {p.description}

            </p>

            <div className="mt-3 text-sm">

              <p> YES: {p.yesVotes}</p>

              <p> NO: {p.noVotes}</p>

              <p>

                Deadline:

                {new Date(p.deadline * 1000).toLocaleString()}

              </p>

            </div>

            <div className="flex gap-3 mt-4">

              <button
                onClick={() => voteDirect(p.id, true)}
                className="bg-green-500 px-3 py-1 rounded"
              >

                Vote YES

              </button>

              <button
                onClick={() => voteDirect(p.id, false)}
                className="bg-red-500 px-3 py-1 rounded"
              >

                Vote NO

              </button>

            </div>

          </div>

        ))}

        {activeProposals.length === 0 && (

          <p className="text-gray-500 text-center py-8">

            No active proposals

          </p>

        )}

      </div>

    </div>

  )

}