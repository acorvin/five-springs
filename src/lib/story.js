import raw from './data.json';
import { randomLcg } from 'd3-random';
import { range, shuffler } from 'd3-array';

export const DATA = raw.countries;
export const YEARS = raw.years;
export const SURVEYS = raw.surveys;
export const NAMES = Object.keys(DATA).sort();
export const GARDENS = NAMES.filter((c) => DATA[c].s.some((r) => r[1] != null));
export const N = 1000;
const NOW = 2026;

export const C = { rose: '#c06a85', slate: '#3f6c96', sepia: '#a8793a', sage: '#7d9a86', blush: '#e2b6c3', sky: '#a8c2d8', sand: '#dcc6a0', pale: '#e9e8e3' };
export const MIX = [C.slate, C.sky, C.sage, C.sand, C.sepia, C.blush, C.sky, C.sage];

// One fixed set of flowers. Their rank order is shared by every survey,
// so the flowers lost in a later garden are always among those lost in an earlier one.
export const rnd = randomLcg(0.1992);
const shuffle = (n) => shuffler(rnd)(range(n));
const pd = shuffle(N), ps = shuffle(N), pf = shuffle(N);
export const F = range(N).map((i) => ({ i, d: pd[i], s: ps[i], f: pf[i], c: MIX[Math.floor(rnd() * MIX.length)], lag: rnd() }));

export const gone = (f, w, n = w[1]) => f.d < n;
export const small = (f, w) => w[4] != null && f.s < w[4] * 10;
export const clinic = (f, w) => w[5] != null && f.f < w[5] * 10;

// The two surveys the story compares: the earliest and latest with every measure, when a country has two.
export function surveysOf(country) {
  const series = DATA[country].s.filter((r) => r[1] != null);
  const full = series.filter((r) => r[4] != null && r[5] != null);
  const use = full.length >= 2 ? full : series;
  const A = use[0], B = use[use.length - 1];
  return { series, A, B, same: A === B };
}

export const firstLast = (c, k) => {
  const v = DATA[c].s.filter((r) => r[k] != null);
  return v.length ? [v[0], v[v.length - 1]] : null;
};

// The plants follow the full analysis: two surveys at least 10 years apart.
export const MEASURES = [
  { k: 1, name: 'Reaching five', good: (a, b) => a - b, unit: 'more of every 1,000 reach five', tag: 'more per 1,000', note: 'Under-five deaths fell in all 54.', lens: 'five' },
  { k: 4, name: 'Growing tall', good: (a, b) => a - b, unit: 'points less stunting', tag: 'points lower', note: 'Stunting fell in all 48.', lens: 'small' },
  { k: 5, name: 'Clinic births', good: (a, b) => b - a, unit: 'points more births in a facility', tag: 'points higher', note: 'A plant that droops below the ground went backward. Only Madagascar did.', lens: 'clinic' },
].map((m) => ({
  ...m,
  plants: NAMES.map((name) => {
    const p = firstLast(name, m.k);
    if (!p || p[1][0] - p[0][0] < 10) return null;
    return { name, gain: m.good(p[0][m.k], p[1][m.k]) };
  }).filter(Boolean).sort((p, q) => p.gain - q.gain),
}));

// Words that follow the chosen country and the reader's seed.
export function words(cur, { A, B, same }, seed) {
  const t = {}, after = A[1] - A[2], span = B[0] - A[0];
  t.t1 = `Each seed stands for one child in every thousand born there in the years before ${A[0]}.`;
  const clinicA = A[5] == null ? null : Math.round(A[5] * 10);
  t.t2 = clinicA == null ? `The ${A[0]} survey did not record where births took place.`
    : `${clinicA < 500 ? 'Only ' : ''}${clinicA} of the thousand began in a clinic or a hospital. Your seed was ${clinic(seed, A) ? '' : 'not '}one of them.`;
  t.t3 = `The first month is the hardest. ${A[3]} seeds did not wake.`;
  t.t4 = `By the first spring, ${A[2]} had stopped.`;
  t.t5 = `${after > A[2] ? 'The danger was not over. ' : ''}By the fifth spring, ${A[1]} of the thousand were gone.`;
  t.t5b = after > A[2]
    ? `${after} of them stopped after that first spring. These were seeds that had already grown leaves, children who were already walking.`
    : `Most stopped before a first birthday. ${after} more stopped in the years after it.`;
  const share = A[1] / N, one = Math.round(1 / share);
  const odds = `${share > .08 ? 'About' : 'Only about'} one seed in ${one}`;
  const stop = gone(seed, A);
  t.fate = stop ? 'Your seed did not reach its fifth spring.' : 'Your seed flowered.';
  t.fate2 = stop
    ? `Nothing it did could have changed that. ${odds} shared its story here. A child does not choose where to begin.`
    : `${odds} did not. You chose this seed, and it could easily have been any other. A child does not choose where to begin.`;
  if (A[4] == null) { t.t7 = 'Flowering is not the whole story, but this survey did not measure how tall the flowers grew.'; t.t7b = ''; }
  else {
    const p = Math.round(A[4]);
    t.t7 = `Flowering is not the whole story. ${p >= 40 ? 'Almost half stayed small.' : p >= 25 ? 'About one in three stayed small.' : 'Some stayed small.'}`;
    t.t7b = `${p} in every 100 children were stunted: too short for their age, after years of too little good food and too much illness.`;
  }
  if (same) {
    t.t8 = `${cur} has been counted only once.`; t.t8b = 'There is no second garden to set beside the first.';
    t.t9 = `In ${A[0]}, ${N - A[1]} flowered.`; t.t9b = 'We cannot say what happened next.';
    t.t10 = 'One count is a single page of a longer story.'; t.t10b = '';
  } else {
    const c0 = A[5], c1 = B[5], gain = A[1] - B[1];
    t.t8 = `${span} springs passed, and the garden was planted again.`;
    t.t8b = c0 != null && c1 != null ? `Now ${Math.round(c1 * 10)} of the thousand began in a clinic or a hospital, ${c1 > c0 + 1 ? 'up from' : c1 < c0 - 1 ? 'down from' : 'about the same as'} ${Math.round(c0 * 10)}.` : '';
    t.t9 = `This time, ${N - B[1]} flowered.`;
    t.t9b = gain > 0 ? `Look at the pink ones. These ${gain} would have stopped in the first garden.` : 'That is no more than the first garden.';
    if (A[4] == null || B[4] == null) { t.t10 = 'How tall they grew cannot be compared here.'; t.t10b = 'Height was not measured in both surveys.'; }
    else {
      const d = A[4] - B[4], a = Math.round(A[4]), b = Math.round(B[4]);
      t.t10 = d < 5 ? 'But the small ones are almost as many as before.' : 'And far fewer stayed small.';
      t.t10b = `${b} in every 100, ${b === a ? 'the same as' : b < a ? 'down from' : 'up from'} ${a}. ${d < 5 ? 'Keeping children alive and helping them grow turned out to be two different kinds of work.' : 'Here, more children lived, and more of them grew.'}`;
    }
  }
  const last = DATA[cur].last;
  t.t13 = last < 2015 ? `${cur}'s last one was in ${last}. A child born the next spring is ${NOW - last - 1} now, and is in none of these gardens.` : `${cur} was counted as recently as ${last}. Many gardens were not.`;
  t.t13b = last < 2015 ? 'How is that garden growing? This story cannot say.' : 'How are those gardens growing? This story cannot say.';
  return t;
}
