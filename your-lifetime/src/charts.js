// Fetch the #1 Billboard song and #1 US box-office film for a given date
// by parsing Wikipedia's weekly number-one list pages in the browser.

const API = 'https://en.wikipedia.org/w/api.php'

async function fetchParsedHtml(title, attempt = 0) {
  const url =
    `${API}?action=parse&page=${encodeURIComponent(title)}` +
    `&prop=text&formatversion=2&format=json&redirects=1&origin=*`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (data.error) throw new Error(data.error.info)
    // formatversion=2 gives a string; be defensive in case the older
    // {'*': html} shape comes back.
    let html = data?.parse?.text
    if (html && typeof html !== 'string') html = html['*']
    if (!html) throw new Error('empty parse result')
    return new DOMParser().parseFromString(html, 'text/html')
  } catch (err) {
    // One retry for transient network/rate-limit hiccups.
    if (attempt < 1) {
      await new Promise((r) => setTimeout(r, 600))
      return fetchParsedHtml(title, attempt + 1)
    }
    throw err
  }
}

// Convert a table into a matrix of {text, href} cells, expanding rowspans
// and colspans so every row has a value in every column.
function tableToMatrix(table) {
  const matrix = []
  const rows = [...table.querySelectorAll('tr')]
  rows.forEach((tr, r) => {
    matrix[r] = matrix[r] || []
    let c = 0
    for (const cell of tr.children) {
      while (matrix[r][c] !== undefined) c++
      const rs = parseInt(cell.getAttribute('rowspan') || '1', 10)
      const cs = parseInt(cell.getAttribute('colspan') || '1', 10)
      const a = cell.querySelector('a[href^="/wiki/"]')
      const value = {
        // \s+ → ' ' also normalizes non-breaking spaces, which Wikipedia
        // headers often contain ("Issue date") and which break literal-space
        // regex matches.
        text: cell.textContent
          .replace(/\[[^\]]*\]/g, '')
          .replace(/["""]/g, '')
          .replace(/\s+/g, ' ')
          .trim(),
        href: a ? `https://en.wikipedia.org${a.getAttribute('href')}` : null,
      }
      for (let i = 0; i < rs; i++) {
        matrix[r + i] = matrix[r + i] || []
        for (let j = 0; j < cs; j++) matrix[r + i][c + j] = value
      }
      c += cs
    }
  })
  return matrix
}

const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december']
const MONTH_RE = new RegExp(`(${MONTHS.join('|')})\\s+(\\d{1,2})`)

function parseMonthDay(text, year) {
  const m = text.toLowerCase().match(MONTH_RE)
  if (!m) return null
  return new Date(year, MONTHS.indexOf(m[1]), parseInt(m[2], 10))
}

// Find the table whose header matches all given regexes (checking the first
// few rows of every table on the page); return data rows + column indexes.
function findTable(doc, colSpecs) {
  for (const table of doc.querySelectorAll('table')) {
    const matrix = tableToMatrix(table)
    for (let h = 0; h < Math.min(3, matrix.length); h++) {
      const header = matrix[h] || []
      const cols = {}
      let ok = true
      for (const [key, re] of Object.entries(colSpecs)) {
        const idx = header.findIndex((cell) => cell && re.test(cell.text))
        if (idx === -1) { ok = false; break }
        cols[key] = idx
      }
      if (ok) return { rows: matrix.slice(h + 1), cols }
    }
  }
  // Diagnostic: show what headers were actually on the page so failures
  // are debuggable from the console.
  console.warn(
    '[charts] no table matched',
    Object.fromEntries(Object.entries(colSpecs).map(([k, re]) => [k, String(re)])),
    '— headers seen:',
    [...doc.querySelectorAll('table')].slice(0, 8).map((tb) =>
      (tableToMatrix(tb)[0] || []).map((c) => c?.text).join(' | ')
    )
  )
  return null
}

// ---------- #1 song (Billboard Hot 100, weekly, Aug 1958 onward) ----------

async function songEntriesForYear(year) {
  const doc = await fetchParsedHtml(`List of Billboard Hot 100 number ones of ${year}`)
  const t = findTable(doc, {
    date: /date/i,
    song: /song|single|title/i,
    artist: /artist/i,
  })
  if (!t) throw new Error(`song table not found for ${year}`)
  const entries = []
  let prev = null
  for (const row of t.rows) {
    const dateCell = row[t.cols.date]
    const date = dateCell && parseMonthDay(dateCell.text, year)
    if (!date) continue
    let title = row[t.cols.song]?.text || ''
    let artist = row[t.cols.artist]?.text || ''
    let url = row[t.cols.song]?.href || row[t.cols.artist]?.href
    // Some year pages leave song/artist cells blank on continuation weeks —
    // the same song is still #1, so carry the previous week's values forward.
    if (!title && prev) {
      title = prev.title
      artist = prev.artist
      url = prev.url
    }
    if (!title) continue
    prev = { date, title, artist, url }
    entries.push(prev)
  }
  if (entries.length === 0) throw new Error(`no song entries parsed for ${year}`)
  return entries
}

export async function fetchNumberOneSong(dob) {
  const year = dob.getFullYear()
  const fallback = {
    unavailable: true,
    note: 'The weekly Billboard Hot 100 began in August 1958.',
    label: `Explore the music of ${year}`,
    url: `https://en.wikipedia.org/wiki/${year}_in_music`,
  }
  if (year < 1958) return fallback
  try {
    const entries = await songEntriesForYear(year)
    let match = null
    for (const e of entries) if (e.date <= dob) match = e
    if (!match) {
      // Born before the year's first chart issue — use last chart of previous year.
      const prev = await songEntriesForYear(year - 1)
      match = prev[prev.length - 1]
    }
    return match || fallback
  } catch (err) {
    console.warn('[charts] #1 song lookup failed:', err)
    return fallback
  }
}

// ---------- #1 movie (US weekend box office, 1982 onward) ----------

async function movieEntriesForYear(year) {
  const doc = await fetchParsedHtml(
    `List of ${year} box office number-one films in the United States`
  )
  const t = findTable(doc, {
    date: /weekend end/i,
    film: /film/i,
  })
  if (!t) throw new Error(`movie table not found for ${year}`)
  const entries = t.rows
    .map((row) => {
      const date = row[t.cols.date] && parseMonthDay(row[t.cols.date].text, year)
      if (!date || !row[t.cols.film]?.text) return null
      return {
        date,
        title: row[t.cols.film].text,
        url: row[t.cols.film].href,
      }
    })
    .filter(Boolean)
  if (entries.length === 0) throw new Error(`no movie entries parsed for ${year}`)
  return entries
}

// Pre-1982 fallback: the highest-grossing film of the birth year, from the
// "Highest-grossing films of {year}" table on Wikipedia's "{year} in film".
async function topFilmOfYear(year) {
  const doc = await fetchParsedHtml(`${year} in film`)
  const t = findTable(doc, {
    rank: /rank/i,
    title: /title|film/i,
  })
  if (!t) throw new Error(`top-film table not found for ${year}`)
  const row =
    t.rows.find((r) => r[t.cols.rank]?.text.replace(/\D/g, '') === '1') || t.rows[0]
  const title = row?.[t.cols.title]?.text
  if (!title) throw new Error(`no top film parsed for ${year}`)
  return { title, url: row[t.cols.title].href, yearTop: true, year }
}

export async function fetchNumberOneMovie(dob) {
  const year = dob.getFullYear()
  const fallback = {
    unavailable: true,
    note: 'Box-office records are patchy this far back.',
    label: `Explore the films of ${year}`,
    url: `https://en.wikipedia.org/wiki/${year}_in_film`,
  }
  if (year < 1982) {
    // No weekly charts before 1982 — show the year's biggest film instead.
    try {
      return await topFilmOfYear(year)
    } catch (err) {
      console.warn('[charts] top film of year lookup failed:', err)
      return fallback
    }
  }
  try {
    const entries = await movieEntriesForYear(year)
    // The weekend END date on or after the birth date is the weekend covering it.
    let match = entries.find((e) => e.date >= dob)
    if (!match) {
      // Born in the last days of December — first weekend of the next year.
      const next = await movieEntriesForYear(year + 1).catch(() => null)
      match = next?.[0] || entries[entries.length - 1]
    }
    return match || fallback
  } catch (err) {
    console.warn('[charts] #1 movie lookup failed:', err)
    return fallback
  }
}

// ---------- #1 book (NYT fiction best-seller list, weekly) ----------

async function bookEntriesForYear(year) {
  let doc
  try {
    doc = await fetchParsedHtml(`List of The New York Times number-one books of ${year}`)
  } catch {
    doc = await fetchParsedHtml(`The New York Times Fiction Best Sellers of ${year}`)
  }
  const t = findTable(doc, {
    date: /^date/i,
    book: /book|title/i,
  })
  if (!t) throw new Error(`book table not found for ${year}`)
  const authorCol = t.cols.book + 1 // Author column follows Book
  const entries = []
  let prev = null
  for (const row of t.rows) {
    const date = row[t.cols.date] && parseMonthDay(row[t.cols.date].text, year)
    if (!date) continue
    let title = row[t.cols.book]?.text || ''
    let author = row[authorCol]?.text || ''
    let url = row[t.cols.book]?.href
    if (!title && prev) { title = prev.title; author = prev.author; url = prev.url }
    if (!title) continue
    prev = { date, title, author, url }
    entries.push(prev)
  }
  if (entries.length === 0) throw new Error(`no book entries parsed for ${year}`)
  return entries
}

export async function fetchNumberOneBook(dob) {
  const year = dob.getFullYear()
  const fallback = {
    unavailable: true,
    note: 'Weekly best-seller records are patchy this far back.',
    label: `Explore the books of ${year}`,
    url: `https://en.wikipedia.org/wiki/${year}_in_literature`,
  }
  if (year < 1942) return fallback
  try {
    const entries = await bookEntriesForYear(year)
    let match = null
    for (const e of entries) if (e.date <= dob) match = e
    if (!match) {
      const prev = await bookEntriesForYear(year - 1)
      match = prev[prev.length - 1]
    }
    return match || fallback
  } catch (err) {
    console.warn('[charts] #1 book lookup failed:', err)
    return fallback
  }
}

// ---------- Top TV show of the season (Nielsen ratings, 1950–51 onward) ----------

export async function fetchTopTVShow(dob) {
  const year = dob.getFullYear()
  // TV seasons run September–August.
  const start = dob.getMonth() >= 8 ? year : year - 1
  const end = start + 1
  const endLabel = end % 100 === 0 ? String(end) : String(end % 100).padStart(2, '0')
  const season = `${start}–${endLabel}`
  const fallback = {
    unavailable: true,
    note: 'Nielsen season ratings begin with the 1950–51 season.',
    label: `Explore ${year} in television`,
    url: `https://en.wikipedia.org/wiki/${year}_in_American_television`,
  }
  if (start < 1950) return fallback
  try {
    const doc = await fetchParsedHtml(`Top-rated United States television programs of ${season}`)
    const t = findTable(doc, {
      rank: /rank/i,
      program: /program|show/i,
    })
    if (!t) throw new Error(`TV table not found for ${season}`)
    const row =
      t.rows.find((r) => r[t.cols.rank]?.text.replace(/\D/g, '') === '1') || t.rows[0]
    const title = row?.[t.cols.program]?.text
    if (!title) throw new Error(`no #1 program parsed for ${season}`)
    return { title, url: row[t.cols.program].href, season }
  } catch (err) {
    console.warn('[charts] top TV show lookup failed:', err)
    return fallback
  }
}

// ---------- Time Person of the Year (1927 onward) ----------

export async function fetchPersonOfTheYear(year) {
  const fallback = {
    unavailable: true,
    note: 'TIME began naming a Person of the Year in 1927.',
    label: 'About Person of the Year',
    url: 'https://en.wikipedia.org/wiki/Time_Person_of_the_Year',
  }
  if (year < 1927) return fallback
  try {
    const doc = await fetchParsedHtml('Time Person of the Year')
    const t = findTable(doc, {
      year: /year/i,
      choice: /choice/i,
    })
    if (!t) throw new Error('Person of the Year table not found')
    const row = t.rows.find((r) => r[t.cols.year]?.text.startsWith(String(year)))
    const title = row?.[t.cols.choice]?.text
    if (!title) throw new Error(`no Person of the Year found for ${year}`)
    return {
      title,
      url: row[t.cols.choice].href || 'https://en.wikipedia.org/wiki/Time_Person_of_the_Year',
    }
  } catch (err) {
    console.warn('[charts] Person of the Year lookup failed:', err)
    return fallback
  }
}
