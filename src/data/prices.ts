// Approximate US average prices by year (anchor years; nearest anchor is used).
// Sources: BLS averages, NATO ticket averages, USPS rate history, Census
// median home prices. Values are approximations for storytelling, not exact.

export type PriceKey = 'gas' | 'movie' | 'stamp' | 'milk' | 'home'

export type PriceAnchor = { year: number } & Record<PriceKey, number>

export interface PriceItem {
  key: PriceKey
  icon: string
  name: string
}

const ANCHORS: PriceAnchor[] = [
  { year: 1930, gas: 0.20, movie: 0.25, stamp: 0.02, milk: 0.56, home: 4800 },
  { year: 1935, gas: 0.19, movie: 0.24, stamp: 0.03, milk: 0.47, home: 3500 },
  { year: 1940, gas: 0.18, movie: 0.24, stamp: 0.03, milk: 0.52, home: 2950 },
  { year: 1945, gas: 0.21, movie: 0.35, stamp: 0.03, milk: 0.63, home: 5150 },
  { year: 1950, gas: 0.27, movie: 0.46, stamp: 0.03, milk: 0.83, home: 7400 },
  { year: 1955, gas: 0.29, movie: 0.50, stamp: 0.03, milk: 0.93, home: 11000 },
  { year: 1960, gas: 0.31, movie: 0.69, stamp: 0.04, milk: 1.04, home: 12500 },
  { year: 1965, gas: 0.31, movie: 1.01, stamp: 0.05, milk: 1.05, home: 20000 },
  { year: 1970, gas: 0.36, movie: 1.55, stamp: 0.06, milk: 1.32, home: 23400 },
  { year: 1975, gas: 0.57, movie: 2.05, stamp: 0.10, milk: 1.57, home: 39300 },
  { year: 1980, gas: 1.19, movie: 2.69, stamp: 0.15, milk: 2.16, home: 64600 },
  { year: 1985, gas: 1.20, movie: 3.55, stamp: 0.22, milk: 2.24, home: 84300 },
  { year: 1990, gas: 1.15, movie: 4.23, stamp: 0.25, milk: 2.78, home: 122900 },
  { year: 1995, gas: 1.15, movie: 4.35, stamp: 0.32, milk: 2.48, home: 133900 },
  { year: 2000, gas: 1.51, movie: 5.39, stamp: 0.33, milk: 2.79, home: 169000 },
  { year: 2005, gas: 2.30, movie: 6.41, stamp: 0.37, milk: 3.24, home: 240900 },
  { year: 2010, gas: 2.79, movie: 7.89, stamp: 0.44, milk: 3.32, home: 221800 },
  { year: 2015, gas: 2.45, movie: 8.43, stamp: 0.49, milk: 3.42, home: 294200 },
  { year: 2020, gas: 2.17, movie: 9.16, stamp: 0.55, milk: 3.54, home: 336900 },
  { year: 2025, gas: 3.15, movie: 11.00, stamp: 0.73, milk: 4.05, home: 420000 },
]

export const PRICES_NOW: PriceAnchor = {
  year: 2026, gas: 3.10, movie: 11.75, stamp: 0.78, milk: 4.20, home: 435000,
}

export const PRICE_ITEMS: PriceItem[] = [
  { key: 'gas', icon: '⛽', name: 'A gallon of gas' },
  { key: 'movie', icon: '🎟️', name: 'A movie ticket' },
  { key: 'stamp', icon: '✉️', name: 'A postage stamp' },
  { key: 'milk', icon: '🥛', name: 'A gallon of milk' },
  { key: 'home', icon: '🏠', name: 'A typical house' },
]

export function pricesForYear(year: number): PriceAnchor {
  let best = ANCHORS[0]
  for (const a of ANCHORS) {
    if (Math.abs(a.year - year) < Math.abs(best.year - year)) best = a
  }
  return best
}

export function formatPrice(v: number): string {
  if (v >= 1000) return `$${Math.round(v).toLocaleString('en-US')}`
  return `$${v.toFixed(2)}`
}
