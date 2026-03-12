<script lang='ts'>
  import { base } from '$app/paths'
  import LoadingScreen from '$lib/components/LoadingScreen.svelte'
  import WorkModal from '$lib/components/Viewer.svelte'
  import { globalProgress, goToSection, progressToTarget, TOTAL_STEPS, worksPage } from '$lib/navigation'
  import { modalCell } from '$lib/viewer'
  import { get } from 'svelte/store'
  import './layout.css'

  const { children } = $props()

  let loaded = $state(false)
  function onLoaderDone() {
    loaded = true
  }

  const STEP_PX = 500

  let scrollEl = $state<HTMLElement | undefined>()
  let viewportH = $state(0)

  $effect(() => {
    viewportH = window.visualViewport?.height ?? window.innerHeight
  })

  const phantomH = $derived(STEP_PX * TOTAL_STEPS + viewportH)

  let programmaticScroll = false
  let programmaticTimer = 0

  function syncScrollbar(progress: number) {
    if (!scrollEl)
      return
    const target = Math.round(progress * TOTAL_STEPS) * STEP_PX
    if (Math.abs(scrollEl.scrollTop - target) < 2)
      return
    programmaticScroll = true
    clearTimeout(programmaticTimer)
    programmaticTimer = window.setTimeout(() => {
      programmaticScroll = false
    }, 700)
    scrollEl.scrollTo({ top: target, behavior: 'smooth' })
  }

  $effect(() => {
    const progress = $globalProgress
    void $worksPage
    syncScrollbar(progress)
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

  function onScrollEnd() {
    if (!scrollEl || programmaticScroll || get(modalCell))
      return
    const step = Math.round(scrollEl.scrollTop / STEP_PX)
    const clamped = Math.max(0, Math.min(TOTAL_STEPS, step))
    const { section, pageIndex } = progressToTarget(clamped / TOTAL_STEPS)
    goToSection(section, pageIndex ?? null)
  }

  let wheelPending = false

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    if (get(modalCell))
      return
    if (wheelPending)
      return
    wheelPending = true
    requestAnimationFrame(() => {
      wheelPending = false
    })
    const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
    if (Math.abs(d) < 5)
      return
    const current = Math.round($globalProgress * TOTAL_STEPS)
    const next = Math.max(0, Math.min(TOTAL_STEPS, current + (d > 0 ? 1 : -1)))
    if (next === current)
      return
    const { section, pageIndex } = progressToTarget(next / TOTAL_STEPS)
    goToSection(section, pageIndex ?? null)
  }

  const SWIPE_MIN_PX = 45
  const SWIPE_MAX_MS = 500
  let touch = { x: 0, y: 0, t: 0 }

  function onTouchStart(e: TouchEvent) {
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }
  }

  function onTouchEnd(e: TouchEvent) {
    if (get(modalCell))
      return
    if (Date.now() - touch.t > SWIPE_MAX_MS)
      return
    const dx = touch.x - e.changedTouches[0].clientX
    const dy = touch.y - e.changedTouches[0].clientY
    const adx = Math.abs(dx); const ady = Math.abs(dy)
    let delta = 0
    if (ady >= adx && ady >= SWIPE_MIN_PX)
      delta = dy > 0 ? 1 : -1
    if (delta === 0)
      return
    const current = Math.round($globalProgress * TOTAL_STEPS)
    const next = Math.max(0, Math.min(TOTAL_STEPS, current + delta))
    if (next === current)
      return
    const { section: nextSection, pageIndex: nextPage } = progressToTarget(next / TOTAL_STEPS)
    goToSection(nextSection, nextPage ?? null)
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
  }
</style>
