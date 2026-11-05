# Five Springs

A picture-book data story about the children who get to turn five. A garden of 1,000 flowers stands for 1,000 births, and the reader follows one seed through five springs in any of 87 countries.

**[Read the story](https://acorvin.github.io/five-springs/)**

It is the companion to [Child Health, Country by Country](https://github.com/acorvin/dhs-health-indicator-change), which holds the full analysis. That project answers how far each country moved. This one tells the same data as a story.

## What is in it

All 322 standard Demographic and Health Surveys from 87 countries, with five measures from each: under-five, infant and neonatal mortality, child stunting and births in a health facility. Coverage is set by the DHS Program, which works mostly in low- and middle-income countries.

- Scroll to turn the pages. The garden stays in place while the story moves.
- Choose a country and a seed, and the story retells itself.
- Dig deeper opens the survey figures under each part of the story.
- Every plant, survey and country opens a card, and any garden can be walked through survey by survey and measure by measure.

## What is data and what is story

- No flower is a real child. Each stands for one in 1,000 births at the rate a survey measured for the five years before it.
- The counts at one month, one year and five years are data. The look of the garden between them is not.
- The surveys publish these measures separately. Which flowers are small, and which began in a clinic, is assigned independently, so the drawing says nothing about one measure causing another.
- "No survey" means no completed standard DHS survey in the listing in November 2026. Many countries have other surveys.

## Running it

The page is built with Svelte and D3. It needs Node 20.19 or later.

```bash
npm install
npm run dev
```

`npm run build` writes the page to `docs/`, which GitHub Pages serves from the main branch.

## Rebuilding the data

The raw API responses are kept in `data/raw/`.

```bash
python3 scripts/collect.py   # download fresh copies from the DHS Program API
python3 scripts/build.py     # write src/lib/data.json
python3 scripts/verify.py    # check every value and fixed figure against the raw files
```

The Python scripts use only the standard library.

## Source

National indicator values from the [DHS Program API](https://api.dhsprogram.com/), retrieved in November 2026. This is independent work with public data, not affiliated with or endorsed by the DHS Program, ICF or USAID.
