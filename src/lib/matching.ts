import type { Category, Resource, User } from '../data/types'
import { calculatePricing } from './pricing'
export interface ParsedIntent {
  raw: string
  tags: string[]
  categories: Category[]
  startAt: string
  dueAt: string
  mode: 'hourly' | 'daily'
  units: number
  label: string
}
export interface FactorScores {
  suitability: number
  availability: number
  distance: number
  ownerTrust: number
  condition: number
  affordability: number
}
export interface Recommendation {
  resource: Resource
  score: number
  factors: FactorScores
  alternatives: Resource[]
}
export interface KitSlot {
  label: string
  tag: string
  recommendation?: Recommendation
  alternatives: Recommendation[]
}
const normalizeTerm = (term: string): string => {
  const normalized = term.toLowerCase().trim()
  const aliases: Record<string, string> = {
    light: 'lighting',
    lights: 'lighting',
    microphone: 'microphone',
    microphones: 'microphone',
    camera: 'camera',
    cameras: 'camera',
  }
  return aliases[normalized] ?? normalized.replace(/s$/, '')
}
const keywordMap: Record<string, string[]> = {
  reel: ['camera', 'tripod', 'microphone', 'light'],
  video: ['camera', 'tripod', 'microphone', 'light'],
  shoot: ['camera', 'tripod', 'microphone', 'light'],
  vlog: ['camera', 'tripod', 'microphone', 'light'],
  film: ['camera', 'tripod', 'microphone', 'light'],
  podcast: ['microphone', 'audio recorder', 'headphones', 'light'],
  record: ['microphone', 'audio recorder', 'headphones', 'light'],
  interview: ['microphone', 'audio recorder', 'headphones', 'light'],
  presentation: ['projector', 'laser pointer', 'laptop', 'clicker'],
  seminar: ['projector', 'laser pointer', 'laptop', 'clicker'],
  pitch: ['projector', 'laser pointer', 'laptop', 'clicker'],
  trek: ['tent', 'sleeping bag', 'trekking pole', 'backpack'],
  hike: ['tent', 'sleeping bag', 'trekking pole', 'backpack'],
  camp: ['tent', 'sleeping bag', 'trekking pole', 'backpack'],
  exam: ['textbook', 'calculator', 'notes'],
  study: ['textbook', 'calculator', 'notes'],
  semester: ['textbook', 'calculator', 'notes'],
  fest: ['speaker', 'lights', 'extension board', 'banner stand'],
  event: ['speaker', 'lights', 'extension board', 'banner stand'],
  decor: ['speaker', 'lights', 'extension board', 'banner stand'],
  stage: ['speaker', 'lights', 'extension board', 'banner stand'],
  music: ['guitar', 'keyboard', 'amplifier', 'cajon'],
  jam: ['guitar', 'keyboard', 'amplifier', 'cajon'],
  band: ['guitar', 'keyboard', 'amplifier', 'cajon'],
  lab: ['multimeter', 'soldering iron', 'oscilloscope', 'arduino kit'],
  project: ['multimeter', 'soldering iron', 'oscilloscope', 'arduino kit'],
  circuit: ['multimeter', 'soldering iron', 'oscilloscope', 'arduino kit'],
  sports: ['cricket kit', 'badminton racket', 'football', 'basketball'],
  match: ['cricket kit', 'badminton racket', 'football', 'basketball'],
  tournament: ['cricket kit', 'badminton racket', 'football', 'basketball'],
}
const categories: Record<string, Category> = {
  camera: 'Camera & Video',
  tripod: 'Camera & Video',
  microphone: 'Audio',
  'audio recorder': 'Audio',
  headphones: 'Audio',
  light: 'Camera & Video',
  projector: 'Computing',
  laptop: 'Computing',
  clicker: 'Computing',
  calculator: 'Books',
  textbook: 'Books',
  notes: 'Books',
  tent: 'Sports',
  backpack: 'Sports',
  'badminton racket': 'Sports',
  football: 'Sports',
  speaker: 'Audio',
  lights: 'Event & Decor',
  'extension board': 'Event & Decor',
  'banner stand': 'Event & Decor',
  guitar: 'Music',
  keyboard: 'Music',
  amplifier: 'Music',
  cajon: 'Music',
  multimeter: 'Lab & Electronics',
  'soldering iron': 'Lab & Electronics',
  'arduino kit': 'Lab & Electronics',
}
const tagsForText = (text: string) =>
  Object.entries(keywordMap)
    .filter(([word]) => text.toLowerCase().includes(word))
    .flatMap(([, tags]) => tags)
    .filter((tag, index, all) => all.indexOf(tag) === index)
export const parseIntent = (
  text: string,
  current: Date = new Date('2025-03-15T10:00:00+05:30'),
): ParsedIntent => {
  const tags = tagsForText(text)
  const lower = text.toLowerCase()
  const start = new Date(current)
  let due = new Date(current)
  let mode: 'hourly' | 'daily' = 'daily'
  let units = 1
  if (lower.includes('tonight')) {
    start.setHours(18, 0, 0, 0)
    due = new Date(start)
    due.setHours(23, 0, 0, 0)
    mode = 'hourly'
    units = 5
  } else if (lower.includes('tomorrow')) {
    start.setDate(start.getDate() + 1)
    start.setHours(9, 0, 0, 0)
    due = new Date(start)
    due.setDate(due.getDate() + 1)
  } else if (lower.includes('weekend')) {
    start.setDate(start.getDate() + ((6 - start.getDay() + 7) % 7 || 7))
    start.setHours(9, 0, 0, 0)
    due = new Date(start)
    due.setDate(due.getDate() + 2)
    units = 2
  } else {
    const day = lower.match(/for\s+(\d+)\s+days?/)
    const hour = lower.match(/(\d+)\s+hours?/)
    if (day) {
      units = Number(day[1])
      start.setHours(9, 0, 0, 0)
      due = new Date(start)
      due.setDate(due.getDate() + units)
    } else if (hour) {
      units = Number(hour[1])
      mode = 'hourly'
      start.setHours(9, 0, 0, 0)
      due = new Date(start)
      due.setHours(due.getHours() + units)
    } else if (lower.includes('next week')) {
      start.setDate(start.getDate() + 7)
      start.setHours(9, 0, 0, 0)
      due = new Date(start)
      due.setDate(due.getDate() + 1)
    } else {
      start.setDate(start.getDate() + 1)
      start.setHours(9, 0, 0, 0)
      due = new Date(start)
      due.setDate(due.getDate() + 1)
    }
  }
  const found = tags.length ? tags : ['camera']
  const cats = found
    .map((tag) => categories[tag])
    .filter((cat, index, all): cat is Category => Boolean(cat) && all.indexOf(cat) === index)
  return {
    raw: text,
    tags: found,
    categories: cats,
    startAt: start.toISOString(),
    dueAt: due.toISOString(),
    mode,
    units,
    label: found.length ? `${found.slice(0, 3).join(' + ')} kit` : 'Campus essentials',
  }
}
const conditionScore = (condition: Resource['condition']) =>
  ({ 'Like New': 1, Good: 0.8, Fair: 0.55, Worn: 0.3 })[condition]
export const scoreResource = (
  resource: Resource,
  owner: User,
  intent: ParsedIntent,
  _allUsers: User[],
  budgetRef = 800,
): Recommendation => {
  const overlap = intent.tags.filter(
    (tag) =>
      resource.tags.some((item) => item.includes(tag) || tag.includes(item)) ||
      resource.title.toLowerCase().includes(tag),
  ).length
  const suitability = Math.min(1, overlap / Math.max(1, intent.tags.length > 4 ? 2 : 1))
  const availability =
    resource.availability.status === 'Unavailable'
      ? 0
      : resource.availability.status === 'Borrowed'
        ? 0.5
        : resource.availability.blockedRanges.some(
              (range) =>
                new Date(range.from) < new Date(intent.dueAt) &&
                new Date(range.to) > new Date(intent.startAt),
            )
          ? 0
          : 1
  const distance = 1 - Math.min(resource.distanceMeters, 2000) / 2000
  const ownerTrust = (owner.trustScore / 100 + owner.rating / 5) / 2
  const condition = conditionScore(resource.condition)
  const affordability =
    1 -
    Math.min(
      calculatePricing({ resource, mode: intent.mode, units: intent.units }).payableUpfront,
      budgetRef,
    ) /
      budgetRef
  const factors = { suitability, availability, distance, ownerTrust, condition, affordability }
  const score =
    (suitability * 0.3 +
      availability * 0.2 +
      distance * 0.15 +
      ownerTrust * 0.15 +
      condition * 0.1 +
      affordability * 0.1) *
    100
  const alternatives: Resource[] = []
  return { resource, score, factors, alternatives }
}
export const matchIntent = (
  intent: ParsedIntent,
  resources: Resource[],
  users: User[],
): KitSlot[] => {
  const usedResourceIds = new Set<string>()
  const slotTerms = intent.tags
    .map(normalizeTerm)
    .filter((tag, index, all) => all.indexOf(tag) === index)
  return slotTerms.map((tag) => {
    const matches = resources
      .filter((resource) => !usedResourceIds.has(resource.id))
      .filter((resource) => resource.approvalStatus === 'Approved' && !resource.removed)
      .filter((resource) => {
        const title = resource.title.toLowerCase()
        const primaryTag = normalizeTerm(resource.tags[0] ?? '')
        return title.includes(tag) || primaryTag === tag
      })
      .map((resource) => {
        const owner = users.find((user) => user.id === resource.ownerId) ?? users[0]
        return scoreResource(resource, owner, { ...intent, tags: [tag] }, users)
      })
      .filter((item) => item.factors.suitability > 0)
      .sort((a, b) => b.score - a.score)
    const recommendation = matches[0]
    if (recommendation) usedResourceIds.add(recommendation.resource.id)
    return {
      label: tag.replace(/\b\w/g, (letter) => letter.toUpperCase()),
      tag,
      recommendation,
      alternatives: matches.slice(1, 3),
    }
  })
}
