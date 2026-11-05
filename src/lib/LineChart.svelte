<script>
  import { scaleLinear } from 'd3-scale';
  import { extent, max } from 'd3-array';
  import { line } from 'd3-shape';

  let { rows, unit = '', color } = $props();

  const w = 320, h = 118, m = { l: 8, r: 22, t: 16, b: 20 };
  const x = $derived(rows.length > 1 ? scaleLinear(extent(rows, (d) => d[0]), [m.l + 12, w - m.r]) : () => w / 2);
  const y = $derived(scaleLinear([0, max(rows, (d) => d[1])], [h - m.b, m.t]));
  const path = $derived(line((d) => x(d[0]), (d) => y(d[1]))(rows));
  const labelled = (i) => rows.length <= 5 || i === 0 || i === rows.length - 1;
</script>

{#if rows.length}
  <svg viewBox="0 0 {w} {h}" role="img" aria-label={rows.map((d) => `${d[0]}: ${d[1]}${unit}`).join(', ')}>
    <path d={path} fill="none" stroke={color} stroke-width="2" />
    {#each rows as d, i (d[0])}
      <circle cx={x(d[0])} cy={y(d[1])} r="3.5" fill={color} stroke="#f8f7f4" stroke-width="1.5" />
      {#if labelled(i)}
        <text x={x(d[0])} y={y(d[1]) - 8} text-anchor="middle" font-size="11" fill="#1c1e21">{d[1]}{unit}</text>
        <text x={x(d[0])} y={h - 4} text-anchor="middle" font-size="11" fill="#5a5e66">{d[0]}</text>
      {/if}
    {/each}
    {#if rows.length === 1}
      <text x={w / 2} y={h / 2 + 12} text-anchor="middle" font-size="12" fill="#5a5e66">Only one survey, so there is no trend to show.</text>
    {/if}
  </svg>
{:else}
  <p>Not measured in this country.</p>
{/if}
