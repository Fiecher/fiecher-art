<script lang='ts'>
  import { SECTIONS } from '$lib/navigation'
  import type { Section } from '$lib/navigation'

  const { activeItem, onSelect }: { activeItem: Section, onSelect: (s: Section) => void } = $props()

  let active = $state<Section>(SECTIONS[0])
  let isDropdownOpen = $state(false)

  let rowEl = $state<HTMLButtonElement | null>(null)
  let rowHeight = $state(0)

  const activeIndex = $derived(SECTIONS.indexOf(active))

  function selectMenuItem(item: Section): void {
    active = item
    isDropdownOpen = false
    onSelect(item)
  }

  $effect(() => {
    active = activeItem ?? SECTIONS[0]
  })

  $effect(() => {
    if (!rowEl)
      return
    const ro = new ResizeObserver(() => {
      rowHeight = rowEl!.offsetHeight
    })
    ro.observe(rowEl)
    rowHeight = rowEl.offsetHeight
    return () => ro.disconnect()
  })
</script>

<nav class='menu' class:menu--open={isDropdownOpen}>
  <div class='menu-border'></div>

  <ul class='menu-list'>
    {#each SECTIONS as item}
      <li>
        <button
          class='menu-text'
          class:menu-text--active={item === active}
          onclick={() => selectMenuItem(item)}
          type='button'
        >{item}</button>
      </li>
    {/each}
  </ul>

  <div class='menu-collapsed'>
    {#if !isDropdownOpen}
      <button
        class='menu-overlay-btn'
        onclick={() => (isDropdownOpen = true)}
        aria-label='Open menu'
        type='button'
      ></button>
    {/if}

    <div
      class='menu-mask'
      style='--row-h: {rowHeight ? `${rowHeight}px` : '1em'}; --active-index: {activeIndex}; --total: {SECTIONS.length}'
    >
      <ul class='menu-col-list'>
        <li>
          <button
            bind:this={rowEl}
            class='menu-text menu-col-item'
            class:menu-text--active={SECTIONS[0] === active}
            onclick={() => selectMenuItem(SECTIONS[0])}
            type='button'
            tabindex={isDropdownOpen ? 0 : -1}
          >{SECTIONS[0]}</button>
        </li>
        {#each SECTIONS.slice(1) as item}
          <li>
            <button
              class='menu-text menu-col-item'
              class:menu-text--active={item === active}
              onclick={() => selectMenuItem(item)}
              type='button'
              tabindex={isDropdownOpen ? 0 : -1}
            >{item}</button>
          </li>
        {/each}
      </ul>
    </div>

    <div class='menu-arrow-wrap' class:menu-arrow-wrap--open={isDropdownOpen}>
      <button
        class='menu-arrow-btn'
        onclick={() => (isDropdownOpen = !isDropdownOpen)}
        aria-label='Close menu'
        type='button'
        tabindex={isDropdownOpen ? 0 : -1}
      >
        <svg
          class='menu-arrow'
          class:menu-arrow--open={isDropdownOpen}
          viewBox='0 0 100 60'
          fill='none'
          aria-hidden='true'
          preserveAspectRatio='xMidYMid meet'
        >
          <polyline
            points='10,10 50,50 90,10'
            stroke='currentColor'
            stroke-width='12'
            stroke-linecap='square'
            stroke-linejoin='miter'
          />
        </svg>
      </button>
    </div>

  </div>
</nav>

<style>
  .menu {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    position: relative;
    width: 100%;
    box-sizing: border-box;
    container-type: inline-size;
  }

  .menu-border {
    position: absolute;
    inset: -3px -3px 0 -3px;
    border: clamp(0.3rem, 0.245rem + 0.114vw, 0.5rem) solid var(--color-secondary);
    pointer-events: none;
    z-index: 2;
  }

  .menu-list {
    display: flex;
    gap: clamp(1.5rem, 1.227rem + 0.568vw, 2rem);
    list-style: none;
    margin: 0;
    padding: 0;
    position: relative;
    z-index: 1;
  }

  .menu-text {
    font-family: var(--font-main);
    font-size: clamp(2.5rem, 11cqi, 5rem);
    font-weight: 400;
    line-height: 1;
    margin: 0;
    padding: 0;
    color: var(--color-secondary);
    text-align: center;
    display: inline-block;
    position: relative;
    transition: transform 0.3s ease;
    background: none;
    border: none;
    cursor: pointer;
    white-space: nowrap;
  }

  .menu-text::before,
  .menu-text::after {
    content: '';
    position: absolute;
    bottom: 2px;
    height: 0.25rem;
    background-color: var(--color-secondary);
    transition: width 0.15s ease-in-out;
    width: 0;
  }

  .menu-text::before { right: 50%; transform-origin: right bottom; }
  .menu-text::after  { left: 50%;  transform-origin: left bottom; }

  .menu-text:hover::before, .menu-text:hover::after,
  .menu-text--active::before, .menu-text--active::after { width: 50%; }

  .menu-text:hover { transform: scale(1.05); }

  .menu-list:has(.menu-text:not(.menu-text--active):hover) .menu-text--active::before,
  .menu-list:has(.menu-text:not(.menu-text--active):hover) .menu-text--active::after { width: 0; }

  .menu-collapsed {
    display: none;
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: 0.15em;
    position: relative;
  }

  @container (max-width: 560px) {
    .menu-list      { display: none; }
    .menu-collapsed { display: flex; }
  }

  .menu-overlay-btn {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin: 0;
    width: 100%;
    height: 100%;
  }

  .menu-mask {
    width: 100%;
    display: flex;
    justify-content: center;
    overflow: hidden;
    max-height: var(--row-h);
    transition: max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .menu--open .menu-mask {
    max-height: calc(var(--row-h) * var(--total) + 0.25rem * (var(--total) - 1) + 1.5rem);
  }

  .menu-col-list {
    list-style: none;
    margin: 0;
    padding: 0.25rem 0 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    transform: translateY(calc(-1 * var(--active-index) * (var(--row-h) + 0.25rem)));
    transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .menu--open .menu-col-list {
    transform: translateY(0);
  }

  .menu-col-item { font-size: clamp(2.5rem, 11cqi, 5rem); }
  .menu-col-item:hover { transform: scale(1.03); }

  .menu:not(.menu--open) .menu-col-item::before,
  .menu:not(.menu--open) .menu-col-item::after {
    width: 0 !important;
  }

  .menu--open .menu-col-item.menu-text--active::before,
  .menu--open .menu-col-item.menu-text--active::after {
    width: 50%;
  }

  .menu--open .menu-col-item:hover::before,
  .menu--open .menu-col-item:hover::after {
    width: 50%;
  }

  .menu--open .menu-col-list:has(.menu-col-item:not(.menu-text--active):hover) .menu-col-item.menu-text--active::before,
  .menu--open .menu-col-list:has(.menu-col-item:not(.menu-text--active):hover) .menu-col-item.menu-text--active::after {
    width: 0;
  }

  .menu-arrow-wrap {
    position: relative;
    z-index: 1;
  }

  .menu-arrow-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(2.5rem, 11cqi, 5rem);
    line-height: 1;
  }

  .menu-arrow {
    display: block;
    width: 0.65em;
    height: 0.38em;
    color: var(--color-secondary);
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    transform: none;
  }

  .menu-arrow--open {
    transform: rotate(180deg);
  }

  @media (max-width: 768px) {
    .menu { padding-inline: 16px; }
  }
</style>
