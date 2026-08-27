import {
  Camera,
  Dumbbell,
  FlaskConical,
  Headphones,
  Laptop,
  Music2,
  Package,
  Wrench,
} from 'lucide-react'
import type { Resource } from '../data/types'
const icons = {
  'Camera & Video': Camera,
  Audio: Headphones,
  Computing: Laptop,
  Books: Package,
  Sports: Dumbbell,
  Tools: Wrench,
  Music: Music2,
  'Event & Decor': Package,
  'Lab & Electronics': FlaskConical,
}
const gradients = [
  'from-emerald-100 via-teal-50 to-slate-100',
  'from-amber-100 via-orange-50 to-rose-50',
  'from-sky-100 via-indigo-50 to-violet-50',
  'from-fuchsia-100 via-pink-50 to-orange-50',
]
export const ResourceImage = ({
  resource,
  small = false,
}: {
  resource: Resource
  small?: boolean
}) => {
  const Icon = icons[resource.category]
  const gradient =
    gradients[Number((resource.id ?? resource.title).replace(/\D/g, '') || 0) % gradients.length]
  return (
    <div
      className={`relative flex ${small ? 'h-20 w-20 rounded-lg' : 'h-52 rounded-xl'} items-center justify-center overflow-hidden bg-gradient-to-br ${gradient}`}
    >
      <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/30" />
      {resource.images[0] ? (
        <img src={resource.images[0]} alt={resource.title} className="h-full w-full object-cover" />
      ) : (
        <Icon
          className={`${small ? 'h-8 w-8' : 'h-16 w-16'} text-slate-700/45`}
          strokeWidth={1.2}
        />
      )}
      <span className="absolute bottom-3 left-3 rounded-full bg-white/65 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        {resource.category}
      </span>
    </div>
  )
}
