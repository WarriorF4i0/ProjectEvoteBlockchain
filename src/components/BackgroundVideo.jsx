import { useEffect, useMemo, useState } from "react"

export default function BackgroundVideo({
  src = "/bg.mp4",
  poster = "/bg-poster.jpg",
  opacity = 0.22
}){

  const [available,setAvailable] = useState(false)

  useEffect(()=>{
    let alive = true

    async function check(){
      try{
        const res = await fetch(src,{ method:"HEAD" })
        if(!alive) return
        setAvailable(res.ok)
      }catch{
        if(!alive) return
        setAvailable(false)
      }
    }

    check()

    return ()=>{ alive = false }
  },[src])

  const style = useMemo(()=>({
    opacity
  }),[opacity])

  if(!available){
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(900px_450px_at_15%_0%,rgba(56,189,248,0.18),transparent_60%),radial-gradient(900px_450px_at_85%_15%,rgba(167,139,250,0.16),transparent_55%)]" />
        <div className="absolute inset-0 bg-slate-950/40" />
      </div>
    )
  }

  return(
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <video
        className="h-full w-full object-cover"
        style={style}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-slate-950/70" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_500px_at_15%_0%,rgba(37,99,235,0.22),transparent_60%),radial-gradient(900px_450px_at_90%_10%,rgba(168,85,247,0.18),transparent_55%)]" />
    </div>
  )
}

