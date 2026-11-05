<script>
  import { GARDENS, N, firstLast } from './story.js';

  let { name, note = '', onwalk } = $props();

  const pct = (v) => v.toFixed(1) + '%';
  const rows = $derived([['Reached five, of 1,000', 1, (v) => N - v], ['Stunted', 4, pct], ['Born in a facility', 5, pct]].map(([label, k, show]) => {
    const p = firstLast(name, k);
    if (!p) return { label, value: 'not measured', years: '' };
    const single = p[0] === p[1];
    return { label, years: single ? p[0][0] : `${p[0][0]} to ${p[1][0]}`, value: single ? show(p[0][k]) : `${show(p[0][k])} to ${show(p[1][k])}` };
  }));
</script>

<div class="card">
  <h3>{name}</h3>
  {#if note}<small>{note}</small>{/if}
  {#each rows as r (r.label)}
    <div class="row"><span>{r.label}{#if r.years}<em>{r.years}</em>{/if}</span><span>{r.value}</span></div>
  {/each}
  {#if GARDENS.includes(name)}
    <button type="button" class="walk" onclick={onwalk}>Walk into this garden</button>
  {/if}
</div>
