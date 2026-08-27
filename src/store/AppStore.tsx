import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react'
import { advanceClock } from '../lib/clock'
import { seedState } from '../data/seed'
import type { AppState } from '../data/types'
const KEY = 'cc.state.v1'
type Action = { type: 'advance'; hours: number } | { type: 'reset' } | { type: 'switchUser'; userId: string } | { type: 'admin'; value: boolean }
const initial = (): AppState => { const saved = localStorage.getItem(KEY); return saved ? JSON.parse(saved) as AppState : structuredClone(seedState) }
const reducer = (state: AppState, action: Action): AppState => {
  if (action.type === 'reset') return structuredClone(seedState)
  if (action.type === 'advance') return { ...state, simulatedNow: advanceClock(state.simulatedNow, action.hours) }
  if (action.type === 'switchUser') return { ...state, currentUserId: action.userId }
  return { ...state, isAdmin: action.value }
}
const StoreContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null)
export const AppStore = ({ children }: { children: ReactNode }) => { const [state, dispatch] = useReducer(reducer, undefined, initial); useEffect(() => localStorage.setItem(KEY, JSON.stringify(state)), [state]); return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider> }
export const useApp = () => { const context = useContext(StoreContext); if (!context) throw new Error('useApp must be used inside AppStore'); return context }
