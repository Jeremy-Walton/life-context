// Wikipedia "On this day" feed API — free, no key, CORS-enabled.
// Docs: https://api.wikimedia.org/wiki/Feed_API/Reference/On_this_day

const BASE = 'https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday'

const pad = (n) => String(n).padStart(2, '0')

async function fetchType(type, month, day) {
  const res = await fetch(`${BASE}/${type}/${pad(month)}/${pad(day)}`)
  if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`)
  const data = await res.json()
  return data[type] || []
}

// Normalize an "on this day" entry into a card-friendly shape.
// Each entry: { text, year, pages: [...] } — first page is usually the person/subject.
function normalize(entry) {
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

export async function fetchOnThisDay(month, day) {
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
export function rankPeople(list) {
  return [...list].sort((a, b) => {
    const photo = (b.thumbnail ? 1 : 0) - (a.thumbnail ? 1 : 0)
    if (photo !== 0) return photo
    return (b.year || 0) - (a.year || 0)
  })
}
