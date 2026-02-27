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
