import { ArrowRight, CalendarClock, CircleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Exchange, Resource, User } from '../data/types'
import { formatDate, formatRelative } from '../lib/clock'
import { Badge, money } from './Layout'
import { ResourceImage } from './ResourceImage'

export const ExchangeCard = ({
  exchange,
  resource,
  otherParty,
  now,
}: {
  exchange: Exchange
  resource: Resource
  otherParty: User | undefined
  now: string
}) => {
  const overdue =
    exchange.status === 'Return Due' ||
    (exchange.status === 'Borrowed' &&
      new Date(exchange.plan.dueAt).getTime() < new Date(now).getTime())
  return (
    <Link
      to={`/exchanges/${exchange.id}`}
      className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <ResourceImage resource={resource} small />
      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="truncate text-sm font-extrabold group-hover:text-emerald-700">
              {resource.title}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {exchange.plan.mode} · {exchange.plan.units} unit
              {exchange.plan.units > 1 ? 's' : ''} · {formatDate(exchange.plan.startAt)}
            </p>
          </div>
          <Badge tone={overdue ? 'rose' : exchange.status === 'Rated' ? 'green' : 'amber'}>
            {overdue && <CircleAlert className="mr-1 inline h-3 w-3" />}
            {exchange.status}
          </Badge>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className={overdue ? 'font-bold text-rose-600' : 'text-slate-500'}>
            <CalendarClock className="mr-1 inline h-3.5 w-3.5" />
            {exchange.status === 'Borrowed' || exchange.status === 'Return Due'
              ? formatRelative(exchange.plan.dueAt, now)
              : otherParty
                ? `With ${otherParty.name}`
                : 'Campus exchange'}
          </span>
          <span className="text-right text-[10px] leading-4 text-slate-500">
            <span className="block">Borrowing Charge {money(exchange.charges.borrowFee)}</span>
            <span className="block">Platform Fee {money(exchange.charges.platformFee)}</span>
            <span className="block">Security Deposit {money(exchange.charges.deposit)}</span>
            <strong className="block text-xs text-emerald-700">
              Transaction Amount{' '}
              {money(
                exchange.charges.borrowFee +
                  exchange.charges.platformFee +
                  exchange.charges.deposit,
              )}
              <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
            </strong>
          </span>
        </div>
      </div>
    </Link>
  )
}
