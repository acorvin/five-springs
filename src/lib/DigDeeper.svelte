<script>
  let { caption, children } = $props();
</script>

<details class="flap">
  <summary>Dig deeper</summary>
  <div class="under">
    <p>{caption}</p>
    {@render children()}
  </div>
</details>
