import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BibleSelector from '../components/BibleSelector'

function todayLocal() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

function nowLocal() {
  return new Date().toLocaleTimeString('en-CA', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function ScriptureReading() {
  const [date, setDate] = useState(todayLocal)
  const [time, setTime] = useState(nowLocal)
  const [selections, setSelections] = useState([])
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)

    const { data: { session } } = await supabase.auth.getSession()

    // Combine date + time into a timestamptz (treat as Eastern time)
    const readAt = new Date(`${date}T${time}:00`).toISOString()

    await supabase.from('scripture_readings').insert({
      user_id:    session.user.id,
      read_at:    readAt,
      selections,
    })

    navigate('/')
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-sm mx-auto space-y-8">

        <header className="flex items-center gap-4">
          <Link to="/" className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-semibold">Scripture Reading</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Date + time */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="block text-xs text-neutral-500">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="block text-xs text-neutral-500">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
            </div>
          </div>

          {/* Book + chapter selector */}
          <div className="space-y-2">
            <p className="text-xs text-neutral-500">What did you read?</p>
            <div className="max-h-96 overflow-y-auto rounded-xl bg-neutral-900 p-3">
              <BibleSelector value={selections} onChange={setSelections} />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || selections.length === 0}
            className="w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 rounded-xl text-sm font-medium transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>

        </form>
      </div>
    </main>
  )
}
