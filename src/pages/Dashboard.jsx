import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BibleSelector from '../components/BibleSelector'
import {
  MoodChart,
  MoodGrid,
  TemperatureChart,
  DaylightChart,
  PrecipitationChart,
  VOOChart,
  VXXChart,
  ActivityHeatmap,
} from '../components/Charts'

function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[+m - 1]} ${+d}, ${y}`
}

export default function Dashboard() {
  const [session, setSession] = useState(null)
  const [weather, setWeather] = useState([])
  const [market, setMarket] = useState({ VOO: [], VXX: [] })
  const [mood, setMood] = useState([])
  const [scriptureDates, setScriptureDates] = useState(new Set())
  const [personalDates, setPersonalDates] = useState(new Set())
  const [loading, setLoading] = useState(true)

  // Edit modal
  const [editModal, setEditModal] = useState(null) // { type: 'scripture'|'personal', date: string }
  const [modalTime, setModalTime] = useState('12:00')
  const [modalSelections, setModalSelections] = useState([])
  const [modalSaving, setModalSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
  }, [])

  useEffect(() => {
    async function fetchData() {
      const from30 = new Date()
      from30.setDate(from30.getDate() - 30)
      const fromDate30 = from30.toLocaleDateString('en-CA')

      const from365 = new Date()
      from365.setDate(from365.getDate() - 380)
      const fromDate365 = from365.toLocaleDateString('en-CA')

      const [weatherRes, marketRes, checkInRes, scriptureRes, personalRes] = await Promise.all([
        supabase
          .from('weather_snapshots')
          .select('date, feels_like_max_f, feels_like_min_f, precipitation_in, daylight_hours')
          .gte('date', fromDate30)
          .order('date'),
        supabase
          .from('market_snapshots')
          .select('date, symbol, close')
          .gte('date', fromDate30)
          .order('date'),
        supabase
          .from('check_ins')
          .select('date, type, mood_rating')
          .gte('date', fromDate30)
          .order('date'),
        supabase
          .from('scripture_readings')
          .select('read_at')
          .gte('read_at', from365.toISOString()),
        supabase
          .from('personal_checkins')
          .select('date')
          .gte('date', fromDate365)
          .eq('value', true),
      ])

      // Weather — already one row per day
      setWeather(weatherRes.data ?? [])

      // Market — pivot symbol rows into { date, VOO, VXX }
      const marketByDate = {}
      for (const row of marketRes.data ?? []) {
        if (!marketByDate[row.date]) marketByDate[row.date] = { date: row.date }
        marketByDate[row.date][row.symbol] = row.close
      }
      const marketData = Object.values(marketByDate).sort((a, b) => a.date.localeCompare(b.date))
      setMarket(marketData)

      // Check-ins — pivot type rows into { date, morning, evening }
      const moodByDate = {}
      for (const row of checkInRes.data ?? []) {
        if (!moodByDate[row.date]) moodByDate[row.date] = { date: row.date }
        moodByDate[row.date][row.type] = row.mood_rating
      }
      const moodData = Object.values(moodByDate).sort((a, b) => a.date.localeCompare(b.date))
      setMood(moodData)

      // Scripture — extract local date from each timestamptz
      const sSet = new Set(
        (scriptureRes.data ?? []).map(r =>
          new Date(r.read_at).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
        )
      )
      setScriptureDates(sSet)

      // Personal — dates already stored as local date strings
      setPersonalDates(new Set((personalRes.data ?? []).map(r => r.date)))

      setLoading(false)
    }

    fetchData()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  function openModal(type, date) {
    setEditModal({ type, date })
    setModalTime('12:00')
    setModalSelections([])
    setModalSaving(false)
  }

  async function saveScripture() {
    setModalSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const readAt = new Date(`${editModal.date}T${modalTime}:00`).toISOString()
    await supabase.from('scripture_readings').insert({
      user_id: session.user.id,
      read_at: readAt,
      selections: modalSelections,
    })
    setScriptureDates(prev => new Set([...prev, editModal.date]))
    setEditModal(null)
  }

  async function savePersonal(value) {
    setModalSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    await supabase
      .from('personal_checkins')
      .upsert(
        { user_id: session.user.id, date: editModal.date, value },
        { onConflict: 'user_id,date' }
      )
    setPersonalDates(prev => {
      const next = new Set(prev)
      if (value) next.add(editModal.date)
      else next.delete(editModal.date)
      return next
    })
    setEditModal(null)
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-6">
            <Link to="/settings" className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors">
              Settings
            </Link>
            <button onClick={signOut} className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors">
              Sign out
            </button>
          </div>
        </header>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <Link
            to="/check-in"
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-medium transition-colors"
          >
            Check in
          </Link>
          <Link
            to="/scripture"
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-medium transition-colors"
          >
            Scripture Reading
          </Link>
          <Link
            to="/personal"
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-medium transition-colors"
          >
            Personal
          </Link>
        </div>

        {/* Heatmaps + Charts */}
        {loading ? (
          <p className="text-sm text-neutral-600">Loading data…</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ActivityHeatmap
                title="Scripture Reading"
                activeDates={scriptureDates}
                color="#4ade80"
                onDateClick={date => openModal('scripture', date)}
              />
              <ActivityHeatmap
                title="Personal"
                activeDates={personalDates}
                color="#818cf8"
                onDateClick={date => openModal('personal', date)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MoodChart data={mood} />
              <MoodGrid data={mood} />
              <TemperatureChart data={weather} />
              <DaylightChart data={weather} />
              <PrecipitationChart data={weather} />
              <VOOChart data={market} />
              <VXXChart data={market} />
            </div>
          </div>
        )}

        {/* Heatmap edit modal */}
        {editModal && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setEditModal(null)}
          >
            <div
              className="bg-neutral-900 rounded-2xl p-6 w-full max-w-sm space-y-5"
              onClick={e => e.stopPropagation()}
            >
              {editModal.type === 'scripture' ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">Scripture Reading</h2>
                    <button
                      onClick={() => setEditModal(null)}
                      className="text-neutral-500 hover:text-neutral-300 transition-colors text-lg leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-sm text-neutral-500">{fmtDate(editModal.date)}</p>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5">Time</label>
                    <input
                      type="time"
                      value={modalTime}
                      onChange={e => setModalTime(e.target.value)}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-500"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1.5">What did you read?</p>
                    <div className="max-h-60 overflow-y-auto rounded-xl bg-neutral-800 p-3">
                      <BibleSelector value={modalSelections} onChange={setModalSelections} />
                    </div>
                  </div>
                  <button
                    onClick={saveScripture}
                    disabled={modalSaving || modalSelections.length === 0}
                    className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 rounded-xl text-sm font-medium transition-colors"
                  >
                    {modalSaving ? 'Saving…' : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">Personal</h2>
                    <button
                      onClick={() => setEditModal(null)}
                      className="text-neutral-500 hover:text-neutral-300 transition-colors text-lg leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-sm text-neutral-500">{fmtDate(editModal.date)}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => savePersonal(true)}
                      disabled={modalSaving}
                      className="flex-1 py-8 rounded-xl text-xl font-light bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => savePersonal(false)}
                      disabled={modalSaving}
                      className="flex-1 py-8 rounded-xl text-xl font-light bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 transition-colors"
                    >
                      No
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
