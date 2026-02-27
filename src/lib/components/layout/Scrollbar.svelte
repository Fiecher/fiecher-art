<script lang='ts'>
  import { SECTIONS } from '$lib/navigation'
  import type { Section } from '$lib/navigation'

  const { active }: { active: Section } = $props()
</script>

<aside class='scrollbar' aria-hidden='true'>
  <div class='track'>
    {#each SECTIONS as section, i}
      <div class='tick-group'>
        {#if i > 0}
          <div class='tick tick--minor'></div>
          <div class='tick tick--minor'></div>
        {/if}

        <div class='tick-main' class:tick-main--active={section === active}>
          <span class='tick-label'>{section}</span>
          <div class='tick-line'></div>
        </div>
      </div>
    {/each}
  </div>
</aside>

<style>
  .scrollbar {
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 100;
    padding-right: 12px;
  }

  .track {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0;
  }

  .tick-group {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }

  .tick {
    height: 1px;
    background: var(--color-secondary);
    opacity: 0.25;
  }

  .tick--minor {
    width: 8px;
  }

  .tick-main {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    padding: 10px 0;
    opacity: 0.35;
    transition: opacity 0.4s ease;
  }

  .tick-main--active {
    opacity: 1;
  }

  .tick-label {
    font-family: var(--font-main);
    font-size: 0.95rem;
    letter-spacing: 0.14em;
    color: var(--color-secondary);
    white-space: nowrap;
    user-select: none;
    line-height: 1;
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transform: translateY(4px);
    transition:
      max-height 0.35s ease,
      opacity 0.35s ease,
      transform 0.35s ease;
  }

  .tick-main--active .tick-label {
    max-height: 2rem;
    opacity: 1;
    transform: translateY(0);
  }

  .tick-line {
    height: 1.5px;
    background: var(--color-secondary);
    width: 18px;
    transition: width 0.35s ease;
  }

  .tick-main--active .tick-line {
    width: 36px;
  }

  @media (max-width: 768px) {
    .scrollbar {
      display: none;
    }
  }
</style>
