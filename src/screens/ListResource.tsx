import { useState } from 'react'
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, PackagePlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type { Category, Condition, Resource } from '../data/types'
import { imageToDataUrl } from '../lib/photos'
import { newResourceVerification, STANDARD_CHECKS } from '../lib/verification'
import { Badge, money, PageTitle } from '../components/Layout'
import { ResourceImage } from '../components/ResourceImage'
import { useApp } from '../store/AppStore'

const categories: Category[] = [
  'Camera & Video',
  'Audio',
  'Computing',
  'Books',
  'Sports',
  'Tools',
  'Music',
  'Event & Decor',
  'Lab & Electronics',
]

export const ListResource = () => {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const current = state.users.find((user) => user.id === state.currentUserId) ?? state.users[0]
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('My shared campus resource')
  const [category, setCategory] = useState<Category>('Camera & Video')
  const [description, setDescription] = useState(
    'A well-maintained item ready to help another student.',
  )
  const [condition, setCondition] = useState<Condition>('Good')
  const [hourlyCharge, setHourlyCharge] = useState(20)
  const [dailyCharge, setDailyCharge] = useState(100)
  const [minimumCharge, setMinimumCharge] = useState(40)
  const [deposit, setDeposit] = useState(300)
  const [accessories, setAccessories] = useState('Protective case, Quick-start guide')
  const [conditions, setConditions] = useState('Keep indoors and return with all accessories')
  const [photos, setPhotos] = useState<string[]>([])
  const [error, setError] = useState('')
  const addPhoto = async (file: File) => {
    try {
      const photo = await imageToDataUrl(file)
      setPhotos((items) => [...items, photo].slice(0, 3))
      setError('')
    } catch {
      setError('That image could not be processed.')
    }
  }
  const save = () => {
    const resource: Resource = {
      id: `r-custom-${state.resources.length + 1}`,
      title,
      category,
      description,
      images: photos,
      ownerId: current.id,
      condition,
      accessories: accessories
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      location: current.hostel,
      distanceMeters: 0,
      hourlyCharge,
      dailyCharge,
      retailValue: Math.max(1000, dailyCharge * 12),
      minimumCharge,
      deposit,
      lateFeePerHour: 15,
      availability: { status: 'Available', blockedRanges: [] },
      borrowingConditions: conditions
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      rating: 0,
      timesBorrowed: 0,
      approvalStatus: 'Pending',
      verification: newResourceVerification(state.simulatedNow),
      flagged: false,
      history: [],
      tags: [title.toLowerCase(), category.toLowerCase()],
    }
    dispatch({ type: 'createResource', resource })
    navigate('/profile/' + current.id)
  }
  return (
    <>
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-500">
        <ArrowLeft className="h-4 w-4" /> Back to discover
      </Link>
      <PageTitle eyebrow="Grow the sharing library" title="List a resource">
        <Badge tone="amber">
          <PackagePlus className="mr-1 inline h-3.5 w-3.5" /> Equipment check required
        </Badge>
      </PageTitle>
      <div className="grid gap-7 lg:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            {[1, 2, 3, 4].map((item) => (
              <div className="flex flex-1 items-center gap-2" key={item}>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                    item <= step ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {item < step ? <CheckCircle2 className="h-4 w-4" /> : item}
                </span>
                <span className="hidden text-[11px] font-bold text-slate-500 sm:block">
                  {['Details', 'Charges', 'Conditions', 'Photos'][item - 1]}
                </span>
                {item < 4 && <span className="h-px flex-1 bg-slate-200" />}
              </div>
            ))}
          </div>
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-600">
                Resource name
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="field"
                />
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Category
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as Category)}
                  className="field"
                >
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="field min-h-28"
                />
              </label>
            </div>
          )}
          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Hourly charge', hourlyCharge, setHourlyCharge],
                ['Daily charge', dailyCharge, setDailyCharge],
                ['Minimum charge', minimumCharge, setMinimumCharge],
                ['Refundable deposit', deposit, setDeposit],
              ].map(([label, value, setter]) => (
                <label className="block text-xs font-bold text-slate-600" key={label as string}>
                  {label as string}
                  <input
                    type="number"
                    min="0"
                    value={value as number}
                    onChange={(event) =>
                      (setter as (value: number) => void)(Number(event.target.value))
                    }
                    className="field"
                  />
                </label>
              ))}
              <p className="sm:col-span-2 text-[11px] text-slate-500">
                Deposits stay refundable after a clean return. Platform fees are calculated when a
                borrower requests.
              </p>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-600">
                Condition
                <select
                  value={condition}
                  onChange={(event) => setCondition(event.target.value as Condition)}
                  className="field"
                >
                  {['Like New', 'Good', 'Fair', 'Worn'].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Included accessories{' '}
                <span className="font-normal text-slate-400">(comma separated)</span>
                <input
                  value={accessories}
                  onChange={(event) => setAccessories(event.target.value)}
                  className="field"
                />
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Borrowing conditions{' '}
                <span className="font-normal text-slate-400">(one per line)</span>
                <textarea
                  value={conditions}
                  onChange={(event) => setConditions(event.target.value)}
                  className="field min-h-28"
                />
              </label>
            </div>
          )}
          {step === 4 && (
            <div>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-10 text-sm font-bold text-emerald-700">
                <Camera className="h-5 w-5" /> Add up to three photos
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
                <p className="mt-3 text-xs text-emerald-700">
                  {photos.length} photo(s) ready to save
                </p>
              )}
              {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
            </div>
          )}
          <div className="mt-7 flex justify-between border-t border-slate-100 pt-5">
            <button
              disabled={step === 1}
              onClick={() => setStep(step - 1)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold disabled:opacity-40"
            >
              Back
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white"
              >
                Continue <ArrowRight className="ml-1 inline h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={save}
                className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white"
              >
                Submit for equipment check
              </button>
            )}
          </div>
        </section>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            Live preview
          </p>
          <ResourceImage resource={{ title, category }} />
          <div className="p-2">
            <h2 className="font-black">{title || 'Your resource name'}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {category} · {condition}
            </p>
            <p className="mt-4 text-lg font-black text-emerald-700">
              {money(dailyCharge)} <span className="text-xs font-normal text-slate-400">/ day</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-500">+ {money(deposit)} refundable deposit</p>
          </div>
          <div className="mt-3 rounded-xl bg-amber-50 p-4 text-[11px] leading-5 text-amber-800">
            <p className="font-bold">Before it goes live</p>
            <p className="mt-1">
              A campus verifier physically checks the full equipment. Your listing stays private
              until every point below passes.
            </p>
            <ul className="mt-2 space-y-1">
              {STANDARD_CHECKS.map((check) => (
                <li key={check}>· {check}</li>
              ))}
            </ul>
            <p className="mt-2">You can follow its progress from your profile listings.</p>
          </div>
        </aside>
      </div>
    </>
  )
}
