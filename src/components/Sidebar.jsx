/* eslint-disable react-hooks/immutability */
import { Link,useLocation } from "react-router-dom"
import { ADMIN_ADDRESS } from "../config/admin"
import { useWeb3 } from "../web3/useWeb3"

export default function Sidebar(){

const location = useLocation()

const { account } = useWeb3()
const isAdmin = (account?.toLowerCase?.() ?? "") === ADMIN_ADDRESS.toLowerCase()

const menu = [

{ name:"Dashboard", path:"/" },
{ name:"Vote", path:"/vote" },
{ name:"Multisig", path:"/multisig" },

]

// admin only
if(isAdmin){
menu.push({ name:"Create", path:"/create" })
}

menu.push({ name:"Profile", path:"/profile" })

return(

<div className="w-60 bg-slate-950/40 border-r border-slate-800/70 min-h-screen p-4 backdrop-blur">

<h1 className="text-xl font-bold mb-6">
E-Vote DAO
</h1>

<div className="mb-6">
  <p className="text-xs text-slate-500">Wallet</p>
  <p className="font-mono text-sm text-slate-200 break-all">
    {account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Not connected"}
  </p>
</div>

<ul className="flex flex-col gap-2">

{menu.map((item)=>{

const active = location.pathname === item.path

return(

<Link key={item.path} to={item.path}>

<li className={`p-3 rounded-lg transition border-l-4

${active
? "bg-blue-600 border-blue-300"
: "border-transparent hover:bg-slate-800"
}`}

>

{item.name}

</li>

</Link>

)

})}

</ul>

</div>

)

}