'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createStore, inviteAdmin } from '../actions'

type Store = {
  id: number
  name: string
  admin_id: string | null
  created_at: string
}

export default function StoresClient({ stores: initial }: { stores: Store[] }) {
  const [stores, setStores] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [createError, setCreateError] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [selectedStore, setSelectedStore] = useState<number | null>(null)

  function handleCreateStore(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCreateError('')
    const form = e.currentTarget
    const data = new FormData(form)

    startTransition(async () => {
      const result = await createStore(data)
      if (result.error) {
        setCreateError(result.error)
      } else {
        form.reset()
        // Reload to get updated list
        window.location.reload()
      }
    })
  }

  function handleInviteAdmin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    const form = e.currentTarget
    const data = new FormData(form)

    startTransition(async () => {
      const result = await inviteAdmin(data)
      if (result.error) {
        setInviteError(result.error)
      } else {
        setInviteSuccess('Invite sent! The admin will receive an email link to set up their account.')
        form.reset()
        setSelectedStore(null)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Create Store */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-lg">Create Store</h2>
        <form onSubmit={handleCreateStore} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium block mb-1">Store Name</label>
            <input
              name="name"
              required
              placeholder="e.g. Kitwe Branch"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Creating…' : 'Create'}
          </button>
        </form>
        {createError && <p className="text-sm text-destructive">{createError}</p>}
      </section>

      {/* Invite Admin */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-lg">Invite Store Admin</h2>
        <form onSubmit={handleInviteAdmin} className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">Admin Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="admin@example.com"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Assign to Store</label>
            <select
              name="storeId"
              required
              value={selectedStore ?? ''}
              onChange={e => setSelectedStore(Number(e.target.value))}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="" disabled>Select a store…</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isPending || !stores.length}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Sending…' : 'Send Invite'}
          </button>
        </form>
        {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
        {inviteSuccess && <p className="text-sm text-green-600">{inviteSuccess}</p>}
      </section>

      {/* Stores List */}
      <section className="space-y-3">
        <h2 className="font-semibold text-lg">All Stores</h2>
        {!stores.length ? (
          <p className="text-muted-foreground">No stores yet.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Admin</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stores.map(s => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {s.admin_id ? s.admin_id.slice(0, 8) + '…' : (
                        <span className="text-yellow-600">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/super-admin/stores/${s.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
