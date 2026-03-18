<script lang='ts'>
  import FilmReel from '$lib/components/FilmReel.svelte'
  import { withBase, WORKS } from '$lib/config'
  import { navigate } from '$lib/navigation'
  import { openModal } from '$lib/viewer'
  import { onMount } from 'svelte'

  interface Props {
    entryDelay?: number
    overlay?: boolean
    visible?: boolean
  }
  const { entryDelay = 0, overlay = false, visible = true }: Props = $props()

  const allCells = WORKS.map(w => ({
    id: w.id,
    title: w.title,
    image: withBase(w.main.poster ?? w.main.src),
  }))
  const half = Math.ceil(allCells.length / 2)
  const topCells = allCells
  const botCells = [...allCells.slice(half), ...allCells.slice(0, half)]

  let reelTop = $state<ReturnType<typeof FilmReel> | null>(null)
  let reelBot = $state<ReturnType<typeof FilmReel> | null>(null)

  let stageEl = $state<HTMLElement | null>(null)
  let stageH = $state(0)
  const stripH = $derived(
    stageH > 0 ? Math.max(120, Math.min(400, Math.round(stageH * 0.44))) : 240,
  )

  // ─── Single scroll master ──────────────────────────────────────────
  // Bot counter-scrolls: botScrollX = botPhase - topScrollX
  // This makes them always move in opposite directions and snap together.
  let topScrollX = $state(0)
  let cellSize = $state(0)
  let botPhase = $state(0)
  const botScrollX = $derived(botPhase - topScrollX)

  function initBotPhase() {
    if (cellSize <= 0)
      return
    botPhase = Math.round(botCells.length / 2) * cellSize
  }

  // ─── Drag ──────────────────────────────────────────────────────────
  let isDragging = $state(false)
  let dragDistPx = 0
  let dragStartX = 0
  let dragStartTopX = 0
  let lastClientX = 0
  let lastClientT = 0
  let velX = 0
  let pendingX: number | null = null
  let dragRafId = 0
  let animRafId = 0

  function ease(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
  }

  function snapNearest() {
    if (cellSize <= 0)
      return
    const flingPx = velX * 80
    const target = Math.round((topScrollX - flingPx) / cellSize) * cellSize
    cancelAnimationFrame(animRafId)
    const from = topScrollX
    const dur = 420
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1)
      topScrollX = from + (target - from) * ease(t)
      if (t < 1)
        animRafId = requestAnimationFrame(tick)
    }
    animRafId = requestAnimationFrame(tick)
  }

  function onMouseDown(e: MouseEvent) {
    if (e.button !== 0)
      return
    e.preventDefault()
    cancelAnimationFrame(animRafId)
    isDragging = true
    dragDistPx = 0
    dragStartX = e.clientX
    dragStartTopX = topScrollX
    lastClientX = e.clientX
    lastClientT = performance.now()
    velX = 0
    window.addEventListener('mousemove', onGlobalMouseMove)
    window.addEventListener('mouseup', onGlobalMouseUp)
  }

  function onGlobalMouseMove(e: MouseEvent) {
    const now = performance.now()
    const dt = now - lastClientT
    if (dt > 0)
      velX = (lastClientX - e.clientX) / dt
    lastClientX = e.clientX
    lastClientT = now
    dragDistPx = Math.abs(e.clientX - dragStartX)
    pendingX = e.clientX
    if (dragRafId)
      return
    dragRafId = requestAnimationFrame(flushDrag)
  }

  function flushDrag() {
    dragRafId = 0
    if (!isDragging || pendingX === null)
      return
    topScrollX = dragStartTopX - (pendingX - dragStartX)
    pendingX = null
  }

  function onGlobalMouseUp() {
    window.removeEventListener('mousemove', onGlobalMouseMove)
    window.removeEventListener('mouseup', onGlobalMouseUp)
    if (dragRafId) {
      cancelAnimationFrame(dragRafId); dragRafId = 0
    }
    pendingX = null
    isDragging = false
    snapNearest()
  }

  // ─── Touch ────────────────────────────────────────────────────────
  let touchOriginX = 0
  let touchOriginY = 0
  let touchOriginT = 0
  let touchDragStartTopX = 0

  function onTouchStart(e: TouchEvent) {
    cancelAnimationFrame(animRafId)
    const t = e.touches[0]
    touchOriginX = t.clientX
    touchOriginY = t.clientY
    touchOriginT = Date.now()
    touchDragStartTopX = topScrollX
    lastClientX = t.clientX
    lastClientT = performance.now()
    velX = 0
    dragDistPx = 0
  }

  function onTouchMove(e: TouchEvent) {
    const t = e.touches[0]
    const dx = touchOriginX - t.clientX
    const dy = touchOriginY - t.clientY
    if (Math.abs(dx) > Math.abs(dy))
      e.preventDefault()
    const now = performance.now()
    const dt = now - lastClientT
    if (dt > 0)
      velX = (lastClientX - t.clientX) / dt
    lastClientX = t.clientX
    lastClientT = now
    dragDistPx = Math.abs(t.clientX - touchOriginX)
    topScrollX = touchDragStartTopX - (t.clientX - touchOriginX)
  }

  function onTouchEnd(e: TouchEvent) {
    const elapsed = Date.now() - touchOriginT
    const ch = e.changedTouches[0]
    const dx = touchOriginX - ch.clientX
    const dy = touchOriginY - ch.clientY
    if (Math.abs(dy) >= 45 && Math.abs(dy) > Math.abs(dx) && elapsed < 600) {
      e.stopPropagation()
      navigate(dy > 0 ? 1 : -1)
      return
    }
    snapNearest()
  }

  function handleCellClick(id: string) {
    if (dragDistPx > 6)
      return
    const work = WORKS.find(w => w.id === id)
    if (work)
      openModal(work)
  }

  let mounted = $state(false)
  let _prevVisible = false
  $effect(() => {
    const v = visible
    if (!mounted)
      return
    if (v && !_prevVisible) {
      reelTop?.playEntrance(entryDelay)
      reelBot?.playEntrance(entryDelay)
    }
    _prevVisible = v
  })

  onMount(() => {
    const ro = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect
      if (!rect || rect.width <= 0 || rect.height <= 0)
        return
      stageH = rect.height
      const newCellSize = Math.max(120, Math.min(560, Math.round(rect.width * 0.38)))
      if (newCellSize !== cellSize) {
        cellSize = newCellSize
        initBotPhase()
      }
    })
    mounted = true
    requestAnimationFrame(() => {
      if (stageEl)
        ro.observe(stageEl)
      requestAnimationFrame(() => window.dispatchEvent(new CustomEvent('works:ready')))
    })
    return () => {
      ro.disconnect()
      cancelAnimationFrame(dragRafId)
      cancelAnimationFrame(animRafId)
      window.removeEventListener('mousemove', onGlobalMouseMove)
      window.removeEventListener('mouseup', onGlobalMouseUp)
    }
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class='works'
  class:works--overlay={overlay}
  class:works--dragging={isDragging}
  bind:this={stageEl}
  onmousedown={onMouseDown}
  ontouchstart={onTouchStart}
  ontouchmove={onTouchMove}
  ontouchend={onTouchEnd}
>
  <div class='strips-stage'>
    <div class='strip-slot' style={`height:${stripH}px`}>
      <FilmReel
        bind:this={reelTop}
        cells={topCells}
        scrollX={topScrollX}
        tilt={2}
        entryX={-600}
        {entryDelay}
        {visible}
        onCellClick={handleCellClick}
      />
    </div>
    <div class='strip-slot' style={`height:${stripH}px`}>
      <FilmReel
        bind:this={reelBot}
        cells={botCells}
        scrollX={botScrollX}
        tilt={-2}
        entryX={600}
        {entryDelay}
        {visible}
        onCellClick={handleCellClick}
      />
    </div>
  </div>

  <div class='edge-fade edge-fade--left' aria-hidden='true'></div>
  <div class='edge-fade edge-fade--right' aria-hidden='true'></div>
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
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    touch-action: pan-y;
  }
  .works--overlay { background: rgba(223, 225, 215, 0.12); }
  .works--dragging { cursor: grabbing; touch-action: none; }

  .strips-stage {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    overflow: hidden;
  }

  .strip-slot {
    position: relative;
    width: 100%;
    flex-shrink: 0;
    overflow: visible;
  }

  .edge-fade {
    position: absolute;
    top: 0; bottom: 0;
    width: clamp(20px, 5vw, 72px);
    pointer-events: none;
    z-index: 10;
  }
  .edge-fade--left {
    left: 0;
    background: linear-gradient(to right, var(--color-secondary), transparent);
  }
  .edge-fade--right {
    right: 0;
    background: linear-gradient(to left, var(--color-secondary), transparent);
  }
  .works--overlay .edge-fade--left {
    background: linear-gradient(to right, var(--color-primary), transparent);
  }
  .works--overlay .edge-fade--right {
    background: linear-gradient(to left, var(--color-primary), transparent);
  }

  @media (max-width: 480px) { .strips-stage { gap: 4px; } }
</style>
