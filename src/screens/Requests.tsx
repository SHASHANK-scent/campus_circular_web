import { useMemo, useState } from 'react'
import { ArrowLeft, HandHelping, Plus, Send } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Category, CommunityRequest } from '../data/types'
import { Badge, PageTitle } from '../components/Layout'
import { useApp } from '../store/AppStore'
import { isPubliclyListed } from '../lib/verification'

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

export const Requests = () => {
  const { state, dispatch } = useApp()
  const [params] = useSearchParams()
  const current = state.users.find((user) => user.id === state.currentUserId) ?? state.users[0]
  const [showNew, setShowNew] = useState(Boolean(params.get('text')))
  const [text, setText] = useState(params.get('text') ?? '')
  const [category, setCategory] = useState<Category>('Camera & Video')
  const [responseFor, setResponseFor] = useState<string | null>(null)
  const [resourceId, setResourceId] = useState(
    state.resources.find((resource) => resource.ownerId === current.id)?.id ?? '',
  )
  const [note, setNote] = useState('I can lend this from the listed location.')
  const ownResources = useMemo(
    () =>
      state.resources.filter(
        (resource) => resource.ownerId === current.id && isPubliclyListed(resource),
      ),
    [current.id, state.resources],
  )
  const postRequest = () => {
    if (!text.trim()) return
    const request: CommunityRequest = {
      id: `req-${state.requests.length + 1}`,
      byUserId: current.id,
      text: text.trim(),
      category,
      neededFrom: state.simulatedNow,
      neededTo: new Date(new Date(state.simulatedNow).getTime() + 86400000).toISOString(),
      status: 'Open',
      responses: [],
    }
    dispatch({ type: 'createRequest', request })
    setText('')
    setShowNew(false)
  }
  return (
    <>
      <Link
        to="/need"
        className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-500"
      >
        <ArrowLeft className="h-4 w-4" /> Back to need discovery
      </Link>
      <PageTitle eyebrow="Ask the campus" title="Community requests">
        <button
          onClick={() => setShowNew(!showNew)}
          className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white"
        >
          <Plus className="mr-1 inline h-4 w-4" /> Post a request
        </button>
      </PageTitle>
      {showNew && (
        <div className="mb-7 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
          <h2 className="text-lg font-black">What does your community need?</h2>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="field mt-4 min-h-24 bg-white"
            placeholder="Describe the item and when you need it"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as Category)}
              className="field max-w-xs bg-white"
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button
              onClick={postRequest}
              className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white"
            >
              Publish request
            </button>
          </div>
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        {state.requests
          .filter((request) => request.status === 'Open')
          .map((request) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              key={request.id}
            >
              <div className="flex items-start justify-between gap-3">
                <Badge tone="green">Open request</Badge>
                <span className="text-[11px] text-slate-400">
                  {request.responses.length} offer(s)
                </span>
              </div>
              <h2 className="mt-4 text-lg font-black">{request.text}</h2>
              <p className="mt-2 text-xs text-slate-500">
                Posted by{' '}
                {state.users.find((user) => user.id === request.byUserId)?.name ?? 'student'} ·
                Needed from {new Date(request.neededFrom).toLocaleDateString('en-IN')}
              </p>
              {request.responses.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  {request.responses.map((response) => (
                    <p
                      className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800"
                      key={`${response.userId}-${response.resourceId}`}
                    >
                      <strong>
                        {state.users.find((user) => user.id === response.userId)?.name}
                      </strong>
                      : {response.note}
                    </p>
                  ))}
                </div>
              )}
              {request.byUserId !== current.id && ownResources.length > 0 && (
                <>
                  <button
                    onClick={() => setResponseFor(responseFor === request.id ? null : request.id)}
                    className="mt-5 rounded-xl border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-700"
                  >
                    <HandHelping className="mr-1 inline h-4 w-4" /> I can lend this
                  </button>
                  {responseFor === request.id && (
                    <div className="mt-3 rounded-xl bg-slate-50 p-3">
                      <select
                        value={resourceId}
                        onChange={(event) => setResourceId(event.target.value)}
                        className="field bg-white"
                      >
                        {ownResources.map((resource) => (
                          <option value={resource.id} key={resource.id}>
                            {resource.title}
                          </option>
                        ))}
                      </select>
                      <input
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        className="field mt-2 bg-white"
                      />
                      <button
                        onClick={() => {
                          dispatch({
                            type: 'respondRequest',
                            requestId: request.id,
                            resourceId,
                            note,
                          })
                          setResponseFor(null)
                        }}
                        className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                      >
                        <Send className="mr-1 inline h-3.5 w-3.5" /> Send offer
                      </button>
                    </div>
                  )}
                </>
              )}
            </article>
          ))}
      </div>
    </>
  )
}
