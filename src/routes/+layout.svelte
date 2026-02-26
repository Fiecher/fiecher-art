<script lang='ts'>
  import favicon from '$lib/assets/favicon.svg'
  import './layout.css'

  const { children } = $props()
</script>

<svelte:head>
  <link rel='icon' href={favicon} />
</svelte:head>

<div class='poster-wrapper'>
  <div class='poster'>
    {@render children()}
  </div>
</div>
