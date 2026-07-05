# Your Lifetime

Interactive scroll-through history of your life. Enter your date of birth and explore:

1. People born on your exact date
2. People who died the day you were born
3. The #1 song (Billboard Hot 100, Aug 1958+) and #1 movie (US box office, 1982+) on your birth date — earlier dates get a link to that year's music/film overview
4. Historical events on your exact birth date (+ that day in other years)
5. Technology invented after you were born, with your age when each arrived
6. Major world events during your lifetime, with your age at each

Live data comes from Wikipedia's free [On This Day API](https://api.wikimedia.org/wiki/Feed_API/Reference/On_this_day) and Wikipedia's weekly number-one chart pages (parsed in the browser, `src/charts.js`) — no API keys. Curated datasets live in `src/data/worldEvents.js` and `src/data/technology.js` (edit freely to add more).

## Run it

```bash
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173).

## Build for hosting

```bash
npm run build
```

Deploy the `dist/` folder anywhere static (GitHub Pages, Netlify, Vercel).
