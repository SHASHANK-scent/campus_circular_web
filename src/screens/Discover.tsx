import { useMemo, useState } from 'react'
import { ArrowRight, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, money, PageTitle } from '../components/Layout'
import { ResourceImage } from '../components/ResourceImage'
import { VerificationBadge } from '../components/VerificationBadge'
import { isPubliclyListed } from '../lib/verification'
import { useApp } from '../store/AppStore'
import { trustScore } from '../lib/trust'
const cats = [
  'Camera & Video',
  'Audio',
  'Computing',
  'Books',
  'Sports',
  'Tools',
  'Music',
  'Event & Decor',
  'Lab & Electronics',
] as const
export const Discover = () => {
  const { state } = useApp()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const [sort, setSort] = useState('Best match')
  const navigate = useNavigate()
  const resources = useMemo(
    () =>
      state.resources
        .filter(
          (item) =>
            isPubliclyListed(item) &&
            (category === 'All categories' || item.category === category),
        )
        .sort((a, b) =>
          sort === 'Nearest'
            ? a.distanceMeters - b.distanceMeters
            : sort === 'Cheapest'
              ? a.dailyCharge - b.dailyCharge
              : sort === 'Highest rated'
                ? b.rating - a.rating
                : b.timesBorrowed - a.timesBorrowed,
        ),
    [state.resources, category, sort],
  )
  return (
    <>
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-7 py-12 text-white md:px-12">
        <div className="absolute -right-16 -top-28 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <Badge tone="green">A better way to borrow</Badge>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
            What can your campus
            <br />
            <span className="text-emerald-300">share with you?</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">
            Find the things you need from people nearby — priced fairly, trusted by your community.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              navigate(`/need?q=${encodeURIComponent(query)}`)
            }}
            className="mt-7 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl"
          >
            <Search className="ml-3 h-5 w-5 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try “I need to make a reel tomorrow”"
              className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-slate-900 outline-none"
            />
            <button className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white hover:bg-emerald-700">
              Find a kit <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
            </button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-slate-300">
            <span>Popular:</span>
            {['Camera kits', 'Projectors', 'Camping gear'].map((item) => (
              <button
                key={item}
                onClick={() => {
                  setQuery(`I need ${item.toLowerCase()}`)
                  navigate(`/need?q=${encodeURIComponent(`I need ${item.toLowerCase()}`)}`)
                }}
                className="underline decoration-slate-500 underline-offset-4"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>
      <PageTitle eyebrow="Explore the circular campus" title="Find what you need">
        <Link to="/need" className="flex items-center gap-2 text-sm font-bold text-emerald-700">
          Need something specific? <ArrowRight className="h-4 w-4" />
        </Link>
      </PageTitle>
      <div className="mb-8 flex gap-3 overflow-x-auto pb-1">
        {cats.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`whitespace-nowrap rounded-xl border px-4 py-3 text-xs font-bold ${category === cat ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'}`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid gap-7 lg:grid-cols-[210px_1fr]">
        <aside className="hidden rounded-2xl border border-slate-200 bg-white p-5 lg:block">
          <div className="mb-5 flex items-center gap-2 text-sm font-extrabold">
            <SlidersHorizontal className="h-4 w-4 text-emerald-600" /> Filters
          </div>
          <label className="text-[11px] font-bold text-slate-500">Category</label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mb-5 mt-2 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs"
          >
            <option>All categories</option>
            {cats.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
          <label className="text-[11px] font-bold text-slate-500">Max distance</label>
          <input type="range" className="mt-3 w-full accent-emerald-600" />
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            <span>Nearby</span>
            <span>2 km</span>
          </div>
          <label className="mt-5 block text-[11px] font-bold text-slate-500">Condition</label>
          {['Like New', 'Good', 'Fair'].map((condition) => (
            <label className="mt-3 flex items-center gap-2 text-xs text-slate-600" key={condition}>
              <input type="checkbox" defaultChecked className="accent-emerald-600" />
              {condition}
            </label>
          ))}
          <div className="mt-6 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
            <Sparkles className="mb-1 h-4 w-4" />
            Tip: describe your need naturally and we'll build a kit.
          </div>
        </aside>
        <section>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              <strong className="text-slate-900">{resources.length}</strong> resources nearby
            </p>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
            >
              <option>Best match</option>
              <option>Nearest</option>
              <option>Cheapest</option>
              <option>Highest rated</option>
            </select>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => (
              <Link
                to={`/item/${resource.id}`}
                key={resource.id}
                className="group rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <ResourceImage resource={resource} />
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-extrabold leading-5 group-hover:text-emerald-700">
                      {resource.title}
                    </h3>
                    <Badge tone={resource.condition === 'Like New' ? 'green' : 'slate'}>
                      {resource.condition}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <VerificationBadge resource={resource} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {resource.location} · {resource.distanceMeters}m away
                  </p>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <span className="text-base font-black">{money(resource.dailyCharge)}</span>
                      <span className="text-[11px] text-slate-400"> / day</span>
                      <span className="ml-2 text-[10px] font-semibold text-slate-500">
                        + {money(resource.deposit)} deposit
                      </span>
                    </div>
                    <Badge tone={resource.availability.status === 'Available' ? 'green' : 'amber'}>
                      {resource.availability.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                    <span className="rounded-full bg-amber-50 px-2 py-1 font-bold text-amber-700">
                      ★ {resource.rating.toFixed(1)}
                    </span>
                    <span>
                      Trust {(() => {
                        const owner = state.users.find((user) => user.id === resource.ownerId)
                        return owner ? trustScore(owner, state.exchanges) : 0
                      })()}
                    </span>
                    <span className="ml-auto">{resource.timesBorrowed} borrows</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
