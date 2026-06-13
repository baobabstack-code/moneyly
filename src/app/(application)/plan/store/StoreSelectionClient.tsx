'use client'

import { useApplicationStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

type Store = {
  id: number
  name: string
  code: string | null
  location: string | null
  hours: string | null
  logo_url: string | null
}

export default function StoreSelectionClient({ stores }: { stores: Store[] }) {
  const router = useRouter()
  const { setSelectedStore } = useApplicationStore()

  const handleSelectStore = (id: number, name: string) => {
    setSelectedStore(id, name)
    router.push('/plan/details') // Redirect straight to purchase details, skipping identity lookup
  }

  return (
    <div className="w-full">
      {/* Progress Header */}
      <div className="mb-stack-lg px-4 sm:px-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-secondary font-label-md uppercase tracking-wider block">Step 1 of 4</span>
              <div className="group relative">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 cursor-help">help</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-primary text-on-primary text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-xl text-center">
                  Choose where this planned purchase belongs so Moneyly can organize it.
                </div>
              </div>
            </div>
            <h1 className="font-h1 text-on-surface">Choose Purchase Source</h1>
          </div>
          <div className="hidden md:block text-right">
            <span className="text-on-surface-variant font-body-sm">Completion</span>
            <div className="w-48 h-2 bg-outline-variant rounded-full mt-2 overflow-hidden">
              <div className="bg-secondary h-full w-[25%] transition-all duration-500" />
            </div>
          </div>
        </div>
        <p className="text-on-surface-variant font-body-lg max-w-2xl">
          Choose the store, branch, or source connected to this planned purchase.
        </p>
      </div>

      {/* Empty state */}
      {stores.length === 0 ? (
        <div className="max-w-md text-center py-10 px-6 bg-surface rounded-2xl border border-outline-variant">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-3 block">storefront</span>
          <p className="text-on-surface-variant font-medium">No stores available at this time.</p>
          <p className="text-on-surface-variant/60 text-sm mt-1">Please check back later.</p>
        </div>
      ) : (
        /* Store tiles */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter px-4 sm:px-0">
          {stores.map(store => (
            <button
              key={store.id}
              onClick={() => handleSelectStore(store.id, store.name)}
              className="group flex flex-col text-left bg-surface border-2 border-outline-variant p-gutter rounded-2xl hover:border-secondary hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-xl bg-white overflow-hidden flex items-center justify-center p-2 border border-outline-variant group-hover:border-secondary/50 shadow-inner transition-colors">
                  {store.logo_url ? (
                    <img alt={store.name} className="w-full h-full object-contain" src={store.logo_url} />
                  ) : (
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant">storefront</span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {store.code && (
                    <span className="text-[10px] text-on-surface-variant/80 font-mono uppercase">{store.code}</span>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-h3 text-h3 text-primary mb-2 group-hover:text-secondary transition-colors">
                  {store.name}
                </h3>
                {store.location && (
                  <p className="text-on-surface-variant/80 font-body-sm mb-4 whitespace-pre-line leading-relaxed">
                    {store.location}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30 mt-auto">
                {store.hours ? (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary">schedule</span>
                    <span className="text-on-surface-variant font-label-sm">{store.hours}</span>
                  </div>
                ) : (
                  <span />
                )}
                <span className="material-symbols-outlined text-secondary group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
