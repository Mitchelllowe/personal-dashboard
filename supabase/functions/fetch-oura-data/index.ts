import { createClient } from 'npm:@supabase/supabase-js@2'

const OURA_TOKEN           = Deno.env.get('OURA_ACCESS_TOKEN')!
const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const HEADERS = { Authorization: `Bearer ${OURA_TOKEN}` }
const BASE    = 'https://api.ouraring.com/v2/usercollection'

function nextDay(date: string) {
  const d = new Date(date)
  d.setDate(d.getDate() + 1)
  return d.toLocaleDateString('en-CA')
}

async function ouraGet(path: string, date: string) {
  const url = `${BASE}/${path}?start_date=${date}&end_date=${nextDay(date)}`
  const res  = await fetch(url, { headers: HEADERS })
  if (!res.ok) { console.warn(`Oura ${path} returned ${res.status}`); return null }
  const json = await res.json()
  return json.data?.[0] ?? null
}

async function ouraGetAll(path: string, startDate: string, endDate?: string) {
  const end = nextDay(endDate ?? startDate)
  const url = `${BASE}/${path}?start_date=${startDate}&end_date=${end}`
  const res  = await fetch(url, { headers: HEADERS })
  if (!res.ok) { console.warn(`Oura ${path} returned ${res.status}`); return [] }
  const json = await res.json()
  return json.data ?? []
}

Deno.serve(async (req) => {
  try {
    let body: { days?: number } = {}
    try { body = await req.json() } catch { /* no body is fine */ }

    const days = body.days ?? 1
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    const todayDate = new Date(todayStr)

    const dates: string[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(todayDate)
      d.setDate(todayDate.getDate() - i)
      dates.push(d.toLocaleDateString('en-CA'))
    }

    const rows = []
    for (const date of dates) {
      const [dailySleep, readiness, stress, activity] = await Promise.all([
        ouraGet('daily_sleep',     date),
        ouraGet('daily_readiness', date),
        ouraGet('daily_stress',    date),
        ouraGet('daily_activity',  date),
      ])

      // Oura indexes sleep sessions under the date you went to bed, not wakeup date.
      // Fetch a 2-day window (prev day + current day) to catch the overnight session.
      const prevDate = new Date(date)
      prevDate.setDate(prevDate.getDate() - 1)
      const prevDateStr = prevDate.toLocaleDateString('en-CA')
      const windowSessions = await ouraGetAll('sleep', prevDateStr, date)

      const mainSleep = windowSessions.find((s: { type: string }) => s.type === 'long_sleep')
        ?? windowSessions.find((s: { type: string }) => s.type === 'sleep')
        ?? windowSessions[0]
        ?? null

      rows.push({
        date,
        sleep_score:           dailySleep?.score                      ?? null,
        total_sleep_seconds:   mainSleep?.total_sleep_duration        ?? null,
        deep_sleep_seconds:    mainSleep?.deep_sleep_duration         ?? null,
        rem_sleep_seconds:     mainSleep?.rem_sleep_duration          ?? null,
        light_sleep_seconds:   mainSleep?.light_sleep_duration        ?? null,
        average_hrv:           mainSleep?.average_hrv                 ?? null,
        average_heart_rate:    mainSleep?.average_heart_rate          ?? null,
        sleep_efficiency:      mainSleep?.efficiency                  ?? null,
        readiness_score:       readiness?.score                       ?? null,
        temperature_deviation: readiness?.temperature_deviation       ?? null,
        stress_high_minutes:   stress?.stress_high                    ?? null,
        recovery_high_minutes: stress?.recovery_high                  ?? null,
        day_summary:           stress?.day_summary                    ?? null,
        activity_score:        activity?.score                        ?? null,
        steps:                 activity?.steps                        ?? null,
        active_calories:       activity?.active_calories              ?? null,
        high_activity_seconds: activity?.high_activity_time           ?? null,
        medium_activity_seconds: activity?.medium_activity_time       ?? null,
        sedentary_seconds:     activity?.sedentary_time               ?? null,
      })
    }

    const { error } = await supabase
      .from('oura_snapshots')
      .upsert(rows, { onConflict: 'date' })

    if (error) throw error

    // Fetch and upsert workout sessions for the date range
    const startDate = dates[0]
    const endDate   = dates[dates.length - 1]
    const workouts  = await ouraGetAll('workout', startDate, endDate)

    type OuraWorkout = {
      id: string; activity: string; day: string
      end_datetime: string; start_datetime: string
      intensity: string; calories: number
      distance: number; average_heart_rate: number
    }

    const workoutRows = workouts.map((w: OuraWorkout) => {
      const durationSeconds = w.start_datetime && w.end_datetime
        ? Math.round((new Date(w.end_datetime).getTime() - new Date(w.start_datetime).getTime()) / 1000)
        : null
      return {
        source:             'oura',
        day:                w.day,
        activity:           w.activity,
        duration_seconds:   durationSeconds != null && durationSeconds > 0 ? durationSeconds : null,
        intensity:          w.intensity   ?? null,
        calories:           w.calories    != null ? Math.round(w.calories)    : null,
        distance_meters:    w.distance    ?? null,
        average_heart_rate: w.average_heart_rate != null ? Math.round(w.average_heart_rate) : null,
        oura_id:            w.id,
      }
    })

    let workoutError = null
    if (workoutRows.length > 0) {
      const { error: wErr } = await supabase
        .from('workout_sessions')
        .upsert(workoutRows, { onConflict: 'oura_id' })
      if (wErr) workoutError = wErr.message
    }

    console.log(`Oura upserted ${rows.length} snapshot(s), ${workoutRows.length} workout(s)`)
    return Response.json({ upserted: rows.length, workouts: workoutRows.length, workoutError, dates })
  } catch (err) {
    console.error('fetch-oura-data error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
})
