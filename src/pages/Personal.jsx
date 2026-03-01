import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Personal() {
  const [existing, setExisting] = useState(undefined) // undefined=loading, null=none, true/false=saved
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data } = await supabase
        .from('personal_checkins')
        .select('value')
        .eq('user_id', session.user.id)
        .eq('date', today)
        .single()
      setExisting(data ? data.value : null)
    })
  }, [today])

  async function handleSelect(value) {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    await supabase
      .from('personal_checkins')
      .upsert(
        { user_id: session.user.id, date: today, value },
        { onConflict: 'user_id,date' }
      )
    navigate('/')
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-start p-8 pt-16">
      <div className="w-full max-w-sm space-y-14">

        <header className="flex items-center gap-4">
          <Link to="/" className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-semibold">Personal</h1>
        </header>

        <p className="text-sm text-neutral-500 text-center">{today}</p>

        <div className="flex gap-4">
          <button
            onClick={() => handleSelect(true)}
            disabled={saving || existing === undefined}
            className={`flex-1 py-10 rounded-xl text-2xl font-light transition-colors disabled:opacity-40 ${
              existing === true
                ? 'bg-neutral-200 text-neutral-900'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100'
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => handleSelect(false)}
            disabled={saving || existing === undefined}
            className={`flex-1 py-10 rounded-xl text-2xl font-light transition-colors disabled:opacity-40 ${
              existing === false
                ? 'bg-neutral-600 text-neutral-100'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100'
            }`}
          >
            No
          </button>
        </div>

      </div>
    </main>
  )
}
