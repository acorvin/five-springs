// The stage. D3 owns everything drawn in the SVG; Svelte owns the words and controls around it.
import { select, pointer } from 'd3-selection';
import 'd3-transition';
import { transition } from 'd3-transition';
import { easeCubicInOut } from 'd3-ease';
import { line, curveBasis } from 'd3-shape';
import { scaleBand, scaleLinear, scalePoint } from 'd3-scale';
import { least, max, min, range, rollup } from 'd3-array';
import { C, F, MIX, N, MEASURES, NAMES, DATA, YEARS, SURVEYS, rnd, gone, small, clinic } from './story.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const seedPath = 'M0,-5 C3.4,-2 3.6,2.4 0,4.4 C-3.6,2.4 -3.4,-2 0,-5 Z';

// Eight paper hills, back to front. Each holds a row of flowers, and each hill's paper covers the feet of its own row.
const ROWS = [190, 165, 145, 130, 115, 100, 85, 70].map((n, i) => ({
  n, k: [.5, .58, .68, .78, .9, 1.04, 1.2, 1.4][i], f: 1.1 + (i * 0.73) % 1.4, ph: i * 1.9,
  tint: ['#eef3f7', '#eaf1ec', '#f5efe4', '#f6ebee', '#e3ecf3', '#e3ede6', '#f0e6d5', '#f1e1e6'][i],
}));
{ let at = 0; ROWS.forEach((R, r) => { range(R.n).forEach((k) => { const d = F[at++]; d.r = r; d.u = (k + .5 + (rnd() - .5) * .7) / R.n; }); }); }

const crestOf = (H) => (R, r, u) => H * (.40 + .54 * Math.pow(r / 7, 1.15)) + Math.sin(u * Math.PI * 2 * R.f + R.ph) * H * .022;
const stopFrac = (d, w) => (d.d < w[3] ? 0 : d.d < w[2] ? .08 + .2 * d.lag : .3 + .5 * d.lag);
const dim = (fn, c) => (d) => (fn(d) ? c : C.pale);

export function createGarden(el, { onPick, onCard, onTag }) {
  const svg = select(el);
  const defs = svg.append('defs');
  defs.append('path').attr('id', 'seedP').attr('d', seedPath);
  const bloom = defs.append('g').attr('id', 'bloomP');
  [[0, -5.6], [5.3, -1.7], [3.3, 4.5], [-3.3, 4.5], [-5.3, -1.7]].forEach(([cx, cy]) => bloom.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 4.3));
  bloom.append('circle').attr('r', 2.5).attr('fill', '#fff');
  const sun = svg.append('circle').attr('fill', '#f3e6cc');
  const world = svg.append('g'), extra = svg.append('g'), mark = svg.append('g').attr('class', 'mark');
  const hover = svg.append('g').style('display', 'none').style('pointer-events', 'none');
  hover.append('circle').attr('r', 11).attr('fill', 'none').attr('stroke', C.rose).attr('stroke-width', 2);
  mark.append('circle').attr('fill', 'none').attr('stroke', '#1c1e21').attr('stroke-width', 1.5).attr('r', 11);
  mark.append('text').attr('text-anchor', 'middle').attr('y', -17).text('your seed');

  const rows = world.selectAll('g.row').data(ROWS).join('g').attr('class', 'row');
  const flowers = rows.append('g'), hills = rows.append('path').attr('fill', (d) => d.tint);
  const nodes = flowers.selectAll('g.f').data((R, r) => F.filter((d) => d.r === r)).join('g').attr('class', 'f');
  const stems = nodes.append('line').attr('class', 'st');
  const heads = nodes.append('g');
  heads.append('use').attr('class', 'sd').attr('href', '#seedP').attr('fill', C.sepia);
  heads.append('use').attr('class', 'bl').attr('href', '#bloomP').attr('fill', (d) => d.c);

  let W = 0, H = 0, drawn = false, pickOn = false, clickFn = null, mine = F[0];

  function terrain() {
    const sz = Math.max(.62, Math.min(1.2, W / 640)), crest = crestOf(H);
    F.forEach((d) => {
      const R = ROWS[d.r];
      d.x = d.u * W; d.cy = crest(R, d.r, d.u) + 2; d.L = 50 * R.k * sz; d.k = 1.02 * R.k * sz * (W < 520 ? .68 : 1);
    });
    hills.attr('d', (R, r) => line().curve(curveBasis)(range(0, 1.0001, .02).map((u) => [u * W, crest(R, r, u)])) + `L${W},${H}L0,${H}Z`);
    stems.attr('x1', (d) => d.x).attr('x2', (d) => d.x).attr('y1', (d) => d.cy);
    if (!drawn) {
      stems.attr('y2', (d) => d.cy - d.L);
      heads.attr('transform', (d) => `translate(${d.x},${d.cy - d.L}) scale(${d.k})`);
      drawn = true;
    }
  }

  function view({ w, n, grow, tag, count, label, color, focus, short, pick, seed, sun: s, noMark }) {
    extra.selectAll('*').remove(); clickFn = null;
    world.style('display', null); sun.style('display', null);
    onTag({ place: tag[0], sub: tag[1], count, label: label ?? 'flowers' });
    F.forEach((d) => {
      d.stop = gone(d, w, n);
      d.hy = d.cy - Math.max(7 * d.k, d.L * (d.stop ? stopFrac(d, w) : grow * (short && small(d, w) ? .55 : 1)));
    });
    const t = transition().duration(reduce ? 0 : 900).ease(easeCubicInOut), lag = (d) => (reduce ? 0 : d.lag * 260);
    nodes.classed('rest', (d) => d.stop);
    stems.transition(t).delay(lag).attr('y2', (d) => d.hy);
    heads.transition(t).delay(lag).attr('transform', (d) => `translate(${d.x},${d.hy}) scale(${d.k})`);
    nodes.attr('opacity', (d) => (focus && d !== mine ? .2 : 1));
    heads.select('.sd').attr('fill', (d) => (seed ? seed(d) : d === mine && !noMark ? C.rose : C.sepia)).style('opacity', (d) => (d.stop || grow < .1 ? 1 : 0));
    heads.select('.bl').attr('fill', (d) => (color ? color(d) : d.c)).style('opacity', (d) => (!d.stop && grow >= .1 ? 1 : 0)).style('transform', `scale(${Math.min(1, .3 + grow * 1.1)})`);
    sun.transition(t).attr('cx', W * (.08 + s * .7)).attr('cy', H * (.2 - s * .12)).attr('r', Math.min(W, H) * .07);
    svg.classed('pickable', !!pick); pickOn = !!pick;
    hover.style('display', 'none');
    mark.style('display', noMark ? 'none' : null).transition(t).attr('transform', `translate(${Math.max(14, Math.min(W - 14, mine.x))},${mine.hy})`);
    mark.select('text').attr('x', mine.x < 50 ? 34 : mine.x > W - 50 ? -34 : 0);
  }

  function clear() {
    world.style('display', 'none'); sun.style('display', 'none'); mark.style('display', 'none');
    svg.classed('pickable', false); pickOn = false; clickFn = null; extra.selectAll('*').remove();
  }

  function smallPage(w, cur, isB) {
    const place = `${cur}, ${w[0]}`;
    if (w[4] == null) return view({ w, n: w[1], grow: 1, tag: [place, 'height not measured'], sun: .6, noMark: isB });
    const low = F.filter((d) => !gone(d, w) && small(d, w)).length;
    view({ w, n: w[1], grow: 1, tag: [place, 'stayed small'], count: low, label: '', sun: .6, short: true, noMark: isB, color: dim((d) => small(d, w), C.sepia) });
  }

  function plants(cur, measure) {
    clear();
    const M = MEASURES[measure], P = M.plants, narrow = W < 520;
    onTag({ place: narrow ? '' : `${P.length} countries`, sub: narrow ? '' : M.tag });
    const m = { l: 34, r: 12, t: narrow ? 124 : 200, b: 28 };
    const lo = Math.min(0, min(P, (d) => d.gain)), hi = max(P, (d) => d.gain);
    const x = scalePoint(P.map((d) => d.name), [m.l + 6, W - m.r - 6]), y = scaleLinear([lo, hi], [H - m.b, m.t]).nice(), y0 = y(0);
    const g = extra.append('g');
    g.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y0).attr('y2', y0).attr('stroke', '#d8d8d3');
    y.ticks(4).forEach((t) => g.append('text').attr('class', 'ax').attr('x', m.l - 6).attr('y', y(t) + 4).attr('text-anchor', 'end').text(t));
    const r = Math.min(1, x.step() / 13) * .62 + .15, base = (p) => MIX[p.name.length % MIX.length];
    const pl = g.selectAll('g.plant').data(P).join('g').attr('class', 'plant').attr('tabindex', 0).attr('role', 'button').attr('aria-label', (d) => `${d.name}: ${d.gain.toFixed(1)} ${M.unit}`);
    pl.append('path').attr('class', 'stem').attr('d', (d, i) => { const X = x(d.name), mid = (y0 + y(d.gain)) / 2; return `M${X},${y0} C${X},${mid} ${X + (i % 2 ? 4 : -4)},${mid} ${X},${y(d.gain)}`; });
    pl.append('use').attr('href', '#bloomP').attr('fill', (p) => (p.name === cur ? C.rose : base(p))).attr('transform', (d) => `translate(${x(d.name)},${reduce ? y(d.gain) : y0}) scale(${r})`)
      .transition().duration(reduce ? 0 : 900).delay((d, i) => i * 12).attr('transform', (d) => `translate(${x(d.name)},${y(d.gain)}) scale(${r})`);
    pl.append('rect').attr('x', (d) => x(d.name) - x.step() / 2).attr('width', x.step()).attr('y', m.t - 14).attr('height', H - m.t + 14).attr('fill', 'transparent');
    const open = (d) => { onCard({ name: d.name, lens: M.lens }); pl.select('use').attr('fill', (p) => (p === d ? C.rose : base(p))); };
    pl.on('click', (e, d) => open(d)).on('keydown', (e, d) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(d); } });
    onCard({ name: (P.find((d) => d.name === cur) || P[P.length - 1]).name, lens: M.lens });
  }

  const yearAxis = (g, x, m) => {
    g.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', H - m.b).attr('y2', H - m.b).attr('stroke', '#e3e4e1');
    [1985, 1995, 2005, 2015, 2025].forEach((yr) => g.append('text').attr('class', 'ax').attr('text-anchor', yr === 1985 ? 'start' : yr === 2025 ? 'end' : 'middle').attr('x', x(yr) + x.bandwidth() / 2).attr('y', H - m.b + 18).text(yr));
  };

  // Each flower is one survey, and each can be opened.
  function counts(cur) {
    clear();
    onTag({ place: W < 520 ? '' : '322 surveys', sub: W < 520 ? '' : '1985 to 2025' });
    const m = { l: 10, r: 10, t: W < 520 ? 124 : 190, b: 30 };
    const x = scaleBand(YEARS.map((d) => d[0]), [m.l, W - m.r]).padding(.08);
    const u = (H - m.t - m.b) / 15.5, hs = Math.min(x.bandwidth() * 1.15, u * 1.1) / 21;
    const g = extra.append('g'), seen = {};
    const pts = SURVEYS.map(([yr, name]) => { const k = seen[yr] = (seen[yr] ?? -1) + 1; return { yr, k, name, X: x(yr) + x.bandwidth() / 2, Y: H - m.b - (k + .5) * u }; });
    const shade = (p, on) => (p.name === on ? C.rose : p.yr >= 2020 ? C.slate : MIX[(p.yr + p.k) % MIX.length]);
    g.selectAll('line.s').data(YEARS).join('line').attr('class', 'stem').attr('x1', (d) => x(d[0]) + x.bandwidth() / 2).attr('x2', (d) => x(d[0]) + x.bandwidth() / 2).attr('y1', H - m.b).attr('y2', (d) => H - m.b - (d[1] - .5) * u);
    const marks = g.selectAll('use').data(pts).join('use').attr('href', '#bloomP').attr('fill', (d) => shade(d, cur)).attr('transform', (d) => `translate(${d.X},${d.Y}) scale(${hs})`);
    yearAxis(g, x, m);
    clickFn = (px, py) => {
      const d = least(pts, (p) => (p.X - px) ** 2 + (p.Y - py) ** 2);
      if (Math.hypot(d.X - px, d.Y - py) > 30) return;
      marks.attr('fill', (p) => shade(p, d.name));
      onCard({ name: d.name, lens: 'five', note: `Survey of ${d.yr}. Its other surveys are pink.` });
    };
  }

  // Every country at the year of its last survey.
  function silence(cur) {
    clear();
    onTag({ place: W < 520 ? '' : '87 countries', sub: W < 520 ? '' : 'by last survey' });
    const m = { l: 10, r: 10, t: W < 520 ? 124 : 190, b: 30 };
    const P = NAMES.map((name) => ({ name, last: DATA[name].last })).sort((a, b) => a.last - b.last || a.name.localeCompare(b.name));
    const x = scaleBand(range(1985, 2026), [m.l, W - m.r]).padding(.08), seen = {};
    const u = Math.min((H - m.t - m.b) / max(rollup(P, (v) => v.length, (d) => d.last).values()), 26);
    P.forEach((d) => { d.k = seen[d.last] = (seen[d.last] ?? -1) + 1; d.X = x(d.last) + x.bandwidth() / 2; d.Y = H - m.b - (d.k + .5) * u; });
    const g = extra.append('g'), hs = Math.min(x.bandwidth() * 1.6, u) / 21;
    const shade = (p, on) => (p.name === on ? C.rose : p.last < 2015 ? C.sand : C.sage);
    const marks = g.selectAll('use').data(P).join('use').attr('href', '#bloomP').attr('fill', (d) => shade(d, cur)).attr('transform', (d) => `translate(${d.X},${d.Y}) scale(${hs})`);
    yearAxis(g, x, m);
    const sx = x(2015) - 1;
    g.append('line').attr('x1', sx).attr('x2', sx).attr('y1', H - m.b).attr('y2', m.t).attr('stroke', '#d8d8d3').attr('stroke-dasharray', '3 4');
    g.append('text').attr('class', 'note').attr('x', sx - 8).attr('y', H - m.b - 7 * u).attr('text-anchor', 'end').text('39 countries');
    clickFn = (px, py) => {
      const d = least(P, (p) => (p.X - px) ** 2 + (p.Y - py) ** 2);
      if (Math.hypot(d.X - px, d.Y - py) > 30) return;
      marks.attr('fill', (p) => shade(p, d.name));
      onCard({ name: d.name, lens: 'five', note: `Last survey ${d.last}.` });
    };
  }

  function walk(w, lens) {
    const on = lens === 'small' && w[4] != null ? 'small' : lens === 'clinic' && w[5] != null ? 'clinic' : 'five';
    const common = { w, n: w[1], grow: 1, sun: .6, noMark: true };
    if (on === 'small') view({ ...common, tag: [`${w[0]} survey`, 'stunted'], count: w[4], label: 'in every 100', short: true, color: dim((d) => small(d, w), C.sepia) });
    else if (on === 'clinic') view({ ...common, tag: [`${w[0]} survey`, 'facility births'], count: w[5], label: 'in every 100', color: dim((d) => clinic(d, w), C.slate) });
    else view({ ...common, tag: [`${w[0]} survey`, 'of 1,000 reached five'], count: N - w[1], label: '' });
    sun.style('display', 'none');
  }

  // Draws whichever page of the book is open.
  function show({ step, cur, A, B, same, seed, free, series, measure }) {
    if (!W) return;
    mine = seed;
    if (free) return walk(series[free.i], free.lens);
    const p = (w) => `${cur}, ${w[0]}`;
    switch (step) {
      case 0: return view({ w: A, n: 0, grow: 1, tag: ['', ''], sun: .1, noMark: true });
      case 1: return view({ w: A, n: 0, grow: 0, tag: [p(A), '1,000 seeds'], sun: .1, pick: true });
      case 2: return view({ w: A, n: 0, grow: 0, tag: [p(A), A[5] == null ? 'not measured' : 'began in a clinic or hospital'], count: A[5] == null ? null : Math.round(A[5] * 10), label: '', sun: .1, pick: true, seed: A[5] == null ? null : (d) => (clinic(d, A) ? C.slate : '#d9d7d0') });
      case 3: return view({ w: A, n: A[3], grow: .14, tag: [p(A), 'one month'], count: N - A[3], label: 'still growing', sun: .2 });
      case 4: return view({ w: A, n: A[2], grow: .4, tag: [p(A), 'first spring'], count: N - A[2], label: 'still growing', sun: .35 });
      case 5: return view({ w: A, n: A[1], grow: 1, tag: [p(A), 'fifth spring'], count: N - A[1], sun: .6 });
      case 6: return view({ w: A, n: A[1], grow: 1, tag: [p(A), 'fifth spring'], count: N - A[1], sun: .6, focus: true });
      case 7: return smallPage(A, cur, false);
      case 8: return view({ w: B, n: 0, grow: 0, tag: [p(B), '1,000 seeds'], sun: .1, noMark: true });
      case 9: return view({ w: B, n: B[1], grow: 1, tag: [p(B), 'fifth spring'], count: N - B[1], sun: .6, noMark: true, color: same ? null : dim((d) => d.d < A[1], C.rose) });
      case 10: return smallPage(B, cur, true);
      case 11: return plants(cur, measure);
      case 12: return counts(cur);
      default: return silence(cur);
    }
  }

  const nearest = (e) => { const [px, py] = pointer(e, el); return least(F, (d) => (d.x - px) ** 2 + (d.hy - py) ** 2); };
  svg.on('click', (e) => {
    if (clickFn) { const [px, py] = pointer(e, el); return clickFn(px, py); }
    if (pickOn) { hover.style('display', 'none'); onPick(nearest(e).i); }
  });
  svg.on('pointermove', (e) => {
    if (!pickOn || e.pointerType === 'touch') return hover.style('display', 'none');
    const d = nearest(e); hover.style('display', null).attr('transform', `translate(${d.x},${d.hy})`);
  }).on('pointerleave', () => hover.style('display', 'none'));

  return { resize(w, h) { W = w; H = h; terrain(); }, show };
}
