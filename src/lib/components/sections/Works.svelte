<script lang='ts'>
  import FilmReel from '$lib/components/sections/FilmReel.svelte'
  import { WORK_PAGE_COUNT, WORKS } from '$lib/config'
  import { openModal } from '$lib/modal'
  import { updateWorksPage, worksPage } from '$lib/navigation'
  import { onMount } from 'svelte'

  const allCells = WORKS.map(w => ({
    id: w.id,
    title: w.title,
    image: w.main.poster ?? w.main.src,
  }))

  const worksPerPage = $derived(Math.ceil(WORKS.length / WORK_PAGE_COUNT))
  const pageOffsets = $derived(
    Array.from({ length: WORK_PAGE_COUNT }, (_, i) => i * worksPerPage),
  )

  const CELLS_VISIBLE = 3
  const CELL_MAX = 600
  const CELL_MIN = 60
  const SPROCKET_RATIO = 20 / 220

  let stageEl = $state<HTMLElement | null>(null)
  let cellSize = $state(200)
  let stageH = $state(0)
  let stageW = $state(0)

  function updateSizes(w: number, h: number) {
    if (w <= 0 || h <= 0)
      return
    stageW = w
    stageH = h
    const ideal = Math.floor(w / CELLS_VISIBLE)
    cellSize = Math.max(CELL_MIN, Math.min(CELL_MAX, ideal))
  }

  const gap = $derived(Math.round(cellSize * SPROCKET_RATIO * 2))
  const slotH = $derived(Math.round((stageH - gap) / 2))

  let currentPage = $state(0)
  let reelTopEl: ReturnType<typeof FilmReel> | null = $state(null)
  let reelBotEl: ReturnType<typeof FilmReel> | null = $state(null)

  const ANIM_MS = 700
  let isAnimating = false
  let pendingPage: number | null = null

  function navigateTo(targetPage: number) {
    const clamped = Math.max(0, Math.min(targetPage, WORK_PAGE_COUNT - 1))
    if (clamped === currentPage && !isAnimating)
      return
    if (isAnimating) {
      pendingPage = clamped
      return
    }

    const deltaPx = (pageOffsets[clamped] - pageOffsets[currentPage]) * cellSize
    isAnimating = true
    reelTopEl?.scrollBy(deltaPx, ANIM_MS)
    reelBotEl?.scrollBy(-deltaPx, ANIM_MS)

    setTimeout(() => {
      currentPage = clamped
      isAnimating = false
      if (pendingPage !== null && pendingPage !== clamped) {
        const next = pendingPage
        pendingPage = null
        requestAnimationFrame(() => navigateTo(next))
      } else {
        pendingPage = null
      }
    }, ANIM_MS)
  }

  $effect(() => {
    const p = $worksPage
    if (p !== currentPage)
      navigateTo(p)
  })

  function handleDotClick(pageIndex: number) {
    updateWorksPage(pageIndex)
    navigateTo(pageIndex)
  }

  function handleCellClick(id: string) {
    const work = WORKS.find(w => w.id === id)
    if (work)
      openModal(work)
  }

  onMount(() => {
    const saved = $worksPage
    currentPage = Math.max(0, Math.min(saved, WORK_PAGE_COUNT - 1))

    const ro = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect
      if (!rect || rect.width <= 0 || rect.height <= 0)
        return
      updateSizes(rect.width, rect.height)
    })
    if (stageEl) {
      ro.observe(stageEl)
      updateSizes(stageEl.offsetWidth, stageEl.offsetHeight)
    }
    return () => ro.disconnect()
  })
</script>

<div class='works'>

  <div class='strips-stage' bind:this={stageEl}>
    <div
      class='strip-slot'
      style={`height:${slotH}px; top:0;`}
    >
      <FilmReel
        bind:this={reelTopEl}
        cells={allCells}
        {cellSize}
        tilt={3}
        entryX={-600}
        onCellClick={handleCellClick}
      />
    </div>

    <div
      class='strip-slot'
      style={`height:${slotH}px; top:${slotH + gap}px;`}
    >
      <FilmReel
        bind:this={reelBotEl}
        cells={allCells}
        {cellSize}
        tilt={-3}
        entryX={600}
        onCellClick={handleCellClick}
      />
    </div>
  </div>

  {#if WORK_PAGE_COUNT > 1}
    <nav class='dots-nav' aria-label='Works pages'>
      {#each { length: WORK_PAGE_COUNT } as _, i}
        <button
          class='dot'
          class:dot--active={i === currentPage}
          onclick={() => handleDotClick(i)}
          aria-current={i === currentPage ? 'true' : undefined}
          aria-label={`Page ${i + 1}`}
          type='button'
        ></button>
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

  .dots-nav {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dot {
    display: block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    border: none;
    padding: 0;
    cursor: pointer;
    background: var(--color-primary);
    opacity: 0.2;
    transition:
      opacity 0.25s ease,
      transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    flex-shrink: 0;
    position: relative;
  }

  .dot::before {
    content: '';
    position: absolute;
    inset: -8px;
  }

  .dot--active {
    opacity: 0.7;
    transform: scale(1.5);
  }

  .dot:hover:not(.dot--active) {
    opacity: 0.4;
    transform: scale(1.2);
  }
</style>
