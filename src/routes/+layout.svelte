<script lang='ts'>
  import { base } from '$app/paths'
  import LoadingScreen from '$lib/components/LoadingScreen.svelte'
  import WorkModal from '$lib/components/Viewer.svelte'
  import { activeSection, goToSection, SECTIONS } from '$lib/navigation'
  import { isVideoFullscreen, modalCell } from '$lib/viewer'
  import { get } from 'svelte/store'
  import './layout.css'

  const { children } = $props()

  let loaded = $state(false)
  function onLoaderDone() {
    loaded = true
    window.dispatchEvent(new CustomEvent('app:loaded'))
  }

  // ─── Scrollbar: 3 equal sections ──────────────────────────────────
  // REEL=step0  WORKS=step1  CONTACT=step2
  const STEP_PX = 500
  const TOTAL_STEPS = SECTIONS.length - 1 // = 2

  let scrollEl = $state<HTMLElement | undefined>()
  let viewportH = $state(0)

  $effect(() => {
    viewportH = window.visualViewport?.height ?? window.innerHeight
  })

  const phantomH = $derived(STEP_PX * TOTAL_STEPS + viewportH)

  function sectionToStep(s: typeof SECTIONS[number]): number {
    return SECTIONS.indexOf(s)
  }

  let _programmaticScroll = false
  let _programmaticTimer = 0
  let _initialScrollDone = false

  function syncScrollbar(instant = false) {
    if (!scrollEl)
      return
    const step = sectionToStep(get(activeSection))
    const target = Math.max(0, Math.min(step, TOTAL_STEPS)) * STEP_PX
    if (Math.abs(scrollEl.scrollTop - target) < 2)
      return
    _programmaticScroll = true
    clearTimeout(_programmaticTimer)
    _programmaticTimer = window.setTimeout(() => {
      _programmaticScroll = false
    }, 700)
    scrollEl.scrollTo({ top: target, behavior: instant ? 'instant' : 'smooth' })
  }

  $effect(() => {
    void $activeSection
    if (!_initialScrollDone) {
      _initialScrollDone = true
      requestAnimationFrame(() => syncScrollbar(true))
      return
    }
    syncScrollbar()
  })

  $effect(() => {
    if (!scrollEl)
      return
    scrollEl.addEventListener('wheel', onWheel, { passive: false })
    scrollEl.addEventListener('touchstart', onTouchStart, { passive: true })
    scrollEl.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      scrollEl!.removeEventListener('wheel', onWheel)
      scrollEl!.removeEventListener('touchstart', onTouchStart)
      scrollEl!.removeEventListener('touchend', onTouchEnd)
    }
  })

  function isBlocked() {
    return get(modalCell) || get(isVideoFullscreen)
  }

  function tryNavigate(dir: 1 | -1) {
    if (isBlocked())
      return
    const current = sectionToStep(get(activeSection))
    const next = Math.max(0, Math.min(TOTAL_STEPS, current + dir))
    if (next === current)
      return
    goToSection(SECTIONS[next])
  }

  function onScrollEnd() {
    if (_programmaticScroll || isBlocked() || !scrollEl)
      return
    const step = Math.max(0, Math.min(Math.round(scrollEl.scrollTop / STEP_PX), TOTAL_STEPS))
    goToSection(SECTIONS[step])
  }

  let lastWheelStep = 0
  const WHEEL_COOLDOWN_MS = 100

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    if (isBlocked())
      return
    const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
    const px = e.deltaMode === 1 ? d * 40 : e.deltaMode === 2 ? d * 800 : d
    if (Math.abs(px) < 10)
      return
    const now = Date.now()
    if (now - lastWheelStep < WHEEL_COOLDOWN_MS)
      return
    lastWheelStep = now
    tryNavigate(px > 0 ? 1 : -1)
  }

  const SWIPE_MIN_PX = 40
  const SWIPE_MAX_MS = 600
  let touch = { x: 0, y: 0, t: 0 }

  function onTouchStart(e: TouchEvent) {
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }
  }

  function onTouchEnd(e: TouchEvent) {
    if (isBlocked())
      return
    if (Date.now() - touch.t > SWIPE_MAX_MS)
      return
    const dx = touch.x - e.changedTouches[0].clientX
    const dy = touch.y - e.changedTouches[0].clientY
    if (Math.abs(dy) >= Math.abs(dx) && Math.abs(dy) >= SWIPE_MIN_PX) {
      requestAnimationFrame(() => tryNavigate(dy > 0 ? 1 : -1))
    }
  }
</script>

<svelte:window onresize={() => {
  viewportH = window.visualViewport?.height ?? window.innerHeight
}} />

{#if !loaded}
  <LoadingScreen onDone={onLoaderDone} />
{/if}

<div
  class='scroll-wrapper'
  class:is-hidden={!loaded}
  bind:this={scrollEl}
  onscrollend={onScrollEnd}
>
  <div class='scroll-phantom' style={`height:${phantomH}px`}>
    <div class='poster-sticky'>
      <div class='poster'>
        {@render children()}
        <div
          class='poster-paper'
          aria-hidden='true'
          style={`background-image: url('${base}/textures/paper.jpg')`}
        ></div>
      </div>
    </div>
  </div>
</div>

<WorkModal />

<style>
  .scroll-wrapper {
    width: 100%;
    height: 100dvh;
    overflow-y: scroll;
    overflow-x: clip;
    background: var(--color-primary);
    transition: opacity 0.4s ease;
  }
  .scroll-wrapper.is-hidden {
    opacity: 0;
    pointer-events: none;
  }
  .scroll-phantom {
    position: relative;
    width: 100%;
  }
  .poster-sticky {
    position: sticky;
    top: 0;
    height: 100dvh;
    display: flex;
    justify-content: center;
    overflow: hidden;
  }
  .poster {
    aspect-ratio: 2 / 3;
    height: 100dvh;
    max-width: 100%;
    background: var(--color-primary);
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .poster-paper {
    position: absolute;
    inset: 0;
    z-index: 9000;
    pointer-events: none;
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    mix-blend-mode: multiply;
    opacity: 0.82;
    will-change: transform;
    transform: translateZ(0);
  }
</style>
