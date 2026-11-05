import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Relative base so the built page works from any GitHub Pages path.
// The build goes to docs/, which GitHub Pages serves from the main branch.
export default defineConfig({
  base: './',
  plugins: [svelte()],
  build: { outDir: 'docs', emptyOutDir: true },
});
