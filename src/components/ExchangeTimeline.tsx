import { Check } from 'lucide-react'
import type { Exchange, ExchangeStatus } from '../data/types'
import { formatDate } from '../lib/clock'

const steps: (ExchangeStatus | 'Available')[] = [
  'Available',
  'Requested',
  'Accepted',
  'Handover',
  'Borrowed',
  'Return Due',
  'Returned',
  'Inspection',
  'Settlement',
  'Rated',
]

export const ExchangeTimeline = ({ exchange }: { exchange: Exchange }) => {
  const currentIndex = Math.max(0, steps.indexOf(exchange.status))
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex min-w-[850px] items-start">
        {steps.map((step, index) => {
          const complete = index < currentIndex
          const current = index === currentIndex
          const timestamp =
            step === 'Available'
              ? undefined
              : exchange.timeline.find((entry) => entry.status === step)?.at
          return (
            <div className="flex flex-1 items-start" key={step}>
              <div className="flex min-w-20 flex-col items-center text-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                    complete
                      ? 'bg-emerald-600 text-white'
                      : current
                        ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {complete ? <Check className="h-4 w-4" /> : index}
                </span>
                <span className="mt-2 text-[10px] font-bold text-slate-600">{step}</span>
                {timestamp && (
                  <span className="mt-1 text-[9px] text-slate-400">{formatDate(timestamp)}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <span
                  className={`mt-4 h-0.5 flex-1 ${
                    index < currentIndex ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
