import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import { CheckCircle2, XCircle, Loader2, Info } from "lucide-react"

const ToastContext = createContext(null)

function iconFor(type){
  if(type === "success") return CheckCircle2
  if(type === "error") return XCircle
  if(type === "loading") return Loader2
  return Info
}

export function ToasterProvider({ children }){
  const [toasts,setToasts] = useState([])
  const timers = useRef(new Map())

  const remove = useCallback((id)=>{
    setToasts(prev=>prev.filter(t=>t.id !== id))
    const timer = timers.current.get(id)
    if(timer){
      clearTimeout(timer)
      timers.current.delete(id)
    }
  },[])

  const push = useCallback((toast)=>{
    const id = toast.id ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`
    const t = {
      id,
      type: toast.type ?? "info",
      title: toast.title ?? "",
      message: toast.message ?? "",
      ttlMs: toast.ttlMs ?? 3500
    }

    setToasts(prev=>[t,...prev].slice(0,5))

    if(t.ttlMs > 0 && t.type !== "loading"){
      const timer = setTimeout(()=>remove(id),t.ttlMs)
      timers.current.set(id,timer)
    }

    return id
  },[remove])

  const update = useCallback((id,patch)=>{
    setToasts(prev=>prev.map(t=>t.id === id ? { ...t, ...patch } : t))
    if(patch?.type && patch.type !== "loading"){
      const timer = timers.current.get(id)
      if(timer){
        clearTimeout(timer)
        timers.current.delete(id)
      }
      const ttlMs = patch.ttlMs ?? 3500
      if(ttlMs > 0){
        const newTimer = setTimeout(()=>remove(id),ttlMs)
        timers.current.set(id,newTimer)
      }
    }
  },[remove])

  const api = useMemo(()=>({ push, update, remove }),[push,update,remove])

  return(
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map(t=>{
          const Icon = iconFor(t.type)
          const isLoading = t.type === "loading"
          return(
            <div key={t.id} className="card">
              <div className="card-inner py-4">
                <div className="flex items-start gap-3">
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${
                    t.type === "success" ? "text-emerald-300" :
                    t.type === "error" ? "text-rose-300" :
                    t.type === "loading" ? "text-blue-300" :
                    "text-slate-300"
                  } ${isLoading ? "animate-spin" : ""}`} />
                  <div className="min-w-0 flex-1">
                    {t.title && (
                      <p className="font-semibold text-slate-100">{t.title}</p>
                    )}
                    {t.message && (
                      <p className="text-sm text-slate-300 mt-0.5 break-words">{t.message}</p>
                    )}
                  </div>
                  <button
                    className="text-slate-400 hover:text-slate-200 text-sm"
                    onClick={()=>remove(t.id)}
                    aria-label="Close toast"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(){
  const ctx = useContext(ToastContext)
  if(!ctx){
    throw new Error("useToast must be used within ToasterProvider")
  }
  return ctx
}

