import { useMemo, useState } from 'react'
import { ArrowRight, Inbox, PackageCheck, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ExchangeCard } from '../components/ExchangeCard'
import { Badge, PageTitle } from '../components/Layout'
import { useApp } from '../store/AppStore'

type Tab = 'Borrowing' | 'Lending' | 'Requests I posted'

export const Exchanges = () => {
  const { state } = useApp()
  const [tab, setTab] = useState<Tab>('Borrowing')
  const currentId = state.currentUserId
  const exchanges = useMemo(() => {
    if (tab === 'Borrowing') {
      return state.exchanges.filter((exchange) => exchange.borrowerId === currentId)
    }
    if (tab === 'Lending')
      return state.exchanges.filter((exchange) => exchange.ownerId === currentId)
    return []
  }, [currentId, state.exchanges, tab])
  return (
    <>
      <PageTitle eyebrow="Your campus activity" title="My exchanges">
        <Link
          to="/need"
          className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white hover:bg-emerald-700"
        >
          Find something to borrow
        </Link>
      </PageTitle>
      <div className="mb-7 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {(['Borrowing', 'Lending', 'Requests I posted'] as Tab[]).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-xs font-bold ${
              tab === item ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {item === 'Borrowing' ? (
              <Inbox className="h-4 w-4" />
            ) : item === 'Lending' ? (
              <PackageCheck className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {item}
            <span className="rounded-full bg-black/10 px-1.5 py-0.5">
              {item === 'Requests I posted'
                ? state.requests.filter((request) => request.byUserId === currentId).length
                : exchanges.length}
            </span>
          </button>
        ))}
      </div>
      {tab !== 'Requests I posted' ? (
        <div className="grid gap-4 md:grid-cols-2">
          {exchanges.map((exchange) => {
            const resource = state.resources.find((item) => item.id === exchange.resourceId)
            if (!resource) return null
            const otherId = tab === 'Borrowing' ? exchange.ownerId : exchange.borrowerId
            return (
              <ExchangeCard
                key={exchange.id}
                exchange={exchange}
                resource={resource}
                otherParty={state.users.find((user) => user.id === otherId)}
                now={state.simulatedNow}
              />
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {state.requests
            .filter((request) => request.byUserId === currentId)
            .map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge tone={request.status === 'Open' ? 'green' : 'slate'}>
                      {request.status}
                    </Badge>
                    <h2 className="mt-3 text-base font-extrabold">{request.text}</h2>
                    <p className="mt-2 text-xs text-slate-500">
                      {request.responses.length} response
                      {request.responses.length === 1 ? '' : 's'} from the community
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300" />
                </div>
              </div>
            ))}
        </div>
      )}
      {tab !== 'Requests I posted' && exchanges.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Inbox className="mx-auto h-8 w-8 text-emerald-500" />
          <h2 className="mt-4 text-lg font-black">No exchanges in this view yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Your next useful borrow can start with a natural-language request.
          </p>
        </div>
      )}
    </>
  )
}
