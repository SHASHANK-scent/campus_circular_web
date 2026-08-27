import type { Dispatch, SetStateAction } from 'react'
import { money } from './Layout'
import { ResourceImage } from './ResourceImage'
import type { KitSlot } from '../lib/matching'

interface KitSlotCardProps {
  slot: KitSlot
  selected: Record<string, boolean>
  setSelected: Dispatch<SetStateAction<Record<string, boolean>>>
  optional?: boolean
}

export const KitSlotCard = ({
  slot,
  selected,
  setSelected,
  optional = false,
}: KitSlotCardProps) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Slot</span>
        <h3 className="text-base font-extrabold">{slot.label}</h3>
      </div>
      {slot.recommendation && (
        <label className="flex items-center gap-2 text-xs font-bold text-emerald-700">
          <input
            type="checkbox"
            checked={
              optional
                ? selected[slot.recommendation.resource.id] === true
                : selected[slot.recommendation.resource.id] !== false
            }
            onChange={(event) =>
              setSelected({
                ...selected,
                [slot.recommendation?.resource.id ?? '']: event.target.checked,
              })
            }
            className="h-4 w-4 accent-emerald-600"
          />{' '}
          Include
        </label>
      )}
    </div>
    {slot.recommendation ? (
      <>
        <div className="flex gap-4">
          <ResourceImage resource={slot.recommendation.resource} small />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-extrabold">{slot.recommendation.resource.title}</h4>
                <p className="mt-1 text-xs text-slate-500">
                  {money(slot.recommendation.resource.dailyCharge)} / day ·{' '}
                  {slot.recommendation.resource.distanceMeters}m away
                </p>
              </div>
              <span className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-black text-white">
                {Math.round(slot.recommendation.score)}%
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(slot.recommendation.factors).map(([factor, value]) => (
                <span
                  key={factor}
                  className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600"
                >
                  {factor} +{Math.round(value * 100)}%
                </span>
              ))}
            </div>
          </div>
        </div>
        {slot.alternatives.length > 0 && (
          <p className="mt-3 text-[11px] text-slate-500">
            <strong>Alternatives:</strong>{' '}
            {slot.alternatives.map((alt) => alt.resource.title).join(' · ')}
          </p>
        )}
      </>
    ) : (
      <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
        No exact match. Post a community request and let nearby students help.
      </p>
    )}
  </div>
)
