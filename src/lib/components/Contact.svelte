<script lang='ts'>
  import APP_CONFIG from '$lib/config'
  import { onMount, tick } from 'svelte'

  type Credit = { role: string, name: string, href?: string }

  const PRIMARY: Credit[] = [
    { role: 'contact via', name: 'Mail', href: APP_CONFIG.social.email },
    { role: '', name: 'Telegram', href: APP_CONFIG.social.telegram },
    { role: 'follow on', name: 'Blog', href: APP_CONFIG.social.telegramChannel },
    { role: '', name: 'YouTube', href: APP_CONFIG.social.youtube },
    { role: '', name: 'ArtStation', href: APP_CONFIG.social.artstation },
  ]
  const EXTRA: Credit[] = [
    { role: '', name: 'Behance', href: APP_CONFIG.social.behance },
    { role: '', name: 'Twitter', href: APP_CONFIG.social.twitter },
    { role: '', name: 'BlueSky', href: APP_CONFIG.social.bluesky },
    { role: '', name: 'Instagram', href: APP_CONFIG.social.instagram },
    { role: '', name: 'NewGrounds', href: APP_CONFIG.social.newgrounds },
    { role: '', name: 'Reddit', href: APP_CONFIG.social.reddit },
    { role: '', name: 'TikTok', href: APP_CONFIG.social.tiktok },
  ]

  let expanded = $state(false)
  let scale = $state(1)
  let creditsEl: HTMLDivElement

  function fit() {
    if (!creditsEl)
      return
    const box = (creditsEl.closest('.contact-frame') as HTMLElement | null) ?? creditsEl.parentElement
    if (!box)
      return
    const availW = box.clientWidth - 24
    const availH = box.clientHeight - 24
    const natW = creditsEl.offsetWidth
    const natH = creditsEl.offsetHeight
    if (natW <= 0 || natH <= 0 || availW <= 0 || availH <= 0)
      return
    scale = Math.min(1, availW / natW, availH / natH)
  }

  async function toggle() {
    expanded = !expanded
    await tick()
    fit()
  }

  onMount(() => {
    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(fit)
    }
    const box = creditsEl.closest('.contact-frame') as HTMLElement | null
    const ro = new ResizeObserver(schedule)
    ro.observe(box ?? creditsEl)
    window.addEventListener('resize', schedule)
    document.fonts?.ready.then(schedule).catch(() => {})
    schedule()
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(raf)
    }
  })
</script>

{#snippet creditRow(c: Credit, animate: boolean)}
  <span class='credits-role' class:credits-in={animate} aria-hidden={c.role === '' ? 'true' : undefined}>{c.role}</span>
  {#if c.href}
    <a class='credits-name credits-link' class:credits-in={animate} href={c.href} target='_blank' rel='noopener noreferrer' aria-label='{c.name}, opens in new tab'>
      {c.name}
      <svg class='credits-arrow' viewBox='0 0 10 10' fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>
        <line x1='1' y1='9' x2='9' y2='1' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' />
        <polyline points='3,1 9,1 9,7' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' />
      </svg>
    </a>
  {:else}
    <span class='credits-name' class:credits-in={animate}>{c.name}</span>
  {/if}
{/snippet}

<div
  class='credits'
  bind:this={creditsEl}
  style:transform={`scale(${scale})`}
>
  {#each PRIMARY as c}
    {@render creditRow(c, false)}
  {/each}

  <span class='credits-role' aria-hidden='true'></span>
  <button
    class='credits-name other-toggle'
    type='button'
    aria-expanded={expanded}
    onclick={toggle}
  >
    Other
    <svg class='other-caret' class:other-caret--open={expanded} viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>
      <polyline points='1,1 5,5 9,1' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' />
    </svg>
  </button>

  {#if expanded}
    {#each EXTRA as c}
      {@render creditRow(c, true)}
    {/each}
  {/if}
</div>

<style>
  .credits {
    display: grid;
    grid-template-columns: max-content max-content;
    column-gap: clamp(0.75rem, 0.611rem + 0.618vw, 1.6rem);
    align-items: baseline;
    transform-origin: center center;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }
  .credits-role {
    font-family: var(--font-secondary);
    font-size: clamp(1.4rem, 1.0rem + 0.8vw, 2.2rem);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-secondary);
    opacity: 0.4;
    text-align: right;
    white-space: nowrap;
    line-height: 1.6;
  }
  .credits-name {
    font-family: var(--font-secondary);
    font-size: clamp(2rem, 1.4rem + 1.2vw, 3.5rem);
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-secondary);
    text-align: left;
    white-space: nowrap;
    line-height: 1.6;
    text-shadow:
      1px 1px 0 rgba(0, 0, 0, 0.65),
      0px 2px 4px rgba(0, 0, 0, 0.30);
  }
  .credits-link {
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
    transition: opacity 0.2s ease;
  }
  .credits-link:hover {
    opacity: 0.6;
  }
  .credits-arrow {
    width: 0.55em;
    height: 0.55em;
    flex-shrink: 0;
    opacity: 0.6;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
  .credits-link:hover .credits-arrow {
    transform: translate(1px, -1px);
    opacity: 1;
  }

  .other-toggle {
    background: none;
    border: none;
    margin: 0;
    padding: 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.35em;
    color: var(--color-secondary);
    opacity: 0.65;
    transition: opacity 0.2s ease;
  }
  .other-toggle:hover {
    opacity: 1;
  }
  .other-caret {
    width: 0.5em;
    height: 0.32em;
    flex-shrink: 0;
    opacity: 0.7;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .other-caret--open {
    transform: rotate(180deg);
  }

  .credits-in {
    animation: credit-in 0.28s ease both;
  }
  @keyframes credit-in {
    from {
      opacity: 0;
      transform: translateY(-0.25em);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .credits,
    .other-caret,
    .credits-in {
      transition: none;
      animation: none;
    }
  }
</style>
