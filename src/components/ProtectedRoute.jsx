import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    // Subscribe first so we never miss SIGNED_IN firing during PKCE exchange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // If there's an OAuth code in the URL, wait — onAuthStateChange will fire once exchange completes
    const hasOAuthCode = new URLSearchParams(window.location.search).has('code')
    if (!hasOAuthCode) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
      })
    }

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null // loading
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}
