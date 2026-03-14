/* eslint-disable react-hooks/immutability */
import { useEffect,useState } from "react"
import { Link,useLocation } from "react-router-dom"
import { ADMIN_ADDRESS } from "../config/admin"

export default function Sidebar(){

const location = useLocation()

// eslint-disable-next-line no-unused-vars
const [account,setAccount] = useState("")
const [isAdmin,setIsAdmin] = useState(false)

useEffect(()=>{

checkWallet()

if(window.ethereum){
window.ethereum.on("accountsChanged",()=>{
checkWallet()
})
}

},[])

async function checkWallet(){

if(!window.ethereum) return

const accounts = await window.ethereum.request({
method:"eth_accounts"
})

if(accounts.length>0){

setAccount(accounts[0])

if(accounts[0].toLowerCase() === ADMIN_ADDRESS.toLowerCase()){
setIsAdmin(true)
}else{
setIsAdmin(false)
}

}

}

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

<div className="w-60 bg-slate-900 min-h-screen p-4">

<h1 className="text-xl font-bold mb-6">
E-Vote DAO
</h1>

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