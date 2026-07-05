import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchOnThisDay, rankPeople } from './api.js'
import {
  fetchNumberOneSong,
  fetchNumberOneMovie,
  fetchNumberOneBook,
  fetchTopTVShow,
  fetchPersonOfTheYear,
} from './charts.js'
import { PRICE_ITEMS, PRICES_NOW, pricesForYear, formatPrice } from './data/prices.js'
import { eventsInLifetime } from './data/worldEvents.js'
import { techAfter } from './data/technology.js'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function formatDate(d) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function yearsSince(d) {
  const now = new Date()
  let y = now.getFullYear() - d.getFullYear()
  const anniversary = new Date(now.getFullYear(), d.getMonth(), d.getDate())
  if (now < anniversary) y -= 1
  return y
}

function ageAt(date, dob) {
  return Math.floor((date - dob) / (365.25 * 24 * 3600 * 1000))
}

// ---------- scroll-reveal hook ----------
function useReveal() {
  const ref = useRef(null)
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
  return [ref, visible]
}

function Reveal({ children, className = '' }) {
  const [ref, visible] = useReveal()
  return (
    <div ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`}>
      {children}
    </div>
  )
}

// ---------- cards ----------
function PersonCard({ person }) {
  return (
    <a className="person-card" href={person.url || '#'} target="_blank" rel="noreferrer">
      <div className="person-photo">
        {person.thumbnail
          ? <img src={person.thumbnail} alt={person.title} loading="lazy" />
          : <div className="photo-placeholder">{person.title.slice(0, 1)}</div>}
      </div>
      <div className="person-info">
        <div className="person-year">{person.year}</div>
        <h3>{person.title}</h3>
        {person.description && <p className="person-desc">{person.description}</p>}
        {person.extract && <p className="person-extract">{person.extract}</p>}
        <span className="wiki-link">Read on Wikipedia →</span>
      </div>
    </a>
  )
}

function EventCard({ ev }) {
  return (
    <a className="event-card" href={ev.url || '#'} target="_blank" rel="noreferrer">
      {ev.thumbnail && <img src={ev.thumbnail} alt="" loading="lazy" />}
      <div>
        <div className="event-year">{ev.year}</div>
        <p>{ev.text}</p>
        <span className="wiki-link">Read on Wikipedia →</span>
      </div>
    </a>
  )
}

// Fetch (and cache) the lead image of a Wikipedia article via the REST summary API.
const thumbCache = new Map()
function useWikiThumb(slug) {
  const [thumb, setThumb] = useState(() => thumbCache.get(slug) ?? null)
  useEffect(() => {
    if (thumbCache.has(slug)) { setThumb(thumbCache.get(slug)); return }
    let live = true
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const src = d?.thumbnail?.source || null
        thumbCache.set(slug, src)
        if (live) setThumb(src)
      })
      .catch(() => thumbCache.set(slug, null))
    return () => { live = false }
  }, [slug])
  return thumb
}

function WorldEventCard({ ev, dob }) {
  const d = new Date(ev.date)
  const age = ageAt(d, dob)
  const thumb = useWikiThumb(ev.wiki)
  return (
    <Reveal className="world-event">
      <div className="world-event-marker">
        <div className="world-event-age">{age < 1 ? '<1' : age}</div>
        <span>yrs old</span>
      </div>
      <div className="world-event-body">
        <div className="world-event-text">
          <div className="event-year">{formatDate(d)}</div>
          <h3>{ev.title}</h3>
          <p>{ev.blurb}</p>
          <a href={`https://en.wikipedia.org/wiki/${ev.wiki}`} target="_blank" rel="noreferrer" className="wiki-link">
            Read on Wikipedia →
          </a>
        </div>
        {thumb && (
          <a href={`https://en.wikipedia.org/wiki/${ev.wiki}`} target="_blank" rel="noreferrer">
            <img className="world-event-img" src={thumb} alt={ev.title} loading="lazy" />
          </a>
        )}
      </div>
    </Reveal>
  )
}

// ---------- sections ----------
function PeopleSection({ id, title, subtitle, people, emptyText }) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? people : people.slice(0, 6)
  return (
    <section className="section" id={id}>
      <Reveal>
        <div className="section-head">
          <h2>{title}</h2>
          <p className="subtitle">{subtitle}</p>
        </div>
      </Reveal>
      {people.length === 0 ? (
        <Reveal><p className="empty">{emptyText}</p></Reveal>
      ) : (
        <>
          <div className="card-grid">
            {shown.map((p, i) => (
              <Reveal key={`${p.title}-${p.year}-${i}`}>
                <PersonCard person={p} />
              </Reveal>
            ))}
          </div>
          {people.length > 6 && (
            <button className="ghost-btn" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Show fewer' : `Show all ${people.length}`}
            </button>
          )}
        </>
      )}
    </section>
  )
}

function ChartCard({ icon, label, data, sub }) {
  return (
    <Reveal className="chart-card-wrap">
      {!data ? (
        <div className="chart-card"><div className="spinner" /></div>
      ) : data.unavailable ? (
        <a className="chart-card" href={data.url} target="_blank" rel="noreferrer">
          <span className="chart-icon">{icon}</span>
          <span className="kicker">{label}</span>
          <h3>{data.label}</h3>
          <p className="person-desc">{data.note}</p>
          <span className="wiki-link">Read on Wikipedia →</span>
        </a>
      ) : (
        <a className="chart-card" href={data.url || '#'} target="_blank" rel="noreferrer">
          <span className="chart-icon">{icon}</span>
          <span className="kicker">{label}</span>
          <h3>{data.title}</h3>
          {sub && <p className="person-desc">{sub}</p>}
          <span className="wiki-link">Read on Wikipedia →</span>
        </a>
      )}
    </Reveal>
  )
}

function ChartsSection({ dob }) {
  const [song, setSong] = useState(null)
  const [movie, setMovie] = useState(null)
  const [book, setBook] = useState(null)
  const [tv, setTv] = useState(null)
  const [poty, setPoty] = useState(null)
  useEffect(() => {
    let live = true
    setSong(null); setMovie(null); setBook(null); setTv(null); setPoty(null)
    fetchNumberOneSong(dob).then((s) => live && setSong(s))
    fetchNumberOneMovie(dob).then((m) => live && setMovie(m))
    fetchNumberOneBook(dob).then((b) => live && setBook(b))
    fetchTopTVShow(dob).then((t) => live && setTv(t))
    fetchPersonOfTheYear(dob.getFullYear()).then((p) => live && setPoty(p))
    return () => { live = false }
  }, [dob])

  return (
    <section className="section" id="charts">
      <Reveal>
        <div className="section-head">
          <h2>Topping the charts</h2>
          <p className="subtitle">What the world was listening to, watching, and reading when you arrived.</p>
        </div>
      </Reveal>
      <div className="charts-grid">
        <ChartCard
          icon="🎵" label="No. 1 song" data={song}
          sub={song && !song.unavailable ? `${song.artist} — No. 1 on the Billboard Hot 100` : null}
        />
        <ChartCard
          icon="🎬" label="No. 1 movie" data={movie}
          sub={
            movie && !movie.unavailable
              ? movie.yearTop
                ? `Highest-grossing film of ${movie.year} (weekly charts began in 1982)`
                : `No. 1 at the US box office, weekend of ${formatDate(movie.date)}`
              : null
          }
        />
        <ChartCard
          icon="📖" label="No. 1 book" data={book}
          sub={book && !book.unavailable ? `${book.author ? `by ${book.author} — ` : ''}atop the New York Times fiction best-seller list` : null}
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
    </section>
  )
}

function PricesSection({ dob }) {
  const then = pricesForYear(dob.getFullYear())
  return (
    <section className="section" id="prices">
      <Reveal>
        <div className="section-head">
          <h2>What things cost back then</h2>
          <p className="subtitle">
            Approximate US averages around {then.year}, versus today.
          </p>
        </div>
      </Reveal>
      <div className="prices-grid">
        {PRICE_ITEMS.map((item) => (
          <Reveal key={item.key}>
            <div className="price-card">
              <span className="price-icon">{item.icon}</span>
              <div className="price-name">{item.name}</div>
              <div className="price-then">{formatPrice(then[item.key])}</div>
              <div className="price-now">now ≈ {formatPrice(PRICES_NOW[item.key])}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function TechSection({ dob }) {
  const [expanded, setExpanded] = useState(false)
  const items = useMemo(() => techAfter(dob), [dob])
  const shown = expanded ? items : items.slice(0, 9)
  return (
    <section className="section" id="tech">
      <Reveal>
        <div className="section-head">
          <h2>Invented after you were born</h2>
          <p className="subtitle">
            {items.length > 0
              ? `${items.length} everyday things that didn't exist yet on ${formatDate(dob)}.`
              : 'You arrived after almost everything on our list — the future is yours to invent.'}
          </p>
        </div>
      </Reveal>
      {items.length > 0 && (
        <>
          <div className="card-grid">
            {shown.map((t) => {
              const d = new Date(t.date)
              const age = ageAt(d, dob)
              return (
                <Reveal key={t.name}>
                  <a className="tech-card" href={`https://en.wikipedia.org/wiki/${t.wiki}`} target="_blank" rel="noreferrer">
                    <span className="tech-icon">{t.icon}</span>
                    <div>
                      <div className="person-year">{d.getFullYear()} · you were {age < 1 ? 'a baby' : age}</div>
                      <h3>{t.name}</h3>
                      <p className="person-desc">{t.blurb}</p>
                      <span className="wiki-link">Read on Wikipedia →</span>
                    </div>
                  </a>
                </Reveal>
              )
            })}
          </div>
          {items.length > 9 && (
            <button className="ghost-btn" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Show fewer' : `Show all ${items.length}`}
            </button>
          )}
        </>
      )}
    </section>
  )
}

// ---------- date entry ----------
function DateEntry({ onSubmit }) {
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState('')
  const thisYear = new Date().getFullYear()

  function submit(e) {
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
    <div className="hero">
      <p className="kicker">An interactive history of</p>
      <h1>Your Lifetime</h1>
      <p className="hero-sub">
        Enter your date of birth to discover who shares your exact birthdate, what
        topped the charts, and everything invented since you arrived.
      </p>
      <form className="dob-form" onSubmit={submit}>
        <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month">
          <option value="">Month</option>
          {MONTHS.map((mo, i) => <option key={mo} value={i + 1}>{mo}</option>)}
        </select>
        <input type="number" placeholder="Day" min="1" max="31" value={day}
          onChange={(e) => setDay(e.target.value)} aria-label="Day" />
        <input type="number" placeholder="Year" min="1880" max={thisYear} value={year}
          onChange={(e) => setYear(e.target.value)} aria-label="Year" />
        <button type="submit">Begin →</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  )
}

// ---------- main app ----------
export default function App() {
  const [dob, setDob] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!dob) return
    setLoading(true)
    setError('')
    fetchOnThisDay(dob.getMonth() + 1, dob.getDate())
      .then(setData)
      .catch(() => setError('Could not reach Wikipedia. Check your connection and try again.'))
      .finally(() => setLoading(false))
  }, [dob])

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
    <div className="app">
      <div className="progress-bar" style={{ transform: `scaleX(${progress})` }} />
      <header className="banner">
        <Reveal>
          <p className="kicker">Born {formatDate(dob)} · {yearsSince(dob)} years of history</p>
          <h1>{dateNoYear}</h1>
          <p className="hero-sub">Scroll to travel through your lifetime ↓</p>
        </Reveal>
        <button className="ghost-btn small" onClick={() => { setDob(null); setData(null) }}>
          ← Change date
        </button>
      </header>

      {loading && <div className="loader"><div className="spinner" /> Consulting the archives…</div>}
      {error && <p className="error center">{error}</p>}

      {derived && (
        <main className="timeline">
          <PeopleSection
            id="born-same-date"
            title="Your exact birthdate twins"
            subtitle={`Notable people born on ${formatDate(dob)} — the very same day as you.`}
            people={derived.bornSameDate}
            emptyText={`No one on Wikipedia was born on ${formatDate(dob)} — you may be the most notable so far.`}
          />
          <PeopleSection
            id="died-same-date"
            title="Departed as you arrived"
            subtitle={`Notable people who died on ${formatDate(dob)}, the day you were born.`}
            people={derived.diedSameDate}
            emptyText={`Wikipedia records no notable deaths on ${formatDate(dob)}.`}
          />

          <ChartsSection dob={dob} />

          <PricesSection dob={dob} />

          <section className="section" id="that-day">
            <Reveal>
              <div className="section-head">
                <h2>Meanwhile, that very day…</h2>
                <p className="subtitle">What made history on {formatDate(dob)}.</p>
              </div>
            </Reveal>
            {derived.eventsThatDay.length === 0 ? (
              <Reveal><p className="empty">A quiet day for the history books — the headlines were all about you.</p></Reveal>
            ) : (
              <div className="event-list">
                {derived.eventsThatDay.map((e, i) => (
                  <Reveal key={i}><EventCard ev={e} /></Reveal>
                ))}
              </div>
            )}
          </section>

          <TechSection dob={dob} />

          <section className="section" id="lifetime">
            <Reveal>
              <div className="section-head">
                <h2>The world during your lifetime</h2>
                <p className="subtitle">
                  {derived.lifetime.length} landmark moments you've lived through.
                </p>
              </div>
            </Reveal>
            <div className="world-timeline">
              {derived.lifetime.map((e) => (
                <WorldEventCard key={e.date + e.title} ev={e} dob={dob} />
              ))}
            </div>
          </section>

          <footer className="footer">
            <Reveal>
              <p>
                {yearsSince(dob)} years. {derived.lifetime.length} world-changing moments.
                One lifetime — yours.
              </p>
              <p className="credit">
                Data from <a href="https://api.wikimedia.org/wiki/Feed_API/Reference/On_this_day" target="_blank" rel="noreferrer">Wikipedia's On This Day API</a> and Wikipedia's weekly chart archives.
              </p>
              <button className="ghost-btn" onClick={() => { setDob(null); setData(null); window.scrollTo(0, 0) }}>
                Try another date
              </button>
            </Reveal>
          </footer>
        </main>
      )}
    </div>
  )
}
