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
  ScriptureCoverageMap,
  OuraChart,
  OuraSleepChart,
  OuraStressChart,
  OuraHRVChart,
  OuraHRChart,
  OuraStepsChart,
  OuraCaloriesChart,
  OuraActivityZonesChart,
  OuraSedentaryChart,
  EnergyChart,
  WorkoutChart,
  MeditationChart,
} from '../components/Charts'

function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[+m - 1]} ${+d}, ${y}`
}

function fmtTime(isoString) {
  const d = new Date(isoString)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function fmtSelections(selections) {
  if (!selections?.length) return ''
  return selections.map(sel => {
    if (!sel.chapters?.length) return sel.book
    const sorted = [...sel.chapters].sort((a, b) => a - b)
    const ranges = []
    let start = sorted[0], end = sorted[0]
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) { end = sorted[i] }
      else { ranges.push(start === end ? `${start}` : `${start}–${end}`); start = end = sorted[i] }
    }
    ranges.push(start === end ? `${start}` : `${start}–${end}`)
    return `${sel.book} ${ranges.join(', ')}`
  }).join(' · ')
}

export default function Dashboard() {
  const [session, setSession] = useState(null)
  const [weather, setWeather] = useState([])
  const [market, setMarket] = useState({ VOO: [], VXX: [] })
  const [mood, setMood] = useState([])
  const [scriptureDates, setScriptureDates] = useState(new Set())
  const [scriptureReadings, setScriptureReadings] = useState([])
  const [personalDates, setPersonalDates] = useState(new Set())
  const [oura, setOura] = useState([])
  const [meditation, setMeditation] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)

  // Edit modal
  const [editModal, setEditModal] = useState(null) // { type: 'scripture'|'personal', date: string }
  const [modalTime, setModalTime] = useState('12:00')
  const [modalSelections, setModalSelections] = useState([])
  const [modalExisting, setModalExisting] = useState([])
  const [modalMinutes, setModalMinutes] = useState(10)
  const [modalWorkoutActivity, setModalWorkoutActivity] = useState('Weight Training')
  const [modalWorkoutIntensity, setModalWorkoutIntensity] = useState('moderate')
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

      const [weatherRes, marketRes, checkInRes, scriptureRes, personalRes, ouraRes, meditationRes, workoutRes] = await Promise.all([
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
          .select('date, type, mood_rating, energy_rating')
          .gte('date', fromDate30)
          .order('date'),
        supabase
          .from('scripture_readings')
          .select('read_at, selections')
          .gte('read_at', from365.toISOString()),
        supabase
          .from('personal_checkins')
          .select('date')
          .gte('date', fromDate365)
          .eq('value', true),
        supabase
          .from('oura_snapshots')
          .select('date, sleep_score, readiness_score, temperature_deviation, total_sleep_seconds, deep_sleep_seconds, rem_sleep_seconds, light_sleep_seconds, stress_high_minutes, recovery_high_minutes, average_hrv, average_heart_rate, activity_score, steps, active_calories, high_activity_seconds, medium_activity_seconds, sedentary_seconds')
          .gte('date', fromDate30)
          .order('date'),
        supabase
          .from('meditation_sessions')
          .select('logged_at, duration_minutes')
          .gte('logged_at', from30.toISOString())
          .order('logged_at'),
        supabase
          .from('workout_sessions')
          .select('day, activity, duration_seconds, intensity, source')
          .gte('day', fromDate30)
          .order('day'),
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

      // Check-ins — pivot into { date, morning, evening, morning_energy, evening_energy }
      const moodByDate = {}
      for (const row of checkInRes.data ?? []) {
        if (!moodByDate[row.date]) moodByDate[row.date] = { date: row.date }
        moodByDate[row.date][row.type] = row.mood_rating
        if (row.energy_rating != null) moodByDate[row.date][`${row.type}_energy`] = row.energy_rating
      }
      const moodData = Object.values(moodByDate).sort((a, b) => a.date.localeCompare(b.date))
      setMood(moodData)

      // Scripture — extract local date from each timestamptz using browser's local timezone
      const scriptureData = scriptureRes.data ?? []
      const sSet = new Set(scriptureData.map(r => new Date(r.read_at).toLocaleDateString('en-CA')))
      setScriptureDates(sSet)
      setScriptureReadings(scriptureData)

      // Personal — dates already stored as local date strings
      setPersonalDates(new Set((personalRes.data ?? []).map(r => r.date)))

      // Workouts — sum minutes per day
      const workoutByDate = {}
      for (const row of workoutRes.data ?? []) {
        if (!workoutByDate[row.day]) workoutByDate[row.day] = { date: row.day, minutes: 0, activity: row.activity }
        workoutByDate[row.day].minutes += Math.round((row.duration_seconds ?? 0) / 60)
      }
      setWorkouts(Object.values(workoutByDate).sort((a, b) => a.date.localeCompare(b.date)))

      // Meditation — sum minutes per day
      const medByDate = {}
      for (const row of meditationRes.data ?? []) {
        const date = new Date(row.logged_at).toLocaleDateString('en-CA')
        if (!medByDate[date]) medByDate[date] = { date, minutes: 0 }
        medByDate[date].minutes += row.duration_minutes
      }
      setMeditation(Object.values(medByDate).sort((a, b) => a.date.localeCompare(b.date)))

      // Oura — convert seconds to hours; stress fields are in seconds despite column name
      const toHours = (s) => s != null ? Math.round((s / 3600) * 10) / 10 : null
      const toMin   = (s) => s != null ? Math.round(s / 60) : null
      setOura((ouraRes.data ?? []).map(r => ({
        ...r,
        total_sleep_hours:       toHours(r.total_sleep_seconds),
        deep_sleep_hours:        toHours(r.deep_sleep_seconds),
        rem_sleep_hours:         toHours(r.rem_sleep_seconds),
        light_sleep_hours:       toHours(r.light_sleep_seconds),
        stress_high_min:         toMin(r.stress_high_minutes),
        recovery_high_min:       toMin(r.recovery_high_minutes),
        high_activity_min:       toMin(r.high_activity_seconds),
        medium_activity_min:     toMin(r.medium_activity_seconds),
        sedentary_min:           toMin(r.sedentary_seconds),
        sedentary_hours:         toHours(r.sedentary_seconds),
      })))

      setLoading(false)
    }

    fetchData()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  function openModal(type, date) {
    setEditModal({ type, date })
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    setModalTime(`${hh}:${mm}`)
    setModalMinutes(10)
    setModalWorkoutActivity('Weight Training')
    setModalWorkoutIntensity('moderate')
    setModalSaving(false)

    if (type === 'scripture') {
      const existing = scriptureReadings.filter(r =>
        new Date(r.read_at).toLocaleDateString('en-CA') === date
      ).sort((a, b) => new Date(a.read_at) - new Date(b.read_at))
      setModalExisting(existing)
      setModalSelections([])
    } else {
      setModalExisting([])
      setModalSelections([])
    }
  }

  async function saveScripture() {
    setModalSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const readAt = new Date(`${editModal.date}T${modalTime}:00`).toISOString()
    const { error } = await supabase.from('scripture_readings').insert({
      user_id: session.user.id,
      read_at: readAt,
      selections: modalSelections,
    })
    if (error) {
      console.error('[scripture] save error:', error)
      alert(`Save failed: ${error.message}`)
      setModalSaving(false)
      return
    }
    setScriptureDates(prev => new Set([...prev, editModal.date]))
    setEditModal(null)
  }

  async function saveWorkout() {
    setModalSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('workout_sessions').insert({
      user_id:          session.user.id,
      source:           'manual',
      day:              editModal.date,
      activity:         modalWorkoutActivity,
      duration_seconds: modalMinutes * 60,
      intensity:        modalWorkoutIntensity,
    })
    if (error) {
      alert(`Save failed: ${error.message}`)
      setModalSaving(false)
      return
    }
    setWorkouts(prev => {
      const existing = prev.find(d => d.date === editModal.date)
      if (existing) return prev.map(d => d.date === editModal.date ? { ...d, minutes: d.minutes + modalMinutes } : d)
      return [...prev, { date: editModal.date, minutes: modalMinutes, activity: modalWorkoutActivity }].sort((a, b) => a.date.localeCompare(b.date))
    })
    setEditModal(null)
  }

  async function saveMeditation() {
    setModalSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const loggedAt = new Date(`${editModal.date}T${modalTime}:00`).toISOString()
    const { error } = await supabase.from('meditation_sessions').insert({
      user_id: session.user.id,
      logged_at: loggedAt,
      duration_minutes: modalMinutes,
    })
    if (error) {
      alert(`Save failed: ${error.message}`)
      setModalSaving(false)
      return
    }
    setMeditation(prev => {
      const existing = prev.find(d => d.date === editModal.date)
      if (existing) return prev.map(d => d.date === editModal.date ? { ...d, minutes: d.minutes + modalMinutes } : d)
      return [...prev, { date: editModal.date, minutes: modalMinutes }].sort((a, b) => a.date.localeCompare(b.date))
    })
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
          <button
            onClick={() => openModal('meditation', new Date().toLocaleDateString('en-CA'))}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-medium transition-colors"
          >
            Meditation
          </button>
          <button
            onClick={() => openModal('workout', new Date().toLocaleDateString('en-CA'))}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-medium transition-colors"
          >
            Log Workout
          </button>
        </div>

        {/* Heatmaps + Charts */}
        {loading ? (
          <p className="text-sm text-neutral-600">Loading data…</p>
        ) : (
          <div className="space-y-4">
            {/* Oura */}
            {oura.length > 0 && (
              <>
                <OuraChart data={oura} />
                <OuraSleepChart data={oura} />
                <WorkoutChart data={workouts} />
                <div className="grid grid-cols-2 gap-4">
                  <OuraStressChart data={oura} />
                  <OuraHRVChart data={oura} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <OuraHRChart data={oura} />
                  <OuraStepsChart data={oura} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <OuraCaloriesChart data={oura} />
                  <OuraActivityZonesChart data={oura} />
                </div>
                <OuraSedentaryChart data={oura} />
              </>
            )}
            {/* Weather */}
            <div className="grid grid-cols-2 gap-4">
              <TemperatureChart data={weather} />
              <DaylightChart data={weather} />
            </div>
            {/* Precipitation + Scripture heatmap */}
            <div className="grid grid-cols-2 gap-4">
              <PrecipitationChart data={weather} />
              <ActivityHeatmap
                title="Scripture Reading"
                activeDates={scriptureDates}
                color="#4ade80"
                onDateClick={date => openModal('scripture', date)}
              />
            </div>
            {/* Scripture coverage */}
            <ScriptureCoverageMap readings={scriptureReadings} />
            {/* Markets */}
            <div className="grid grid-cols-2 gap-4">
              <VOOChart data={market} />
              <VXXChart data={market} />
            </div>
            {/* Personal heatmap + Meditation + Workout */}
            <div className="grid grid-cols-2 gap-4">
              <ActivityHeatmap
                title="Personal"
                activeDates={personalDates}
                color="#818cf8"
                onDateClick={date => openModal('personal', date)}
              />
              <MeditationChart data={meditation} />
            </div>
            {/* Mood + Energy (at end to avoid anchoring bias) */}
            <div className="grid grid-cols-2 gap-4">
              <MoodChart data={mood} />
              <EnergyChart data={mood} />
            </div>
            <MoodGrid data={mood} />
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
                  <div className="space-y-0.5">
                    <p className="text-sm text-neutral-400">{fmtDate(editModal.date)}</p>
                    {modalExisting.map((r, i) => (
                      <div key={i} className="pt-2 space-y-0.5">
                        <p className="text-xs text-neutral-500">{fmtTime(r.read_at)}</p>
                        <p className="text-sm text-neutral-300">Read: {fmtSelections(r.selections)}</p>
                      </div>
                    ))}
                  </div>
                  {modalExisting.length > 0 && (
                    <div className="border-t border-neutral-800" />
                  )}
                  <div>
                    <p className="text-xs text-neutral-500 mb-1.5">What did you read?</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1.5">Time</label>
                        <input
                          type="time"
                          value={modalTime}
                          onChange={e => setModalTime(e.target.value)}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-500"
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto rounded-xl bg-neutral-800 p-3">
                        <BibleSelector value={modalSelections} onChange={setModalSelections} />
                      </div>
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
              ) : editModal.type === 'workout' ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">Log Workout</h2>
                    <button onClick={() => setEditModal(null)} className="text-neutral-500 hover:text-neutral-300 transition-colors text-lg leading-none">✕</button>
                  </div>
                  <p className="text-sm text-neutral-500">{fmtDate(editModal.date)}</p>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5">Activity</label>
                    <select
                      value={modalWorkoutActivity}
                      onChange={e => setModalWorkoutActivity(e.target.value)}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-500"
                    >
                      {['Weight Training','Running','Cycling','Swimming','HIIT','Walking','Yoga','Other'].map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5">Duration (minutes)</label>
                    <input
                      type="number" min={1} max={300} value={modalMinutes}
                      onChange={e => setModalMinutes(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5">Intensity</label>
                    <div className="flex gap-2">
                      {['low','moderate','high'].map(lvl => (
                        <button
                          key={lvl}
                          onClick={() => setModalWorkoutIntensity(lvl)}
                          className={`flex-1 py-2 rounded-lg text-sm capitalize transition-colors ${modalWorkoutIntensity === lvl ? 'bg-neutral-600 text-neutral-100' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={saveWorkout}
                    disabled={modalSaving || modalMinutes < 1}
                    className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 rounded-xl text-sm font-medium transition-colors"
                  >
                    {modalSaving ? 'Saving…' : 'Save'}
                  </button>
                </>
              ) : editModal.type === 'meditation' ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">Meditation</h2>
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
                    <label className="block text-xs text-neutral-500 mb-1.5">Duration (minutes)</label>
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={modalMinutes}
                      onChange={e => setModalMinutes(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-500"
                    />
                  </div>
                  <button
                    onClick={saveMeditation}
                    disabled={modalSaving || modalMinutes < 1}
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
