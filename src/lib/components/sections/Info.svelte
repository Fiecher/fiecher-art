<script lang='ts'>
  import APP_CONFIG from '$lib/config'
  import { fade } from 'svelte/transition'

  const CREDITS: { role: string, name: string, href?: string }[] = [
    { role: 'contact via', name: 'Mail', href: APP_CONFIG.social.email },
    { role: '', name: 'Telegram', href: APP_CONFIG.social.telegram },
    { role: 'follow on', name: 'ArtStation', href: APP_CONFIG.social.artstation },
    { role: '', name: 'Behance', href: APP_CONFIG.social.behance },
    { role: '', name: 'YouTube', href: APP_CONFIG.social.youtube },
    { role: '', name: 'Telegram', href: APP_CONFIG.social.telegramChannel },
  ]
</script>

<div
  class='credits'
  in:fade={{ duration: 250, delay: 350 }}
  out:fade={{ duration: 150 }}
>
  {#each CREDITS as { role, name, href }}
    <div class='credits-row'>
      <span class='credits-role'>{role}</span>
      {#if href}
        <a class='credits-name credits-link' {href} target='_blank' rel='noopener noreferrer'>
          {name}
          <svg class='credits-arrow' viewBox='0 0 10 10' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <line x1='1' y1='9' x2='9' y2='1' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' />
            <polyline points='3,1 9,1 9,7' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' />
          </svg>
        </a>
      {:else}
        <span class='credits-name'>{name}</span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .credits {
    padding: 0 3rem;
    width: 100%;
    box-sizing: border-box;
  }

  .credits-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 1.6rem;
    align-items: baseline;
    line-height: 1.6;
  }

  .credits-role {
    font-family: var(--font-secondary);
    font-size: 1.4rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-secondary);
    opacity: 0.4;
    text-align: right;
    white-space: nowrap;
  }

  .credits-name {
    font-family: var(--font-secondary);
    font-size: 1.85rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-secondary);
    text-align: left;
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

  @media (max-width: 600px) {
    .credits {
      padding-inline: 16px;
    }

    .credits-row {
      grid-template-columns: 1fr;
      line-height: 1.4;
      margin-bottom: 6px;
    }

    .credits-role {
      text-align: left;
    }
  }
</style>
