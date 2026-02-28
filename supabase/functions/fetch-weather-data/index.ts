import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Default location: 02162 (Newton, MA)
const DEFAULT_LAT = 42.33
const DEFAULT_LON = -71.21

async function getLocation(): Promise<{ lat: number; lon: number }> {
  const { data } = await supabase
    .from('user_settings')
    .select('lat, lon')
    .not('lat', 'is', null)
    .limit(1)
    .single()

  if (data?.lat && data?.lon) {
    return { lat: data.lat, lon: data.lon }
  }

  return { lat: DEFAULT_LAT, lon: DEFAULT_LON }
}

Deno.serve(async () => {
  try {
    const { lat, lon } = await getLocation()

    // Use Eastern time for the date so 6 PM EST run captures today, not tomorrow (UTC)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      daily: 'apparent_temperature_max,apparent_temperature_min,precipitation_sum,sunrise,sunset,weathercode',
      temperature_unit: 'fahrenheit',
      precipitation_unit: 'inch',
      timezone: 'America/New_York',
      start_date: today,
      end_date: today,
    })

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
    const data = await res.json()

    if (!data.daily?.time?.length) {
      return Response.json({ error: 'No weather data returned', data }, { status: 502 })
    }

    const d = data.daily
    const sunriseStr = d.sunrise[0]  // "2026-02-27T06:45" in local (ET) time
    const sunsetStr  = d.sunset[0]   // "2026-02-27T17:52" in local (ET) time

    // Compute duration from local time strings — no timezone offset needed
    const [rH, rM] = sunriseStr.split('T')[1].split(':').map(Number)
    const [sH, sM] = sunsetStr.split('T')[1].split(':').map(Number)
    const daylightHours = parseFloat(((sH * 60 + sM - rH * 60 - rM) / 60).toFixed(2))

    const row = {
      date:             today,
      feels_like_max_f: d.apparent_temperature_max[0],
      feels_like_min_f: d.apparent_temperature_min[0],
      precipitation_in: d.precipitation_sum[0],
      sunrise:          sunriseStr,
      sunset:           sunsetStr,
      daylight_hours:   daylightHours,
      weather_code:     d.weathercode[0],
    }

    const { error } = await supabase
      .from('weather_snapshots')
      .upsert(row, { onConflict: 'date' })

    if (error) throw error

    console.log(`Weather upserted for ${today}:`, row)
    return Response.json({ upserted: 1, row })
  } catch (err) {
    console.error('fetch-weather-data error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
})
