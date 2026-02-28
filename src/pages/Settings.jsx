import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const [zipCode, setZipCode] = useState('')
  const [status, setStatus] = useState(null) // 'saving' | 'saved' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data } = await supabase
        .from('user_settings')
        .select('zip_code')
        .eq('user_id', session.user.id)
        .single()
      if (data?.zip_code) setZipCode(data.zip_code)
    })
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg('')

    const zip = zipCode.trim()
    if (!/^\d{5}$/.test(zip)) {
      setErrorMsg('Enter a valid 5-digit US zip code.')
      setStatus('error')
      return
    }

    // Geocode zip → lat/lon via Zippopotam.us (free, no key)
    let lat, lon
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
      if (!res.ok) throw new Error('Zip code not found.')
      const geo = await res.json()
      lat = parseFloat(geo.places[0].latitude)
      lon = parseFloat(geo.places[0].longitude)
    } catch (err) {
      setErrorMsg(err.message || 'Could not geocode zip code.')
      setStatus('error')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: session.user.id, zip_code: zip, lat, lon, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    if (error) {
      setErrorMsg('Failed to save settings.')
      setStatus('error')
      return
    }

    setStatus('saved')
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-lg mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <Link to="/" className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-semibold">Settings</h1>
        </header>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Location</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="zip" className="block text-sm text-neutral-300">
                ZIP Code
              </label>
              <input
                id="zip"
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={zipCode}
                onChange={e => { setZipCode(e.target.value); setStatus(null) }}
                placeholder="02163"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
              />
            </div>

            {errorMsg && (
              <p className="text-sm text-red-400">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'saving'}
              className="px-5 py-2.5 bg-neutral-800 text-neutral-100 rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition-colors text-sm"
            >
              {status === 'saving' ? 'Saving…' : 'Save'}
            </button>

            {status === 'saved' && (
              <p className="text-sm text-green-400">Location updated.</p>
            )}
          </form>
        </section>
      </div>
    </main>
  )
}
