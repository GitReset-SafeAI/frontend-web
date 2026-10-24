import { createContext, useContext } from 'react'

import type { LogInInput, SignUpInput, User } from '../../services/contracts'

export interface AuthContextValue {
  // `loading` only until the first session check resolves.
  status: 'loading' | 'ready'
  user: User | null
  logIn: (input: LogInInput) => Promise<User>
  signUp: (input: SignUpInput) => Promise<User>
  logOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
