<script>
  let { country, series, free, onyear, onlens, onback } = $props();

  const w = $derived(series[free.i]);
  const lenses = $derived([['five', 'Reached five', false], ['small', 'Stayed small', w[4] == null], ['clinic', 'Clinic births', w[5] == null]]);
</script>

<div class="free">
  <h3>{country}</h3>
  <div class="chips" role="group" aria-label="Survey year">
    {#each series as r, i (r[0])}
      <button type="button" aria-pressed={i === free.i} onclick={() => onyear(i)}>{r[0]}</button>
    {/each}
  </div>
  <div class="chips lens" role="group" aria-label="Measure">
    {#each lenses as [key, label, off] (key)}
      <button type="button" aria-pressed={free.lens === key} disabled={off} onclick={() => onlens(key)}>{label}</button>
    {/each}
  </div>
  <button type="button" class="link" onclick={onback}>Back to the story</button>
</div>
