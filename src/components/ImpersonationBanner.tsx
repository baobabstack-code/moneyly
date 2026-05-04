'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IMPERSONATE_COOKIE } from '@/lib/impersonate'

interface ImpersonationData {
  targetUserId: string
  targetName: string
  returnPath: string
}

export default function ImpersonationBanner() {
  const [data, setData] = useState<ImpersonationData | null>(null)
  const [exiting, setExiting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const raw = document.cookie
      .split('; ')
      .find(row => row.startsWith(IMPERSONATE_COOKIE + '='))
      ?.split('=').slice(1).join('=')

    if (raw) {
      try { setData(JSON.parse(decodeURIComponent(raw))) } catch { /* ignore */ }
    }
  }, [])

  if (!data) return null

  const handleStop = () => {
    setExiting(true)
    document.cookie = `${IMPERSONATE_COOKIE}=; path=/; max-age=0`
    router.push(data.returnPath || '/super-admin')
  }

  return (
    <div className="sticky top-0 z-50 w-full bg-linear-to-r from-secondary to-secondary-container text-on-secondary shadow-lg shadow-secondary/20">
      <div className="flex items-center justify-between px-4 py-2.5 gap-4 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-body-md">visibility</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight">
              Viewing as <span className="underline underline-offset-2">{data.targetName}</span>
            </p>
            <p className="text-[10px] text-on-secondary/70 uppercase tracking-widest font-bold">
              Super Admin Impersonation Mode
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStop}
          disabled={exiting}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 font-bold text-sm transition-all active:scale-95 disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          {exiting ? 'Exiting…' : 'Exit View'}
        </button>
      </div>
    </div>
  )
}
