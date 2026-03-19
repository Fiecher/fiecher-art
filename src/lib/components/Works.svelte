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
  const topCells = allCells.slice(0, half)
  const botCells = allCells.slice(half)

  let reelTop = $state<ReturnType<typeof FilmReel> | null>(null)
  let reelBot = $state<ReturnType<typeof FilmReel> | null>(null)

  let stageEl = $state<HTMLElement | null>(null)
  let stageH = $state(0)
  const stripH = $derived(
    stageH > 0 ? Math.max(120, Math.min(400, Math.round(stageH * 0.44))) : 240,
  )

  let topScrollX = 0

  function applyScroll(x: number) {
    topScrollX = x
    reelTop?.setScrollX(x)
    reelBot?.setScrollX(-x)
  }

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

  function easeOut(t: number) {
    return 1 - (1 - t) ** 3
  }

  function maybeSnap() {
    const approxCellSize = stageH > 0 ?
      Math.max(120, Math.min(560, Math.round(stageEl ? (stageEl.offsetWidth * 0.38) : 220))) :
        220

    const speed = Math.abs(velX)
    const FLING_THRESHOLD = 0.4

    if (speed > FLING_THRESHOLD) {
      const flingPx = velX * 200
      const target = topScrollX + flingPx
      cancelAnimationFrame(animRafId)
      const from = topScrollX
      const dur = Math.min(800, Math.abs(flingPx) * 2)
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - start) / dur, 1)
        applyScroll(from + (target - from) * easeOut(t))
        if (t < 1)
          animRafId = requestAnimationFrame(tick)
      }
      animRafId = requestAnimationFrame(tick)
    } else {
      const target = Math.round(topScrollX / approxCellSize) * approxCellSize
      if (Math.abs(target - topScrollX) < 2)
        return
      cancelAnimationFrame(animRafId)
      const from = topScrollX
      const dur = 300
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - start) / dur, 1)
        applyScroll(from + (target - from) * easeOut(t))
        if (t < 1)
          animRafId = requestAnimationFrame(tick)
      }
      animRafId = requestAnimationFrame(tick)
    }
  }

  function syncDragDist() {
    reelTop?.setDragDist(dragDistPx)
    reelBot?.setDragDist(dragDistPx)
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
    syncDragDist()
    pendingX = e.clientX
    if (dragRafId)
      return
    dragRafId = requestAnimationFrame(flushDrag)
  }

  function flushDrag() {
    dragRafId = 0
    if (!isDragging || pendingX === null)
      return
    applyScroll(dragStartTopX - (pendingX - dragStartX))
    pendingX = null
  }

  function onGlobalMouseUp() {
    window.removeEventListener('mousemove', onGlobalMouseMove)
    window.removeEventListener('mouseup', onGlobalMouseUp)
    if (dragRafId) {
      cancelAnimationFrame(dragRafId)
      dragRafId = 0
    }
    pendingX = null
    isDragging = false
    syncDragDist()
    maybeSnap()
  }

  let touchOriginX = 0
  let touchOriginY = 0
  let touchOriginT = 0
  let touchDragStartTopX = 0
  let touchIsHorizontal: boolean | null = null

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
    touchIsHorizontal = null
  }

  function onTouchMove(e: TouchEvent) {
    const t = e.touches[0]
    const dx = t.clientX - touchOriginX
    const dy = t.clientY - touchOriginY

    if (touchIsHorizontal === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      touchIsHorizontal = Math.abs(dx) >= Math.abs(dy)
    }

    if (touchIsHorizontal === true) {
      e.preventDefault()
      const now = performance.now()
      const dt = now - lastClientT
      if (dt > 0)
        velX = (lastClientX - t.clientX) / dt
      lastClientX = t.clientX
      lastClientT = now
      dragDistPx = Math.abs(dx)
      syncDragDist()
      applyScroll(touchDragStartTopX - dx)
    }
  }

  function onTouchEnd(e: TouchEvent) {
    const elapsed = Date.now() - touchOriginT
    const ch = e.changedTouches[0]
    const dy = touchOriginY - ch.clientY

    if (touchIsHorizontal === false && Math.abs(dy) >= 45 && elapsed < 600) {
      e.stopPropagation()
      navigate(dy > 0 ? 1 : -1)
      return
    }

    if (touchIsHorizontal === true) {
      syncDragDist()
      maybeSnap()
    }
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
  let _readyCount = 0

  function onReelReady() {
    _readyCount++
    if (_readyCount >= 2) {
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('works:ready'))
      })
    }
  }

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
    })
    mounted = true
    requestAnimationFrame(() => {
      if (stageEl)
        ro.observe(stageEl)
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
        tilt={2}
        entryX={-600}
        {entryDelay}
        {visible}
        {overlay}
        onCellClick={handleCellClick}
        onReady={onReelReady}
      />
    </div>
    <div class='strip-slot' style={`height:${stripH}px`}>
      <FilmReel
        bind:this={reelBot}
        cells={botCells}
        tilt={-2}
        entryX={600}
        {entryDelay}
        {visible}
        {overlay}
        onCellClick={handleCellClick}
        onReady={onReelReady}
      />
    </div>
  </div>
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
    overflow: clip;
    overflow-clip-margin: 0px;
  }

  .strip-slot {
    position: relative;
    width: 100%;
    flex-shrink: 0;
    overflow: visible;
  }

  @media (max-width: 480px) { .strips-stage { gap: 4px; } }
</style>
