import { useQueryClient } from '@tanstack/react-query'
import { type PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { services } from '../../services'
import type { LogInInput, SignUpInput, User } from '../../services/contracts'
import { queryKeys } from '../../services/queryKeys'
import { ApiError } from '../../services/api/ApiError'
import { toAuthError } from '../../services/auth/supabaseAuth'
import { AuthContext } from './authContext'

interface AuthState {
  status: 'loading' | 'ready'
  user: User | null
  error: ApiError | null
}

// The adapter owns persistence. Revisions prevent stale initialization/action results
// from overwriting newer auth events, including during StrictMode effect replay.
export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null, error: null })
  const revision = useRef(0)
  const mounted = useRef(false)
  const currentUser = useRef<User | null>(null)

  const applyUser = useCallback((user: User | null) => {
    revision.current += 1
    if (currentUser.current?.id !== user?.id || !user) {
      void queryClient.cancelQueries({ queryKey: queryKeys.contacts })
      queryClient.removeQueries({ queryKey: queryKeys.contacts })
    }
    currentUser.current = user
    setState({ status: 'ready', user, error: null })
  }, [queryClient])

  useEffect(() => {
    mounted.current = true
    let active = true
    const initialRevision = ++revision.current
    let unsubscribe: (() => void) | undefined
    const fail = (error: unknown) => {
      if (active && revision.current === initialRevision) {
        setState({ status: 'ready', user: null, error: toAuthError(error) })
      }
    }
    try {
      // Subscribe first so a sign-in/out cannot be lost while restoration is pending.
      unsubscribe = services.auth.subscribe((user) => { if (active) applyUser(user) })
      void services.auth.getSession()
        .then((user) => { if (active && revision.current === initialRevision) applyUser(user) })
        .catch(fail)
    } catch (error) { fail(error) }

    return () => {
      active = false
      mounted.current = false
      revision.current += 1
      unsubscribe?.()
    }
  }, [applyUser])

  const logIn = useCallback(async (input: LogInInput) => {
    const request = ++revision.current
    const user = await services.auth.logIn(input)
    if (!mounted.current) throw new ApiError('unauthorized', 'Authentication was interrupted.')
    if (revision.current === request) applyUser(user)
    else if (currentUser.current?.id !== user.id) throw new ApiError('unauthorized', 'The session changed during login.')
    return user
  }, [applyUser])

  const signUp = useCallback(async (input: SignUpInput) => {
    const request = ++revision.current
    const user = await services.auth.signUp(input)
    if (!mounted.current) throw new ApiError('unauthorized', 'Authentication was interrupted.')
    if (revision.current === request) applyUser(user)
    else if (currentUser.current?.id !== user.id) throw new ApiError('unauthorized', 'The session changed during signup.')
    return user
  }, [applyUser])

  const logOut = useCallback(async () => {
    const request = ++revision.current
    await services.auth.logOut()
    if (mounted.current && revision.current === request) applyUser(null)
  }, [applyUser])

  const value = useMemo(() => ({ ...state, logIn, signUp, logOut }), [state, logIn, signUp, logOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
