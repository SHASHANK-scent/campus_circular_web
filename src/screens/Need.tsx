import { useMemo, useState } from 'react'
import { Check, Clock3, Info, Send, Sparkles } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, money, PageTitle } from '../components/Layout'
import { KitSlotCard } from '../components/KitSlotCard'
import { formatDate } from '../lib/clock'
import { matchIntent, parseIntent, type Recommendation } from '../lib/matching'
import { calculatePricing } from '../lib/pricing'
import { useApp } from '../store/AppStore'
export const Need = () => {
  const { state } = useApp()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [text, setText] = useState(
    params.get('q') ?? 'I need to make a reel for my club event tomorrow',
  )
  const [intent, setIntent] = useState(() =>
    parseIntent(
      params.get('q') ?? 'I need to make a reel for my club event tomorrow',
      new Date(state.simulatedNow),
    ),
  )
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const kit = useMemo(
    () => matchIntent(intent, state.resources, state.users),
    [intent, state.resources, state.users],
  )
  const coreKit = kit.slice(0, 5)
  const optionalKit = kit.slice(5)
  const selectedItems = kit
    .map((slot) => slot.recommendation)
    .filter(
      (item, index): item is Recommendation =>
        Boolean(item) &&
        (index < 5 ? selected[item.resource.id] !== false : selected[item.resource.id] === true),
    )
  const total = selectedItems.reduce(
    (sum, item) =>
      sum +
      calculatePricing({
        resource: item.resource,
        mode: intent.mode,
        units: intent.units,
        platform: state.config,
      }).payableUpfront,
    0,
  )
  const submit = (value: string) => {
    setText(value)
    setIntent(parseIntent(value, new Date(state.simulatedNow)))
    setSelected({})
  }
  return (
    <>
      <PageTitle eyebrow="Need-based discovery" title="Describe your need">
        <Badge tone="green">
          <Sparkles className="mr-1 inline h-3 w-3" /> Explainable matching
        </Badge>
      </PageTitle>
      <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-h-32 w-full resize-none text-lg font-semibold leading-8 outline-none"
              placeholder="Tell us what you're planning..."
            />
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <span className="mr-1 text-xs text-slate-400">Try an example:</span>
              {[
                'I need to make a reel for my club event tomorrow',
                'Need a projector for a seminar next week',
                'I want to camp this weekend',
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => submit(example)}
                  className="rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {example}
                </button>
              ))}
            </div>
            <button
              onClick={() => submit(text)}
              className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              Build my kit <Sparkles className="ml-1 inline h-4 w-4" />
            </button>
          </div>
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                  Here's what we understood
                </p>
                <h2 className="mt-2 text-xl font-black">{intent.label}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="green">{intent.categories.join(' · ') || 'Campus essentials'}</Badge>
                  <Badge>
                    <Clock3 className="mr-1 inline h-3 w-3" />
                    {formatDate(intent.startAt)} → {formatDate(intent.dueAt)}
                  </Badge>
                  <Badge>
                    {intent.mode} · {intent.units} {intent.mode === 'hourly' ? 'hours' : 'day(s)'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Your recommended kit
              </p>
              <h2 className="mt-1 text-2xl font-black">Built for your plan</h2>
            </div>
            <span className="text-xs text-slate-500">{coreKit.length} core slots matched</span>
          </div>
          <div className="mt-4 space-y-4">
            {coreKit.map((slot) => (
              <KitSlotCard
                key={slot.tag}
                slot={slot}
                selected={selected}
                setSelected={setSelected}
              />
            ))}
          </div>
          {optionalKit.length > 0 && (
            <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <summary className="cursor-pointer list-none text-sm font-extrabold text-slate-700">
                Optional add-ons{' '}
                <span className="ml-1 text-xs font-normal text-slate-400">
                  ({optionalKit.length})
                </span>
              </summary>
              <div className="mt-4 space-y-4">
                {optionalKit.map((slot) => (
                  <KitSlotCard
                    key={slot.tag}
                    slot={slot}
                    selected={selected}
                    setSelected={setSelected}
                    optional
                  />
                ))}
              </div>
            </details>
          )}
        </section>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Request summary
          </p>
          <h3 className="mt-2 text-lg font-black">Ready to borrow?</h3>
          <div className="mt-5 space-y-3 border-y border-slate-100 py-4 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Items selected</span>
              <strong>{selectedItems.length}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Borrowing charges</span>
              <strong>
                {money(
                  selectedItems.reduce(
                    (sum, item) =>
                      sum +
                      calculatePricing({
                        resource: item.resource,
                        mode: intent.mode,
                        units: intent.units,
                      }).borrowFee,
                    0,
                  ),
                )}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fees + refundable deposits</span>
              <strong>
                {money(
                  total -
                    selectedItems.reduce(
                      (sum, item) =>
                        sum +
                        calculatePricing({
                          resource: item.resource,
                          mode: intent.mode,
                          units: intent.units,
                        }).borrowFee,
                      0,
                    ),
                )}
              </strong>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="font-bold">Transaction total</span>
              <strong className="text-emerald-700">{money(total)}</strong>
            </div>
          </div>
          <p className="text-[11px] leading-5 text-slate-500">
            Each item has a refundable security deposit. You’ll review an agreement per item next.
          </p>
          <button
            disabled={selectedItems.length === 0}
            onClick={() => {
              const queue = selectedItems.map((item) => item.resource.id).join(',')
              navigate(`/agreement/${selectedItems[0]?.resource.id}?queue=${queue}&index=0`)
            }}
            className="mt-5 w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="mr-1 inline h-3.5 w-3.5" /> Request selected items
          </button>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-emerald-700">
            <Check className="h-3.5 w-3.5" /> No payment until owner accepts
          </div>
        </aside>
      </div>
    </>
  )
}
