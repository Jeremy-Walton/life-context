import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { fetchOnThisDay, rankPeople, type OnThisDayData, type WikiEntry } from './api'
import {
  fetchNumberOneSong,
  fetchNumberOneMovie,
  fetchNumberOneBook,
  fetchTopTVShow,
  fetchPersonOfTheYear,
  type ChartItem,
} from './charts'
import { eventsInLifetime, type WorldEvent } from './data/worldEvents'
import { techAfter } from './data/technology'
import { PRICE_ITEMS, PRICES_NOW, pricesForYear, formatPrice } from './data/prices'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function formatDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function yearsSince(d: Date): number {
  const now = new Date()
  let y = now.getFullYear() - d.getFullYear()
  const anniversary = new Date(now.getFullYear(), d.getMonth(), d.getDate())
  if (now < anniversary) y -= 1
  return y
}

function ageAt(date: Date, dob: Date): number {
  return Math.floor((date.getTime() - dob.getTime()) / (365.25 * 24 * 3600 * 1000))
}

// ---------- scroll-reveal ----------
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible] as const
}

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [ref, visible] = useReveal()
  return (
    <div ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`}>
      {children}
    </div>
  )
}

// ---------- shared bits ----------
function WikiLink() {
  return (
    <span className="font-heading text-xs font-bold text-gold-deep">
      Read on Wikipedia →
    </span>
  )
}

function SectionHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Reveal>
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold md:text-5xl">{title}</h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">{subtitle}</p>
      </div>
    </Reveal>
  )
}

const cardHover = 'transition-all hover:-translate-y-1 hover:border-gold/50'

// ---------- cards ----------
function PersonCard({ person }: { person: WikiEntry }) {
  return (
    <a href={person.url || '#'} target="_blank" rel="noreferrer" className="block h-full">
      <Card className={`h-full flex-row gap-4 p-4 ${cardHover}`}>
        {person.thumbnail ? (
          <img
            src={person.thumbnail}
            alt={person.title}
            loading="lazy"
            className="size-19 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex size-19 shrink-0 items-center justify-center rounded-lg bg-obsidian font-heading text-3xl font-bold text-gold">
            {person.title.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0">
          <div className="font-heading text-sm font-bold text-gold-deep">{person.year}</div>
          <h3 className="text-lg font-semibold">{person.title}</h3>
          {person.description && (
            <p className="text-sm text-muted-foreground">{person.description}</p>
          )}
          {person.extract && (
            <p className="my-1 line-clamp-3 text-sm text-muted-foreground">{person.extract}</p>
          )}
          <WikiLink />
        </div>
      </Card>
    </a>
  )
}

function EventCard({ ev }: { ev: WikiEntry }) {
  return (
    <a href={ev.url || '#'} target="_blank" rel="noreferrer" className="block">
      <Card className="flex-row gap-4 p-4 transition-all hover:translate-x-1 hover:border-gold/50">
        {ev.thumbnail && (
          <img src={ev.thumbnail} alt="" loading="lazy" className="size-16 shrink-0 rounded-lg object-cover" />
        )}
        <div>
          <div className="font-heading text-sm font-bold text-gold-deep">{ev.year}</div>
          <p className="mb-1">{ev.text}</p>
          <WikiLink />
        </div>
      </Card>
    </a>
  )
}

// Fetch (and cache) the lead image of a Wikipedia article via the REST summary API.
const thumbCache = new Map<string, string | null>()
function useWikiThumb(slug: string): string | null {
  // Cache hits are picked up by the lazy initializer; the effect only fetches.
  const [thumb, setThumb] = useState<string | null>(() => thumbCache.get(slug) ?? null)
  useEffect(() => {
    if (thumbCache.has(slug)) return
    let live = true
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const src: string | null = d?.thumbnail?.source || null
        thumbCache.set(slug, src)
        if (live) setThumb(src)
      })
      .catch(() => thumbCache.set(slug, null))
    return () => { live = false }
  }, [slug])
  return thumb
}

function WorldEventCard({ ev, dob }: { ev: WorldEvent; dob: Date }) {
  const d = new Date(ev.date)
  const age = ageAt(d, dob)
  const thumb = useWikiThumb(ev.wiki)
  return (
    <Reveal className="relative mb-9 flex gap-5">
      <div className="z-10 flex w-14 shrink-0 flex-col items-center sm:w-[76px]">
        <div className="flex size-11 items-center justify-center rounded-full border-2 border-gold bg-background font-heading text-base font-bold sm:size-14 sm:text-xl">
          {age < 1 ? '<1' : age}
        </div>
        <span className="mt-1 font-heading text-[0.65rem] font-bold tracking-widest text-muted-foreground uppercase">
          yrs old
        </span>
      </div>
      <Card className="flex-1 flex-col-reverse items-start justify-between gap-4 p-6 transition-all hover:border-gold/50 sm:flex-row">
        <div className="min-w-0">
          <div className="font-heading text-sm font-bold text-gold-deep">{formatDate(d)}</div>
          <h3 className="my-1 text-xl font-semibold">{ev.title}</h3>
          <p className="mb-2 text-muted-foreground">{ev.blurb}</p>
          <a href={`https://en.wikipedia.org/wiki/${ev.wiki}`} target="_blank" rel="noreferrer">
            <WikiLink />
          </a>
        </div>
        {thumb && (
          <a
            href={`https://en.wikipedia.org/wiki/${ev.wiki}`}
            target="_blank"
            rel="noreferrer"
            className="w-full shrink-0 sm:w-[150px]"
          >
            <img
              src={thumb}
              alt={ev.title}
              loading="lazy"
              className="h-[150px] w-full rounded-lg object-cover transition-transform hover:scale-[1.04] sm:h-[110px]"
            />
          </a>
        )}
      </Card>
    </Reveal>
  )
}

// ---------- sections ----------
function Section({ id, title, subtitle, children }: {
  id: string
  title: string
  subtitle: string
  children?: ReactNode
}) {
  return (
    <section id={id} className="border-t py-20">
      <SectionHead title={title} subtitle={subtitle} />
      {children}
    </section>
  )
}

function ShowAllButton({ expanded, total, onClick }: {
  expanded: boolean
  total: number
  onClick: () => void
}) {
  return (
    <div className="mt-8 flex justify-center">
      <Button variant="outline" onClick={onClick}>
        {expanded ? 'Show fewer' : `Show all ${total}`}
      </Button>
    </div>
  )
}

function PeopleSection({ id, title, subtitle, people, emptyText }: {
  id: string
  title: string
  subtitle: string
  people: WikiEntry[]
  emptyText: string
}) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? people : people.slice(0, 6)
  return (
    <Section id={id} title={title} subtitle={subtitle}>
      {people.length === 0 ? (
        <Reveal>
          <p className="py-4 text-center italic text-muted-foreground">{emptyText}</p>
        </Reveal>
      ) : (
        <>
          <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {shown.map((p, i) => (
              <Reveal key={`${p.title}-${p.year}-${i}`}>
                <PersonCard person={p} />
              </Reveal>
            ))}
          </div>
          {people.length > 6 && (
            <ShowAllButton
              expanded={expanded}
              total={people.length}
              onClick={() => setExpanded(!expanded)}
            />
          )}
        </>
      )}
    </Section>
  )
}

function ChartCard({ icon, label, data, sub }: {
  icon: string
  label: string
  data: ChartItem | null
  sub?: string | null
}) {
  return (
    <Reveal className="h-full">
      {!data ? (
        <Card className="h-full min-h-[220px] items-center justify-center gap-3 p-8">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-36" />
        </Card>
      ) : (
        <a href={data.url || '#'} target="_blank" rel="noreferrer" className="block h-full">
          <Card className={`h-full min-h-[220px] items-center justify-center gap-1.5 p-8 text-center ${cardHover}`}>
            <span className="text-4xl">{icon}</span>
            <span className="eyebrow">{label}</span>
            {data.unavailable ? (
              <>
                <h3 className="text-2xl font-bold">{data.label}</h3>
                <p className="text-sm text-muted-foreground">{data.note}</p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold">{data.title}</h3>
                {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
              </>
            )}
            <WikiLink />
          </Card>
        </a>
      )}
    </Reveal>
  )
}

function ChartsSection({ dob }: { dob: Date }) {
  const [song, setSong] = useState<ChartItem | null>(null)
  const [movie, setMovie] = useState<ChartItem | null>(null)
  const [book, setBook] = useState<ChartItem | null>(null)
  const [tv, setTv] = useState<ChartItem | null>(null)
  const [poty, setPoty] = useState<ChartItem | null>(null)
  // Fresh dob = fresh mount (keyed by the parent), so no state resets needed here.
  useEffect(() => {
    let live = true
    fetchNumberOneSong(dob).then((s) => { if (live) setSong(s) })
    fetchNumberOneMovie(dob).then((m) => { if (live) setMovie(m) })
    fetchNumberOneBook(dob).then((b) => { if (live) setBook(b) })
    fetchTopTVShow(dob).then((t) => { if (live) setTv(t) })
    fetchPersonOfTheYear(dob.getFullYear()).then((p) => { if (live) setPoty(p) })
    return () => { live = false }
  }, [dob])

  return (
    <Section
      id="charts"
      title="Topping the charts"
      subtitle="What the world was listening to, watching, and reading when you arrived."
    >
      <div className="mx-auto grid max-w-4xl gap-5 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
        <ChartCard
          icon="🎵" label="No. 1 song" data={song}
          sub={song && !song.unavailable ? `${song.artist}, No. 1 on the Billboard Hot 100` : null}
        />
        <ChartCard
          icon="🎬" label="No. 1 movie" data={movie}
          sub={
            movie && !movie.unavailable
              ? movie.yearTop
                ? `Highest-grossing film of ${movie.year} (weekly charts began in 1982)`
                : `No. 1 at the US box office, weekend of ${movie.date ? formatDate(movie.date) : ''}`
              : null
          }
        />
        <ChartCard
          icon="📖" label="No. 1 book" data={book}
          sub={book && !book.unavailable ? `${book.author ? `by ${book.author}, ` : ''}atop the New York Times fiction best-seller list` : null}
        />
        <ChartCard
          icon="📺" label="Top TV show" data={tv}
          sub={tv && !tv.unavailable ? `America's most-watched show, ${tv.season} season` : null}
        />
        <ChartCard
          icon="🗞️" label="Person of the Year" data={poty}
          sub={poty && !poty.unavailable ? `TIME's Person of the Year, ${dob.getFullYear()}` : null}
        />
      </div>
    </Section>
  )
}

function PricesSection({ dob }: { dob: Date }) {
  const then = pricesForYear(dob.getFullYear())
  return (
    <Section
      id="prices"
      title="What things cost back then"
      subtitle={`Approximate US averages around ${then.year}, versus today.`}
    >
      <div className="mx-auto grid max-w-5xl gap-5 grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">
        {PRICE_ITEMS.map((item) => (
          <Reveal key={item.key} className="h-full">
            <Card className={`h-full items-center gap-1 p-6 text-center ${cardHover}`}>
              <span className="text-3xl">{item.icon}</span>
              <div className="font-heading text-sm font-semibold">{item.name}</div>
              <div className="font-heading text-2xl font-bold text-gold-deep">
                {formatPrice(then[item.key])}
              </div>
              <div className="text-sm text-muted-foreground">
                now ≈ {formatPrice(PRICES_NOW[item.key])}
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

function TechSection({ dob }: { dob: Date }) {
  const [expanded, setExpanded] = useState(false)
  const items = useMemo(() => techAfter(dob), [dob])
  const shown = expanded ? items : items.slice(0, 9)
  return (
    <Section
      id="tech"
      title="Invented after you were born"
      subtitle={
        items.length > 0
          ? `${items.length} everyday things that didn't exist yet on ${formatDate(dob)}.`
          : 'You arrived after almost everything on our list. The future is yours to invent.'
      }
    >
      {items.length > 0 && (
        <>
          <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {shown.map((t) => {
              const d = new Date(t.date)
              const age = ageAt(d, dob)
              return (
                <Reveal key={t.name} className="h-full">
                  <a
                    href={`https://en.wikipedia.org/wiki/${t.wiki}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block h-full"
                  >
                    <Card className={`h-full flex-row gap-4 p-4 ${cardHover}`}>
                      <span className="shrink-0 text-3xl leading-tight">{t.icon}</span>
                      <div>
                        <div className="font-heading text-sm font-bold text-gold-deep">
                          {d.getFullYear()} · you were {age < 1 ? 'a baby' : age}
                        </div>
                        <h3 className="text-lg font-semibold">{t.name}</h3>
                        <p className="mb-1 text-sm text-muted-foreground">{t.blurb}</p>
                        <WikiLink />
                      </div>
                    </Card>
                  </a>
                </Reveal>
              )
            })}
          </div>
          {items.length > 9 && (
            <ShowAllButton
              expanded={expanded}
              total={items.length}
              onClick={() => setExpanded(!expanded)}
            />
          )}
        </>
      )}
    </Section>
  )
}

// ---------- date entry ----------
function DateEntry({ onSubmit }: { onSubmit: (d: Date) => void }) {
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState('')
  const thisYear = new Date().getFullYear()

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = parseInt(day, 10), m = parseInt(month, 10), y = parseInt(year, 10)
    const date = new Date(y, m - 1, d)
    if (
      !y || !m || !d || y < 1880 || y > thisYear ||
      date.getMonth() !== m - 1 || date.getDate() !== d || date > new Date()
    ) {
      setError('Please enter a valid date of birth.')
      return
    }
    onSubmit(date)
  }

  return (
    <div className="dark stage flex min-h-screen flex-col items-center justify-center p-8 text-center text-foreground">
      <p className="eyebrow">An interactive history of</p>
      <h1 className="headline-gradient my-4 text-6xl font-bold leading-[1.05] md:text-8xl">
        Your Lifetime
      </h1>
      <p className="mb-10 max-w-xl text-muted-foreground">
        Enter your date of birth to discover who shares your exact birthdate, what
        topped the charts, and everything invented since you arrived.
      </p>
      <form onSubmit={submit} className="flex flex-wrap items-center justify-center gap-2.5">
        <NativeSelect
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Month"
          className="h-11 w-40"
        >
          <NativeSelectOption value="">Month</NativeSelectOption>
          {MONTHS.map((mo, i) => (
            <NativeSelectOption key={mo} value={i + 1}>{mo}</NativeSelectOption>
          ))}
        </NativeSelect>
        <Input
          type="number" placeholder="Day" min="1" max="31" value={day}
          onChange={(e) => setDay(e.target.value)} aria-label="Day"
          className="h-11 w-24"
        />
        <Input
          type="number" placeholder="Year" min="1880" max={thisYear} value={year}
          onChange={(e) => setYear(e.target.value)} aria-label="Year"
          className="h-11 w-28"
        />
        <Button type="submit" size="lg" className="h-11 font-heading font-bold">
          Begin →
        </Button>
      </form>
      {error && <p className="mt-4 text-destructive">{error}</p>}
    </div>
  )
}

// ---------- main app ----------
export default function App() {
  const [dob, setDob] = useState<Date | null>(null)
  const [data, setData] = useState<OnThisDayData | null>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)

  // Loading is derived: a chosen date with no data and no error means we're fetching.
  const loading = !!dob && !data && !error

  useEffect(() => {
    if (!dob) return
    fetchOnThisDay(dob.getMonth() + 1, dob.getDate())
      .then(setData)
      .catch(() => setError('Could not reach Wikipedia. Check your connection and try again.'))
  }, [dob])

  function reset() {
    setDob(null)
    setData(null)
    setError('')
  }

  useEffect(() => {
    function onScroll() {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      setProgress(max > 0 ? h.scrollTop / max : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const derived = useMemo(() => {
    if (!data || !dob) return null
    const by = dob.getFullYear()
    return {
      bornSameDate: rankPeople(data.births.filter((p) => p.year === by)),
      diedSameDate: rankPeople(data.deaths.filter((p) => p.year === by)),
      eventsThatDay: data.events.filter((e) => e.year === by),
      lifetime: eventsInLifetime(dob),
    }
  }, [data, dob])

  if (!dob) return <DateEntry onSubmit={setDob} />

  const dateNoYear = `${MONTHS[dob.getMonth()]} ${dob.getDate()}`

  return (
    <div>
      <div
        className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-gradient-to-r from-gold to-obsidian"
        style={{ transform: `scaleX(${progress})` }}
      />

      <header className="dark stage flex min-h-[70vh] flex-col items-center justify-center px-8 pt-16 pb-8 text-center text-foreground">
        <Reveal>
          <p className="eyebrow">
            Born {formatDate(dob)} · {yearsSince(dob)} years of history
          </p>
          <h1 className="my-3 text-6xl font-bold md:text-8xl">{dateNoYear}</h1>
          <p className="text-muted-foreground">Scroll to travel through your lifetime ↓</p>
        </Reveal>
        <Button
          variant="outline"
          size="sm"
          className="mt-8"
          onClick={reset}
        >
          ← Change date
        </Button>
      </header>

      {loading && (
        <div className="flex items-center justify-center gap-3 p-16 text-muted-foreground">
          <Spinner className="size-6 text-gold" /> Consulting the archives…
        </div>
      )}
      {error && <p className="p-8 text-center text-destructive">{error}</p>}

      {derived && (
        <main className="mx-auto max-w-[1060px] px-6">
          <PeopleSection
            id="born-same-date"
            title="Your exact birthdate twins"
            subtitle={`Notable people born on ${formatDate(dob)}, the very same day as you.`}
            people={derived.bornSameDate}
            emptyText={`No one on Wikipedia was born on ${formatDate(dob)}. You may be the most notable so far.`}
          />
          <PeopleSection
            id="died-same-date"
            title="Departed as you arrived"
            subtitle={`Notable people who died on ${formatDate(dob)}, the day you were born.`}
            people={derived.diedSameDate}
            emptyText={`Wikipedia records no notable deaths on ${formatDate(dob)}.`}
          />

          <ChartsSection key={dob.toISOString()} dob={dob} />

          <PricesSection dob={dob} />

          <Section
            id="that-day"
            title="Meanwhile, that very day…"
            subtitle={`What made history on ${formatDate(dob)}.`}
          >
            {derived.eventsThatDay.length === 0 ? (
              <Reveal>
                <p className="py-4 text-center italic text-muted-foreground">
                  A quiet day for the history books. The headlines were all about you.
                </p>
              </Reveal>
            ) : (
              <div className="mx-auto flex max-w-2xl flex-col gap-4">
                {derived.eventsThatDay.map((e, i) => (
                  <Reveal key={i}><EventCard ev={e} /></Reveal>
                ))}
              </div>
            )}
          </Section>

          <TechSection dob={dob} />

          <Section
            id="lifetime"
            title="The world during your lifetime"
            subtitle={`${derived.lifetime.length} landmark moments you've lived through.`}
          >
            <div className="world-timeline mx-auto max-w-3xl">
              {derived.lifetime.map((e) => (
                <WorldEventCard key={e.date + e.title} ev={e} dob={dob} />
              ))}
            </div>
          </Section>

          <footer className="border-t py-20 text-center">
            <Reveal>
              <p className="mx-auto mb-4 max-w-lg font-heading text-2xl font-semibold">
                {yearsSince(dob)} years. {derived.lifetime.length} world-changing moments.
                One lifetime: yours.
              </p>
              <p className="text-sm text-muted-foreground">
                Data from{' '}
                <a
                  href="https://api.wikimedia.org/wiki/Feed_API/Reference/On_this_day"
                  target="_blank"
                  rel="noreferrer"
                  className="text-gold-deep"
                >
                  Wikipedia's On This Day API
                </a>{' '}
                and Wikipedia's weekly chart archives.
              </p>
              <Button
                variant="outline"
                className="mt-8"
                onClick={() => { reset(); window.scrollTo(0, 0) }}
              >
                Try another date
              </Button>
            </Reveal>
          </footer>
        </main>
      )}
    </div>
  )
}
