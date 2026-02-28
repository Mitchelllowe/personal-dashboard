import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-6">
            <Link
              to="/settings"
              className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Settings
            </Link>
            <button
              onClick={signOut}
              className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>
        <p className="text-neutral-400">Welcome, {session?.user?.email}</p>
      </div>
    </main>
  )
}
