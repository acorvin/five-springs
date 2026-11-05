<script>
  import { scaleLinear } from 'd3-scale';
  import { C } from './story.js';

  let { A, B, same } = $props();

  const w = 320, h = 118;
  const colors = [C.sepia, C.slate, C.rose];
  const labels = [['First month', 0], ['Rest of first year', 76], ['Ages one to four', 182]];
  const parts = (r) => [r[3], r[2] - r[3], r[1] - r[2]];
  const x = $derived(scaleLinear([0, Math.max(A[1], B[1])], [40, w - 8]));
  const bars = $derived((same ? [A] : [A, B]).map((r, row) => {
    let at = 0;
    return { year: r[0], y: 6 + row * 36, segs: parts(r).map((n, k) => { const s = { n, k, x0: x(at), x1: x(at + n) }; at += n; return s; }) };
  }));
  const said = $derived(bars.map((b) => `${b.year}: ${b.segs[0].n} in the first month, ${b.segs[1].n} in the rest of the first year, ${b.segs[2].n} at ages one to four`).join('. '));
</script>

<svg viewBox="0 0 {w} {h}" role="img" aria-label={said}>
  {#each bars as b (b.year)}
    <text y={b.y + 16} font-size="11" fill="#5a5e66">{b.year}</text>
    {#each b.segs as s (s.k)}
      <rect x={s.x0 + .5} y={b.y} width={Math.max(0, s.x1 - s.x0 - 1)} height="24" fill={colors[s.k]} />
      {#if s.x1 - s.x0 > 22}
        <text x={(s.x0 + s.x1) / 2} y={b.y + 16} text-anchor="middle" font-size="11" fill="#fff">{s.n}</text>
      {/if}
    {/each}
  {/each}
  {#if same}
    <text y="58" font-size="12" fill="#5a5e66">Only one survey, so there is nothing to compare.</text>
  {/if}
  {#each labels as [text, lx], k (text)}
    <rect x={lx} y="92" width="9" height="9" fill={colors[k]} />
    <text x={lx + 13} y="100" font-size="10.5" fill="#5a5e66">{text}</text>
  {/each}
</svg>
