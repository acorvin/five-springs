<script>
  import { onMount } from 'svelte';
  import { createGarden } from './lib/garden.js';
  import { C, DATA, F, GARDENS, MEASURES, N, surveysOf, words } from './lib/story.js';
  import Card from './lib/Card.svelte';
  import DigDeeper from './lib/DigDeeper.svelte';
  import LineChart from './lib/LineChart.svelte';
  import WalkPanel from './lib/WalkPanel.svelte';
  import WhenChart from './lib/WhenChart.svelte';

  let country = $state('Niger');
  let step = $state(0);
  let seedIndex = $state(Math.floor(Math.random() * N));
  let picked = $state(false);
  let measure = $state(0);
  let free = $state(null);
  let card = $state(null);
  let tag = $state({ place: '', sub: '' });
  let size = $state({ w: 0, h: 0 });
  let narrow = $state(false);
  let coarse = $state(false);

  let stage, svgEl, stepsEl, garden = $state(null);

  const surveys = $derived(surveysOf(country));
  const A = $derived(surveys.A);
  const B = $derived(surveys.B);
  const seed = $derived(F[seedIndex]);
  const t = $derived(words(country, surveys, seed));
  const rowsOf = (k, f = (v) => v) => DATA[country].s.filter((r) => r[k] != null).map((r) => [r[0], f(r[k])]);
  const verb = $derived(coarse ? 'Tap' : 'Click');

  // Redraw whenever the page, the country, the seed or the walk changes.
  $effect(() => {
    if (!garden || !size.w) return;
    garden.resize(size.w, size.h);
    garden.show({ step, cur: country, A, B, same: surveys.same, seed, series: surveys.series, measure, free: free && { ...free } });
  });

  function turnTo(i) {
    if (i === step) return;
    step = i; free = null; card = null;
  }
  function choose(i) { seedIndex = i; picked = true; }
  function setCountry(c) { country = c; card = null; }
  function walk(c, lens = 'five') {
    country = c; card = null;
    free = { i: surveysOf(c).series.length - 1, lens };
  }
  function setMeasure(i) { measure = i; free = null; card = null; }

  onMount(() => {
    const q = matchMedia('(max-width: 760px)');
    const syncQ = () => { narrow = q.matches; coarse = matchMedia('(pointer: coarse)').matches; };
    syncQ(); q.addEventListener('change', syncQ);
    garden = createGarden(svgEl, { onPick: choose, onCard: (c) => { card = c; }, onTag: (x) => { tag = x; } });

    // Page turns come from scroll position, which behaves the same inside an embedded frame.
    const pages = [...stepsEl.querySelectorAll('.step')];
    let ticking = false;
    const track = () => {
      ticking = false;
      const edge = innerHeight * (q.matches ? .88 : .65);
      let i = 0;
      pages.forEach((p, k) => { if (p.getBoundingClientRect().top <= edge) i = k; });
      turnTo(i);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(track); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    const ro = new ResizeObserver(() => { const b = stage.getBoundingClientRect(); size = { w: b.width, h: b.height }; });
    ro.observe(stage);
    track();
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); ro.disconnect(); q.removeEventListener('change', syncQ); };
  });
</script>

{#snippet countries(id)}
  <label for={id} hidden>Country</label>
  <select {id} value={country} style:width={id === 'c1' ? `${country.length * .62 + 2}em` : null} onchange={(e) => setCountry(e.currentTarget.value)}>
    {#each GARDENS as c (c)}<option value={c}>{c}</option>{/each}
  </select>
{/snippet}

<div class="book">
  <div class="stage" bind:this={stage}>
    <svg class="main" bind:this={svgEl} role="group" aria-label="A garden of 1,000 flowers that changes with the story"></svg>
    <div class="tag" aria-live="polite">
      {#if tag.count != null}<b>{tag.count.toLocaleString('en-US')}</b>{#if tag.label}{tag.label}<br />{/if}{/if}
      {#if tag.sub}{tag.place}<br />{tag.sub}{/if}
    </div>
    {#if step >= 1 && step <= 10 && !free}<div class="where">{@render countries('c2')}</div>{/if}
    {#if free}
      <WalkPanel {country} series={surveys.series} {free} onyear={(i) => { free = { ...free, i }; }} onlens={(lens) => { free = { ...free, lens }; }} onback={() => { free = null; }} />
    {:else if card}
      {#key card.name}<Card name={card.name} note={card.note} onwalk={() => walk(card.name, card.lens)} />{/key}
    {/if}
  </div>

  <div class="steps" bind:this={stepsEl}>
    <section class="step"><div class="inner">
      <h1>Five Springs</h1>
      <p class="big">A story about the children who get to turn five, in any of 87 countries. It is told with flowers, and every number in it comes from a real survey.</p>
      <p class="hint">Scroll to turn the page</p>
    </div></section>

    <section class="step"><div class="inner">
      <p class="big">Once, in {@render countries('c1')}, one thousand seeds were planted.</p>
      <p class="small">{t.t1}</p>
      <p class="big">{picked ? 'This one is yours. Keep scrolling.' : 'Choose one. It is yours to follow.'}</p>
      <p class="howto">{picked ? `Your seed is the pink one in the ring. ${verb} another seed to change it.` : `${verb} any seed on the hills ${narrow ? 'above' : 'to the right'}.`}</p>
      <button type="button" class="link" onclick={() => choose(Math.floor(Math.random() * N))}>{picked ? 'Or pick another at random' : 'Or pick one at random'}</button>
    </div></section>

    <section class="step"><div class="inner">
      <p class="big">A new seed does best with careful hands nearby.</p>
      <p class="big">{t.t2}</p>
      <DigDeeper caption="Births in a health facility in {country}, in each survey."><LineChart rows={rowsOf(5)} unit="%" color={C.slate} /></DigDeeper>
    </div></section>

    <section class="step"><div class="inner"><p class="big">{t.t3}</p></div></section>

    <section class="step"><div class="inner">
      <p class="big">{t.t4}</p>
      <p class="small">The rest pushed up their first green leaves.</p>
    </div></section>

    <section class="step"><div class="inner">
      <p class="big">{t.t5}</p>
      <p class="small">{t.t5b}</p>
      <DigDeeper caption="Of every 1,000 births, how many died, and when."><WhenChart {A} {B} same={surveys.same} /></DigDeeper>
    </div></section>

    <section class="step"><div class="inner">
      <p class="big">{t.fate}</p>
      <p class="small">{t.fate2}</p>
    </div></section>

    <section class="step"><div class="inner">
      <p class="big">{t.t7}</p>
      {#if t.t7b}<p class="small">{t.t7b}</p>{/if}
      <DigDeeper caption="Child stunting in {country}, in each survey."><LineChart rows={rowsOf(4)} unit="%" color={C.sepia} /></DigDeeper>
    </div></section>

    <section class="step"><div class="inner">
      <p class="big">{t.t8}</p>
      {#if t.t8b}<p class="small">{t.t8b}</p>{/if}
    </div></section>

    <section class="step"><div class="inner">
      <p class="big">{t.t9}</p>
      <p class="big">{t.t9b}</p>
      <DigDeeper caption="Children reaching five, of every 1,000, in {country}, in each survey."><LineChart rows={rowsOf(1, (v) => N - v)} color={C.rose} /></DigDeeper>
    </div></section>

    <section class="step"><div class="inner">
      <p class="big">{t.t10}</p>
      {#if t.t10b}<p class="small">{t.t10b}</p>{/if}
    </div></section>

    <section class="step"><div class="inner">
      <p class="big">Every country has its own garden.</p>
      <p class="small">The taller the plant, the further that country moved between its first and latest surveys. {MEASURES[measure].note}</p>
      <div class="tabsM" role="group" aria-label="Which measure the plants show">
        {#each MEASURES as m, i (m.name)}
          <button type="button" aria-pressed={i === measure} onclick={() => setMeasure(i)}>{m.name}</button>
        {/each}
      </div>
      <p class="hint">Choose a plant to open its story</p>
    </div></section>

    <section class="step"><div class="inner">
      <p class="big">We know all of this because someone went from door to door and counted.</p>
      <p class="small">Each flower here is one of the 322 surveys. There were about ten a year in the 2010s, and about four a year since 2020.</p>
      <p class="hint">Choose a flower to see where it was, or press Tab and use the arrow keys</p>
    </div></section>

    <section class="step"><div class="inner">
      <p class="big">In 39 of 87 countries, no one has come with this survey since before 2015.</p>
      <p class="small">{t.t13}</p>
      <p class="big">{t.t13b}</p>
      <p class="hint">Each flower is a country, placed at its last survey. Choose one, or press Tab and use the arrow keys</p>
    </div></section>
  </div>
</div>

<div class="after">
  <h2>What is true here, and what is only the story</h2>
  <ul>
    <li>No flower is a real child. Each one stands for one in 1,000 births at the rate a survey measured for the five years before it.</li>
    <li>The counts at one month, one year and five years are data. The garden's look between them is not.</li>
    <li>Your seed's fate is drawn from the same rates. The surveys report these measures separately, so which flowers are small, and which began in a clinic, is assigned independently. Nothing here says that one causes another.</li>
    <li>All 322 standard DHS surveys from 87 countries are here. The program works mostly in low- and middle-income countries, so many countries were never part of it. One survey, Albania 2017, has no under-five figure, so it can be seen in Albania's card but not walked into as a garden.</li>
    <li>The plants use only countries with two surveys at least 10 years apart, which gives 54 for survival, 48 for stunting and 52 for clinic births. The story itself compares the earliest and latest surveys with every measure, and says how far apart they are.</li>
    <li>"No survey" means no completed standard DHS survey in the program's listing in November 2026. Many countries also have other surveys, so a quiet garden here does not mean nothing is known about it.</li>
    <li>This is independent work with public data, not affiliated with or endorsed by the DHS Program, ICF or USAID.</li>
  </ul>
  <p class="src">Data: <a href="https://api.dhsprogram.com/">DHS Program API</a>, retrieved November 2026. The full analysis: <a href="https://alexcorvin.io/work/child-health-by-country">Child Health, Country by Country</a>.</p>
</div>
