import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ExchangeMainPanel } from '../components/ExchangeMainPanel'
import { ExchangeSidebar } from '../components/ExchangeSidebar'
import { ExchangeTimeline } from '../components/ExchangeTimeline'
import { Badge, PageTitle } from '../components/Layout'
import { roleFor } from '../lib/lifecycle'
import { useApp } from '../store/AppStore'

export const ExchangeDetail = () => {
  const { id } = useParams()
  const { state, dispatch } = useApp()
  const exchange = state.exchanges.find((item) => item.id === id)
  const resource = exchange
    ? state.resources.find((item) => item.id === exchange.resourceId)
    : undefined
  if (!exchange || !resource) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
        Exchange not found.
      </div>
    )
  }
  const role = roleFor(exchange, state.currentUserId)
  return (
    <>
      <Link
        to="/exchanges"
        className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-500"
      >
        <ArrowLeft className="h-4 w-4" /> Back to exchanges
      </Link>
      <PageTitle eyebrow="Exchange lifecycle" title={resource.title}>
        <Badge tone={exchange.status === 'Return Due' ? 'rose' : 'green'}>{exchange.status}</Badge>
      </PageTitle>
      <ExchangeTimeline exchange={exchange} />
      <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_360px]">
        <ExchangeMainPanel
          exchange={exchange}
          resource={resource}
          config={state.config}
          role={role}
          now={state.simulatedNow}
          dispatch={dispatch}
        />
        <ExchangeSidebar
          exchange={exchange}
          resource={resource}
          config={state.config}
          role={role}
          now={state.simulatedNow}
          dispatch={dispatch}
        />
      </div>
    </>
  )
}
