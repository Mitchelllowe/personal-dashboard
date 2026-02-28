import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [error, setError] = useState(null)

  // Surface any OAuth error Supabase passes back in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error_description') || params.get('error')
    if (err) setError(decodeURIComponent(err))
  }, [])

  async function signInWithGitHub() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) setError(error.message)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="text-center space-y-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Personal Dashboard</h1>
        <button
          onClick={signInWithGitHub}
          className="px-6 py-3 bg-neutral-800 text-neutral-100 rounded-lg hover:bg-neutral-700 transition-colors"
        >
          Sign in with GitHub
        </button>
        {error && (
          <p className="text-sm text-red-400 max-w-xs mx-auto">{error}</p>
        )}
      </div>
    </main>
  )
}
