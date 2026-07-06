// Wikipedia "On this day" feed API — free, no key, CORS-enabled.
// Docs: https://api.wikimedia.org/wiki/Feed_API/Reference/On_this_day

const BASE = 'https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday'

interface FeedPage {
  type?: string
  titles?: { normalized?: string }
  description?: string
  extract?: string
  thumbnail?: { source?: string }
  content_urls?: { desktop?: { page?: string } }
}

interface FeedEntry {
  text: string
  year?: number
  pages?: FeedPage[]
}

export interface WikiEntry {
  year: number | undefined
  text: string
  title: string
  description: string
  extract: string
  thumbnail: string | null
  url: string | null
}

export interface OnThisDayData {
  births: WikiEntry[]
  deaths: WikiEntry[]
  events: WikiEntry[]
}

const pad = (n: number) => String(n).padStart(2, '0')

async function fetchType(type: keyof OnThisDayData, month: number, day: number): Promise<FeedEntry[]> {
  const res = await fetch(`${BASE}/${type}/${pad(month)}/${pad(day)}`)
  if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`)
  const data = await res.json()
  return data[type] || []
}

// Normalize an "on this day" entry into a card-friendly shape.
// Each entry: { text, year, pages: [...] } — first page is usually the person/subject.
function normalize(entry: FeedEntry): WikiEntry {
  const page =
    entry.pages?.find((p) => p.type === 'standard' && p.thumbnail) ||
    entry.pages?.[0]
  return {
    year: entry.year,
    text: entry.text,
    title: page?.titles?.normalized || entry.text,
    description: page?.description || '',
    extract: page?.extract || '',
    thumbnail: page?.thumbnail?.source || null,
    url: page?.content_urls?.desktop?.page || null,
  }
}

export async function fetchOnThisDay(month: number, day: number): Promise<OnThisDayData> {
  const [births, deaths, events] = await Promise.all([
    fetchType('births', month, day),
    fetchType('deaths', month, day),
    fetchType('events', month, day),
  ])
  return {
    births: births.map(normalize),
    deaths: deaths.map(normalize),
    events: events.map(normalize),
  }
}

// Sort helper: prefer entries with photos, then more recent years.
export function rankPeople(list: WikiEntry[]): WikiEntry[] {
  return [...list].sort((a, b) => {
    const photo = (b.thumbnail ? 1 : 0) - (a.thumbnail ? 1 : 0)
    if (photo !== 0) return photo
    return (b.year || 0) - (a.year || 0)
  })
}
