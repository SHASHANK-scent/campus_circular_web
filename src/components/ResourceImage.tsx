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
import { useEffect, useState } from 'react'
import { resourcePhotos } from '../data/photos'
import type { Resource } from '../data/types'

type ResourceImageData = Partial<Pick<Resource, 'category' | 'id' | 'title' | 'images'>>
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
  resource: ResourceImageData
  small?: boolean
}) => {
  const imageSource = getResourceImageSource(resource)
  const [imageFailed, setImageFailed] = useState(false)
  useEffect(() => {
    setImageFailed(false)
  }, [imageSource])
  const category =
    resource.category && resource.category in icons ? resource.category : 'Event & Decor'
  const Icon = icons[category]
  const gradient = getResourceGradient(resource)
  return (
    <div
      className={`relative flex ${
        small ? 'h-20 w-20 rounded-lg' : 'aspect-[4/3] w-full rounded-xl'
      } items-center justify-center overflow-hidden bg-gradient-to-br ${gradient}`}
    >
      <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/30" />
      {imageSource && !imageFailed ? (
        <img
          src={imageSource}
          alt={resource.title ?? 'Campus resource'}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Icon
          className={`${small ? 'h-8 w-8' : 'h-16 w-16'} text-slate-700/45`}
          strokeWidth={1.2}
        />
      )}
      <span className="absolute bottom-3 left-3 rounded-full bg-white/65 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        {category}
      </span>
    </div>
  )
}

export const getResourceImageSource = (resource: ResourceImageData, imageFailed = false) =>
  imageFailed
    ? undefined
    : ((resource.id ? resourcePhotos[resource.id] : undefined) ?? resource.images?.[0])

export const getResourceGradient = (resource: Partial<Pick<Resource, 'id' | 'title'>>) =>
  gradients[
    Number((resource.id ?? resource.title ?? '').replace(/\D/g, '') || 0) % gradients.length
  ]
