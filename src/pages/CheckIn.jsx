import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const DEFAULT_ZIP = '02163'

export default function CheckIn() {
  const [rating, setRating] = useState(5)
  const [zipCode, setZipCode] = useState(DEFAULT_ZIP)
  const [editingZip, setEditingZip] = useState(false)
  const [pendingZip, setPendingZip] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const type = new Date().getHours() < 12 ? 'morning' : 'evening'

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

  async function saveZip(e) {
    e.preventDefault()
    const zip = pendingZip.trim()
    if (!/^\d{5}$/.test(zip)) return

    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
      if (!res.ok) return
      const geo = await res.json()
      const lat = parseFloat(geo.places[0].latitude)
      const lon = parseFloat(geo.places[0].longitude)

      const { data: { session } } = await supabase.auth.getSession()
      await supabase
        .from('user_settings')
        .upsert(
          { user_id: session.user.id, zip_code: zip, lat, lon, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )

      setZipCode(zip)
      setEditingZip(false)
    } catch {
      // silently fail — zip stays unchanged
    }
  }

  async function handleSubmit() {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

    await supabase
      .from('check_ins')
      .upsert(
        { user_id: session.user.id, date: today, type, mood_rating: rating },
        { onConflict: 'user_id,date,type' }
      )

    navigate('/')
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-14">

        <h1 className="text-2xl font-semibold text-center tracking-tight">
          How are you feeling?
        </h1>

        {/* Rating display */}
        <div className="text-center leading-none">
          <span className="text-9xl font-extralight tabular-nums text-neutral-100">
            {rating}
          </span>
          <span className="text-3xl text-neutral-600 ml-1">/10</span>
        </div>

        {/* Slider */}
        <div className="space-y-3">
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={rating}
            onChange={e => setRating(Number(e.target.value))}
            className="w-full h-1.5 accent-neutral-300 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-neutral-600 px-0.5">
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        {/* Zip code */}
        <div className="text-center">
          {editingZip ? (
            <form onSubmit={saveZip} className="flex items-center justify-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={pendingZip}
                onChange={e => setPendingZip(e.target.value)}
                autoFocus
                placeholder="ZIP"
                className="w-20 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-center text-sm text-neutral-100 focus:outline-none focus:border-neutral-500"
              />
              <button type="submit" className="text-sm text-neutral-300 hover:text-white transition-colors">
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingZip(false)}
                className="text-sm text-neutral-600 hover:text-neutral-400 transition-colors"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => { setPendingZip(zipCode); setEditingZip(true) }}
              className="text-sm text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              {zipCode}
            </button>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors"
        >
          {saving ? 'Saving…' : 'Submit'}
        </button>

      </div>
    </main>
  )
}
