<script lang='ts'>
  import APP_CONFIG from '$lib/config'

  const CREDITS: { role: string, name: string, href?: string }[] = [
    { role: 'contact via', name: 'Mail', href: APP_CONFIG.social.email },
    { role: '', name: 'Telegram', href: APP_CONFIG.social.telegram },
    { role: 'follow on', name: 'ArtStation', href: APP_CONFIG.social.artstation },
    { role: '', name: 'Behance', href: APP_CONFIG.social.behance },
    { role: '', name: 'YouTube', href: APP_CONFIG.social.youtube },
    { role: '', name: 'TG Channel', href: APP_CONFIG.social.telegramChannel },
  ]
</script>
<div class='credits'>
  {#each CREDITS as { role, name, href }}
    <span class='credits-role' aria-hidden={role === '' ? 'true' : undefined}>{role}</span>
    {#if href}
      <a class='credits-name credits-link' {href} target='_blank' rel='noopener noreferrer' aria-label='{name}, opens in new tab'>
        {name}
        <svg class='credits-arrow' viewBox='0 0 10 10' fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>
          <line x1='1' y1='9' x2='9' y2='1' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' />
          <polyline points='3,1 9,1 9,7' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' />
        </svg>
      </a>
    {:else}
      <span class='credits-name'>{name}</span>
    {/if}
  {/each}
</div>
<style>
  .credits {
    display: grid;
    grid-template-columns: max-content max-content;
    column-gap: clamp(0.75rem, 0.611rem + 0.618vw, 1.6rem);
    align-items: baseline;
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
</style>
