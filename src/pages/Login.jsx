import { supabase } from '../lib/supabase'

export default function Login() {
  async function signInWithGitHub() {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
      },
    })
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
      </div>
    </main>
  )
}
