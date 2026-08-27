import { useState } from 'react'
import { Camera, CheckCircle2 } from 'lucide-react'
import type { Condition, ConditionReport } from '../data/types'
import { imageToDataUrl } from '../lib/photos'
import { useApp } from '../store/AppStore'

const checklistLabels = [
  'Body and surfaces',
  'Power / cables',
  'Buttons and controls',
  'Accessories',
]

export const ConditionForm = ({
  onSave,
  heading,
}: {
  onSave: (report: ConditionReport) => void
  heading: string
}) => {
  const { state } = useApp()
  const [overall, setOverall] = useState<Condition>('Good')
  const [checks, setChecks] = useState(checklistLabels.map((label) => ({ label, ok: true })))
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [error, setError] = useState('')
  const addPhoto = async (file: File) => {
    try {
      const photo = await imageToDataUrl(file)
      setPhotos((current) => [...current, photo].slice(0, 3))
      setError('')
    } catch {
      setError('That image could not be processed. Try another photo.')
    }
  }
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
      <h3 className="text-lg font-black">{heading}</h3>
      <p className="mt-1 text-xs text-slate-500">
        Check each part together. Photos are resized before being saved locally.
      </p>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <p className="text-xs font-bold text-slate-500">Checklist</p>
          <div className="mt-2 space-y-2">
            {checks.map((check, index) => (
              <label
                className="flex items-center gap-3 rounded-xl bg-white p-3 text-xs font-semibold"
                key={check.label}
              >
                <input
                  type="checkbox"
                  checked={check.ok}
                  onChange={(event) =>
                    setChecks((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, ok: event.target.checked } : item,
                      ),
                    )
                  }
                  className="h-4 w-4 accent-emerald-600"
                />
                {check.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500">Overall condition</label>
          <select
            value={overall}
            onChange={(event) => setOverall(event.target.value as Condition)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs"
          >
            {['Like New', 'Good', 'Fair', 'Worn'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <label className="mt-4 block text-xs font-bold text-slate-500">Notes</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Anything the next person should know?"
            className="mt-2 min-h-20 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none"
          />
          <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-white p-3 text-xs font-bold text-emerald-700">
            <Camera className="h-4 w-4" />
            Add condition photos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                void Promise.all(Array.from(event.target.files ?? []).map(addPhoto))
              }}
              className="hidden"
            />
          </label>
          {photos.length > 0 && (
            <p className="mt-2 text-[11px] text-slate-500">
              <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />
              {photos.length} photo{photos.length > 1 ? 's' : ''} ready
            </p>
          )}
          {error && <p className="mt-2 text-[11px] text-rose-600">{error}</p>}
        </div>
      </div>
      <button
        onClick={() =>
          onSave({
            at: state.simulatedNow,
            by: state.currentUserId,
            overall,
            checklist: checks,
            photos,
            notes,
          })
        }
        className="mt-5 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white hover:bg-emerald-700"
      >
        Save condition report
      </button>
    </div>
  )
}
