<script lang='ts'>
  import favicon from '$lib/assets/favicon.svg'
  import Scrollbar from '$lib/components/layout/Scrollbar.svelte'
  import { activeSection } from '$lib/navigation'
  import './layout.css'

  const { children } = $props()
</script>

<svelte:head>
  <link rel='icon' href={favicon} />
</svelte:head>

<div class='poster-wrapper'>
  <div class='poster'>
    {@render children()}
    <Scrollbar active={$activeSection} />
  </div>
</div>

<style>
.poster-wrapper {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    overflow: hidden;
}

.poster {
    aspect-ratio: 2 / 3;
    height: 100vh;
    max-width: 100vw;
    background: var(--color-primary);
    display: flex;
    flex-direction: column;
}
</style>
