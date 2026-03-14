<script lang='ts'>
  import FilmReel from '$lib/components/FilmReel.svelte'
  import { withBase, WORK_PAGE_COUNT, WORKS } from '$lib/config'
  import { navigate, updateWorksPage, worksPage } from '$lib/navigation'
  import { openModal } from '$lib/viewer'
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'

  interface Props {
    entryDelay?: number
    overlay?: boolean
  }
  const { entryDelay = 0, overlay = false }: Props = $props()

  const CELLS_PER_STRIP = 2
  const sectionCount = WORK_PAGE_COUNT
  const ANIM_MS = 700
  const SWIPE_MIN_PX = 45
  const SWIPE_MAX_MS = 500

  type Cell = { id: string, title: string, image: string }

  function makeCells(startOffset: number): Cell[] {
    const total = WORKS.length
    const out: Cell[] = []
    for (let s = 0; s < sectionCount; s++) {
      for (let m = 0; m < CELLS_PER_STRIP; m++) {
        const idx = (startOffset + s * CELLS_PER_STRIP + m) % total
        const w = WORKS[idx]
        out.push({ id: w.id, title: w.title, image: withBase(w.main.poster ?? w.main.src) })
      }
    }
    return out
  }

  const botOffset = Math.max(1, Math.floor(WORKS.length / 2))
  const topCells = makeCells(0)
  const botCells = makeCells(botOffset)

  const EDGE_BLEED = 0.45
  const GAP_RATIO = 0.025
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
      pendingSection = clamped
      return
    }

    let delta = direction !== 0 ?
      (() => {
        const d = clamped - currentSection
        if (direction > 0 && d <= 0)
          return d + sectionCount
        if (direction < 0 && d >= 0)
          return d - sectionCount
        return d
      })() :
        clamped - currentSection

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

  let mouseDragDistance = 0

  function handleCellClick(id: string) {
    if (isAnimating || mouseDragDistance > 6)
      return
    const work = WORKS.find(w => w.id === id)
    if (work)
      openModal(work)
  }

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
      const direction = (dx > 0 ? 1 : -1) as 1 | -1
      const next = (currentSection + direction + sectionCount) % sectionCount
      updateWorksPage(next)
      navigateTo(next, direction)
    } else if (ady >= SWIPE_MIN_PX && ady > adx) {
      e.stopPropagation()
      navigate(dy > 0 ? 1 : -1)
    }
  }

  let mouseDragging = false
  let mouseDragStartX = 0
  let mouseDragStartSection = 0
  let pendingMouseX: number | null = null
  let dragRafId = 0

  function onMouseDown(e: MouseEvent) {
    if (e.button !== 0)
      return
    e.preventDefault()
    mouseDragging = true
    mouseDragStartX = e.clientX
    mouseDragStartSection = currentSection
    mouseDragDistance = 0
    reelTop?.onDragStart(e.clientX)
    reelBot?.onDragStart(e.clientX)
    window.addEventListener('mousemove', onGlobalMouseMove)
    window.addEventListener('mouseup', onGlobalMouseUp)
  }

  function onGlobalMouseMove(e: MouseEvent) {
    pendingMouseX = e.clientX
    if (dragRafId)
      return
    dragRafId = requestAnimationFrame(flushDragMove)
  }

  function flushDragMove() {
    dragRafId = 0
    if (!mouseDragging || pendingMouseX === null)
      return
    const x = pendingMouseX
    pendingMouseX = null
    const delta = x - mouseDragStartX
    mouseDragDistance = Math.abs(delta)
    reelTop?.onDragMove(x)
    reelBot?.onDragMove(mouseDragStartX - delta)
  }

  function onGlobalMouseUp(e: MouseEvent) {
    window.removeEventListener('mousemove', onGlobalMouseMove)
    window.removeEventListener('mouseup', onGlobalMouseUp)
    if (dragRafId) {
      cancelAnimationFrame(dragRafId)
      dragRafId = 0
    }
    pendingMouseX = null
    snapAfterDrag(e.clientX)
  }

  function snapAfterDrag(endX: number) {
    mouseDragging = false
    reelTop?.onDragEnd()
    reelBot?.onDragEnd()

    const draggedPx = endX - mouseDragStartX
    const sectionsPx = CELLS_PER_STRIP * cellSize
    const rawTarget = mouseDragStartSection - draggedPx / sectionsPx
    const target = ((Math.round(rawTarget) % sectionCount) + sectionCount) % sectionCount

    const remainingPx = (mouseDragStartSection - target) * sectionsPx - draggedPx
    reelTop?.scrollBy(remainingPx, 450)
    reelBot?.scrollBy(-remainingPx, 450)

    if (target !== currentSection) {
      currentSection = target
      updateWorksPage(target)
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

    return () => {
      ro.disconnect()
      cancelAnimationFrame(dragRafId)
      window.removeEventListener('mousemove', onGlobalMouseMove)
      window.removeEventListener('mouseup', onGlobalMouseUp)
    }
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class='works'
  class:works--overlay={overlay}
  ontouchstart={onTouchStart}
  ontouchend={onTouchEnd}
>
  <div
    class='strips-stage'
    class:strips-stage--dragging={mouseDragging}
    bind:this={stageEl}
    onmousedown={onMouseDown}
  >
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
          <span class='dot-frame' aria-hidden='true'>
            <span class='dot-frame__num'>{String(i + 1).padStart(2, '0')}</span>
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

  .works--overlay {
    background: rgba(223, 225, 215, 0.12);
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
    cursor: grab;
    user-select: none;
  }

  .strips-stage--dragging {
    cursor: grabbing;
  }

  .strip-slot {
    position: absolute;
    left: 0; right: 0;
    overflow: visible;
  }

  .dot-nav {
    position: absolute;
    bottom: 15px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    padding: 0;
    border: none;
    background: transparent;
    mix-blend-mode: difference;
  }

  .dot-btn {
    width: 45px;
    height: 45px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-tap-highlight-color: transparent;
  }

  .dot-frame {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 45px;
    height: 45px;
    border: 1px solid var(--color-secondary);
    position: relative;
    opacity: 0.45;
    transition: opacity 0.2s ease;
  }

  .dot-frame__num {
    font-family: var(--font-secondary);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-secondary);
    line-height: 1;
    user-select: none;
  }

  .dot-btn:hover .dot-frame { opacity: 0.65; }

  .dot-btn--active .dot-frame {
    opacity: 1;
    background: var(--color-secondary);
  }

  .dot-btn--active .dot-frame__num { color: var(--color-primary); }

  .dot-btn:focus-visible .dot-frame {
    outline: 2px solid var(--color-secondary);
    outline-offset: 3px;
    opacity: 0.9;
  }

  @media (max-width: 480px) {
    .dot-btn { width: 48px; height: 48px; }
  }
</style>
