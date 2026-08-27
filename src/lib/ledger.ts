import type { AppState, Exchange, Fine } from '../data/types'

export interface LedgerRow {
  exchange: Exchange
  title: string
  owner: string
  borrower: string
  handedOverAt: string
  dueAt: string
  returnedAt?: string
  stillOut: boolean
  overdue: boolean
  lateByHours: number
  conditionBefore?: string
  conditionAfter?: string
  fines: Fine[]
  refunded: number
  outstanding: number
}
export interface LedgerSummary {
  currentlyOut: number
  overdueNow: number
  returnedOnTime: number
  returnedLate: number
  finesIssued: number
  finesCollected: number
}

const completedStatuses = ['Handover', 'Borrowed', 'Return Due', 'Returned', 'Inspection', 'Settlement', 'Rated']

export const ledgerRows = (state: AppState): LedgerRow[] =>
  state.exchanges
    .filter((exchange) => completedStatuses.includes(exchange.status))
    .map((exchange) => {
      const due = new Date(exchange.plan.dueAt).getTime()
      const returned = exchange.returnedAt ? new Date(exchange.returnedAt).getTime() : undefined
      const lateByHours = returned === undefined ? Math.max(0, Math.ceil((new Date(state.simulatedNow).getTime() - due) / 3600000)) : Math.max(0, Math.ceil((returned - due) / 3600000))
      return {
        exchange,
        title: state.resources.find((resource) => resource.id === exchange.resourceId)?.title ?? exchange.resourceId,
        owner: state.users.find((user) => user.id === exchange.ownerId)?.name ?? exchange.ownerId,
        borrower: state.users.find((user) => user.id === exchange.borrowerId)?.name ?? exchange.borrowerId,
        handedOverAt: exchange.timeline.find((entry) => entry.status === 'Handover')?.at ?? exchange.plan.startAt,
        dueAt: exchange.plan.dueAt,
        returnedAt: exchange.returnedAt,
        stillOut: !exchange.returnedAt,
        overdue: !exchange.returnedAt && new Date(state.simulatedNow).getTime() > due,
        lateByHours,
        conditionBefore: exchange.before?.overall,
        conditionAfter: exchange.after?.overall,
        fines: exchange.fines,
        refunded: exchange.payment.refund?.amount ?? 0,
        outstanding: exchange.payment.outstanding?.status === 'Due' ? exchange.payment.outstanding.amount : 0,
      }
    })
    .sort((a, b) => Number(b.overdue) - Number(a.overdue) || b.dueAt.localeCompare(a.dueAt))

export const ledgerSummary = (state: AppState): LedgerSummary => {
  const rows = ledgerRows(state)
  return {
    currentlyOut: rows.filter((row) => row.stillOut).length,
    overdueNow: rows.filter((row) => row.overdue).length,
    returnedOnTime: rows.filter((row) => !row.stillOut && row.lateByHours === 0).length,
    returnedLate: rows.filter((row) => !row.stillOut && row.lateByHours > 0).length,
    finesIssued: rows.reduce((sum, row) => sum + row.fines.filter((fine) => fine.status !== 'Waived').reduce((total, fine) => total + fine.amount, 0), 0),
    finesCollected: rows.reduce((sum, row) => sum + row.fines.filter((fine) => fine.status === 'Settled').reduce((total, fine) => total + fine.amount, 0), 0),
  }
}
