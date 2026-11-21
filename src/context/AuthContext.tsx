import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Coach, Player, Profile } from '../lib/types'
import { fetchMyChildren } from '../lib/data'

interface AuthState {
  configured: boolean
  loading: boolean
  user: User | null
  profile: Profile | null
  coach: Coach | null
  /** Players linked to the signed-in parent (empty for admin/coach). */
  children: Player[]
  profileError: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthCtx = createContext<AuthState>({
  configured: isSupabaseConfigured,
  loading: true,
  user: null,
  profile: null,
  coach: null,
  children: [],
  profileError: null,
  signIn: async () => ({ error: 'Supabase is not configured yet.' }),
  signOut: async () => {},
  refresh: async () => {},
})

export function useAuth() {
  return useContext(AuthCtx)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [coach, setCoach] = useState<Coach | null>(null)
  const [linkedChildren, setLinkedChildren] = useState<Player[]>([])
  const [profileError, setProfileError] = useState<string | null>(null)

  const loadProfile = useCallback(async (uid: string) => {
    if (!supabase) return
    setProfileError(null)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()
    if (error || !data) {
      setProfile(null)
      setCoach(null)
      setLinkedChildren([])
      setProfileError(
        'Your login works, but no profile is linked to this account yet. Ask the academy admin to finish setting up your account.',
      )
      return
    }
    setProfile(data as Profile)
    if ((data as Profile).role === 'coach') {
      const { data: coachRow } = await supabase
        .from('coaches')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle()
      setCoach((coachRow as Coach | null) ?? null)
      setLinkedChildren([])
    } else if ((data as Profile).role === 'parent') {
      setCoach(null)
      try {
        setLinkedChildren(await fetchMyChildren(uid))
      } catch {
        setLinkedChildren([])
      }
    } else {
      setCoach(null)
      setLinkedChildren([])
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const current = session?.user ?? null
    setUser(current)
    if (current) await loadProfile(current.id)
    setLoading(false)
  }, [loadProfile])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    refresh()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const current = session?.user ?? null
      setUser(current)
      if (current) {
        void loadProfile(current.id)
      } else {
        setProfile(null)
        setCoach(null)
        setLinkedChildren([])
        setProfileError(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [refresh, loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase is not configured yet.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setCoach(null)
    setLinkedChildren([])
  }, [])

  return (
    <AuthCtx.Provider
      value={{
        configured: isSupabaseConfigured,
        loading,
        user,
        profile,
        coach,
        children: linkedChildren,
        profileError,
        signIn,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthCtx.Provider>
  )
}
