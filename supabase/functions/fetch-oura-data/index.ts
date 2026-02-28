import { createClient } from 'npm:@supabase/supabase-js@2'

const OURA_TOKEN          = Deno.env.get('OURA_ACCESS_TOKEN')!
const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const HEADERS = { Authorization: `Bearer ${OURA_TOKEN}` }
const BASE    = 'https://api.ouraring.com/v2/usercollection'

async function ouraGet(path: string, date: string) {
  const url = `${BASE}/${path}?start_date=${date}&end_date=${date}`
  const res  = await fetch(url, { headers: HEADERS })
  if (!res.ok) {
    console.warn(`Oura ${path} returned ${res.status}`)
    return null
  }
  const json = await res.json()
  return json.data?.[0] ?? null
}

Deno.serve(async () => {
  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

    // Fetch all endpoints in parallel
    const [dailySleep, sleepSession, readiness, stress] = await Promise.all([
      ouraGet('daily_sleep',     today),
      ouraGet('sleep',           today),
      ouraGet('daily_readiness', today),
      ouraGet('daily_stress',    today),
    ])

    const row = {
      date:                  today,
      sleep_score:           dailySleep?.score              ?? null,
      total_sleep_seconds:   sleepSession?.total_sleep_duration ?? null,
      deep_sleep_seconds:    sleepSession?.deep_sleep_duration  ?? null,
      rem_sleep_seconds:     sleepSession?.rem_sleep_duration   ?? null,
      light_sleep_seconds:   sleepSession?.light_sleep_duration ?? null,
      average_hrv:           sleepSession?.average_hrv          ?? null,
      average_heart_rate:    sleepSession?.average_heart_rate   ?? null,
      sleep_efficiency:      sleepSession?.efficiency           ?? null,
      readiness_score:       readiness?.score                   ?? null,
      temperature_deviation: readiness?.temperature_deviation   ?? null,
      stress_high_minutes:   stress?.stress_high                ?? null,
      recovery_high_minutes: stress?.recovery_high              ?? null,
      day_summary:           stress?.day_summary                ?? null,
    }

    const { error } = await supabase
      .from('oura_snapshots')
      .upsert(row, { onConflict: 'date' })

    if (error) throw error

    console.log(`Oura upserted for ${today}`)
    return Response.json({ upserted: 1, row })
  } catch (err) {
    console.error('fetch-oura-data error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
})
