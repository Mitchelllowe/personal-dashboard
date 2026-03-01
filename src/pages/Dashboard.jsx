import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  MoodChart,
  TemperatureChart,
  DaylightChart,
  PrecipitationChart,
  VOOChart,
  VXXChart,
  ActivityHeatmap,
} from '../components/Charts'

export default function Dashboard() {
  const [session, setSession] = useState(null)
  const [weather, setWeather] = useState([])
  const [market, setMarket] = useState({ VOO: [], VXX: [] })
  const [mood, setMood] = useState([])
  const [scriptureDates, setScriptureDates] = useState(new Set())
  const [personalDates, setPersonalDates] = useState(new Set())
  const [loading, setLoading] = useState(true)

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
              <ActivityHeatmap title="Scripture Reading" activeDates={scriptureDates} color="#4ade80" />
              <ActivityHeatmap title="Personal" activeDates={personalDates} color="#818cf8" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MoodChart data={mood} />
              <TemperatureChart data={weather} />
              <DaylightChart data={weather} />
              <PrecipitationChart data={weather} />
              <VOOChart data={market} />
              <VXXChart data={market} />
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
