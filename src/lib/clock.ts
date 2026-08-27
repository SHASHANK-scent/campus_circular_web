export const simulatedNow = (stateNow?: string): Date => new Date(stateNow ?? '2025-03-15T10:00:00+05:30')
export const advanceClock = (current: string, hours: number): string => new Date(new Date(current).getTime() + hours * 3600000).toISOString()
export const formatRelative = (date: string, current: string): string => {
  const diff = new Date(date).getTime() - new Date(current).getTime()
  const hours = Math.round(Math.abs(diff) / 3600000)
  if (hours < 24) return diff >= 0 ? `in ${hours}h` : `${hours}h overdue`
  const days = Math.round(hours / 24)
  return diff >= 0 ? `in ${days}d` : `${days}d overdue`
}
export const formatDate = (date: string): string => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
