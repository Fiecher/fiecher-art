<script lang='ts'>
  import FilmReel from '$lib/components/sections/FilmReel.svelte'
  import { WORK_PAGE_COUNT, WORKS } from '$lib/config'
  import { openModal } from '$lib/modal'
  import { updateWorksPage, worksPage } from '$lib/navigation'
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'

  interface Props {
    entryDelay?: number
  }
  const { entryDelay = 0 }: Props = $props()

  const CELLS_PER_STRIP = 2
  const sectionCount = WORK_PAGE_COUNT

  type Cell = { id: string, title: string, image: string }

  function makeCells(startOffset: number): Cell[] {
    const total = WORKS.length
    const out: Cell[] = []
    for (let s = 0; s < sectionCount; s++) {
      for (let m = 0; m < CELLS_PER_STRIP; m++) {
        const idx = (startOffset + s * CELLS_PER_STRIP + m) % total
        const w = WORKS[idx]
        out.push({ id: w.id, title: w.title, image: w.main.poster ?? w.main.src })
      }
    }
    return out
  }

  const botOffset = Math.max(1, Math.floor(WORKS.length / 2))
  const topCells = makeCells(0)
  const botCells = makeCells(botOffset)

  const EDGE_BLEED = 0.45
  const GAP_RATIO = 0.055
  const CELL_MIN = 80
  const CELL_MAX = 600

  let stageEl = $state<HTMLElement | null>(null)
  let stageW = $state(0)
  let stageH = $state(0)

  const stripGap = $derived(Math.round(stageH * GAP_RATIO))
  const slotH = $derived(Math.round((stageH - stripGap) / 2))

  const cellSize = $derived((() => {
    if (stageW <= 0 || stageH <= 0)
      return 180
    const fromH = slotH
    const fromW = Math.floor(stageW / (CELLS_PER_STRIP + EDGE_BLEED * 2))
    return Math.max(CELL_MIN, Math.min(CELL_MAX, Math.min(fromH, fromW)))
  })())

  const initialSection = Math.max(0, Math.min(get(worksPage), sectionCount - 1))

  let currentSection = $state(initialSection)
  const ANIM_MS = 700

  let reelTop = $state<ReturnType<typeof FilmReel> | null>(null)
  let reelBot = $state<ReturnType<typeof FilmReel> | null>(null)
  let isAnimating = false
  let pendingSection: number | null = null
  let mounted = false

  function navigateTo(target: number, direction: 1 | -1 | 0 = 0) {
    const clamped = Math.max(0, Math.min(target, sectionCount - 1))
    if (clamped === currentSection && !isAnimating)
      return
    if (isAnimating) {
      pendingSection = clamped; return
    }

    let delta: number
    if (direction !== 0) {
      const linearDelta = clamped - currentSection
      delta = linearDelta
      if (direction > 0 && delta <= 0)
        delta += sectionCount
      if (direction < 0 && delta >= 0)
        delta -= sectionCount
    } else {
      delta = clamped - currentSection
    }

    const px = delta * CELLS_PER_STRIP * cellSize

    isAnimating = true
    currentSection = clamped
    reelTop?.scrollBy(px, ANIM_MS)
    reelBot?.scrollBy(-px, ANIM_MS)

    setTimeout(() => {
      isAnimating = false
      if (pendingSection !== null && pendingSection !== clamped) {
        const next = pendingSection
        pendingSection = null
        requestAnimationFrame(() => navigateTo(next, 0))
      } else {
        pendingSection = null
      }
    }, ANIM_MS)
  }

  $effect(() => {
    const p = $worksPage
    if (!mounted)
      return
    if (p !== currentSection)
      navigateTo(p, 0)
  })

  function handleDotClick(idx: number) {
    updateWorksPage(idx)
    navigateTo(idx, 0)
  }

  function handleCellClick(id: string) {
    if (isAnimating)
      return
    const work = WORKS.find(w => w.id === id)
    if (work)
      openModal(work)
  }

  const SWIPE_MIN_PX = 45
  const SWIPE_MAX_MS = 500
  let touchOrigin = { x: 0, y: 0, t: 0 }

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0]
    touchOrigin = { x: t.clientX, y: t.clientY, t: Date.now() }
  }

  function onTouchEnd(e: TouchEvent) {
    if (Date.now() - touchOrigin.t > SWIPE_MAX_MS)
      return
    const ch = e.changedTouches[0]
    const dx = touchOrigin.x - ch.clientX
    const dy = touchOrigin.y - ch.clientY
    const adx = Math.abs(dx)
    const ady = Math.abs(dy)
    if (adx >= SWIPE_MIN_PX && adx > ady) {
      e.stopPropagation()
      const direction = dx > 0 ? 1 : -1 as 1 | -1
      const next = (currentSection + direction + sectionCount) % sectionCount
      updateWorksPage(next)
      navigateTo(next, direction)
    }
  }

  onMount(() => {
    updateWorksPage(initialSection)

    const ro = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect
      if (!rect || rect.width <= 0 || rect.height <= 0)
        return
      stageW = rect.width
      stageH = rect.height
    })
    if (stageEl) {
      ro.observe(stageEl)
      stageW = stageEl.offsetWidth
      stageH = stageEl.offsetHeight
    }

    mounted = true

    return () => ro.disconnect()
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class='works'
  ontouchstart={onTouchStart}
  ontouchend={onTouchEnd}
>
  <div class='strips-stage' bind:this={stageEl}>
    <div class='strip-slot' style={`height:${slotH}px; top:0`}>
      <FilmReel
        bind:this={reelTop}
        cells={topCells}
        {cellSize}
        tilt={3}
        entryX={-600}
        {entryDelay}
        {initialSection}
        cellsPerSection={CELLS_PER_STRIP}
        onCellClick={handleCellClick}
      />
    </div>
    <div class='strip-slot' style={`height:${slotH}px; top:${slotH + stripGap}px`}>
      <FilmReel
        bind:this={reelBot}
        cells={botCells}
        {cellSize}
        tilt={-3}
        entryX={600}
        {entryDelay}
        initialSection={-initialSection}
        cellsPerSection={CELLS_PER_STRIP}
        onCellClick={handleCellClick}
      />
    </div>
  </div>

  {#if sectionCount > 1}
    <nav class='dot-nav' aria-label='Works sections'>
      {#each { length: sectionCount } as _, i}
        <button
          class='dot-btn'
          class:dot-btn--active={i === currentSection}
          onclick={() => handleDotClick(i)}
          aria-current={i === currentSection ? 'true' : undefined}
          aria-label={`Section ${i + 1} of ${sectionCount}`}
          type='button'
        >
          <span class='dot' aria-hidden='true'>
            <span class='dot-ring'></span>
          </span>
        </button>
      {/each}
    </nav>
  {/if}
</div>

<style>
  .works {
    display: flex;
    flex-direction: column;
    width: 100%; height: 100%;
    flex: 1; min-height: 0;
    overflow: hidden;
    background: var(--color-secondary);
    position: relative;
    isolation: isolate;
  }

  .works::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 15;
    pointer-events: none;
    background-size: 180px 180px;
    filter: contrast(160%) brightness(320%);
    mix-blend-mode: multiply;
    opacity: 0.32;
  }

  .strips-stage {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .strip-slot {
    position: absolute;
    left: 0; right: 0;
    overflow: visible;
  }

  .dot-nav {
    position: absolute;
    bottom: 18px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    background: transparent;
    padding: 0;
    border: none;
  }

  .dot-btn {
    width: 44px;
    height: 44px;
    padding: 0;
    margin: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-tap-highlight-color: transparent;
  }

  .dot {
    display: block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    position: relative;
    flex-shrink: 0;

    background: transparent;
    box-shadow: 0 0 0 1.5px var(--color-primary);
    opacity: 0.35;

    transition:
      background  0.22s ease 0.18s,
      opacity     0.22s ease,
      box-shadow  0.22s ease;
  }

  .dot-btn:hover .dot {
    opacity: 0.6;
  }

  .dot-btn--active .dot {
    background: var(--color-primary);
    box-shadow: 0 0 0 1.5px var(--color-primary);
    opacity: 0.75;
  }

  .dot-ring {
    display: block;
    position: absolute;
    inset: -1px;
    border-radius: 50%;
    border: 1.5px solid var(--color-primary);
    opacity: 0;
    transform: scale(1);
    pointer-events: none;
  }

  .dot-btn--active .dot-ring {
    animation: ring-converge 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  @keyframes ring-converge {
    0%   { transform: scale(3.5); opacity: 0;    }
    25%  { opacity: 0.6; }
    85%  { transform: scale(1);   opacity: 0.45; }
    100% { transform: scale(1);   opacity: 0;    }
  }

  .dot-btn:focus-visible .dot {
    outline: 2px solid var(--color-primary);
    outline-offset: 4px;
    border-radius: 50%;
    opacity: 0.7;
  }

  @media (max-width: 480px) {
    .dot-btn {
      width: 48px;
      height: 48px;
    }
  }
</style>
