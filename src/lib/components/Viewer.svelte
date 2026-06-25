<script lang='ts'>
  import { withBase } from '$lib/config'
  import { lang, localize, toggleLang } from '$lib/i18n'
  import { closeModal, modalCell } from '$lib/viewer'
  import { fade } from 'svelte/transition'
  import type { WorkMedia } from '$lib/types'

  const work = $derived($modalCell)
  const isOpen = $derived(work !== null)

  let displayWork = $state($modalCell)
  $effect(() => {
    if (work)
      displayWork = work
  })

  let mediaIndex = $state(-1)
  const media = $derived<WorkMedia | undefined>(
    mediaIndex === -1 ? displayWork?.main : displayWork?.wip?.[mediaIndex],
  )
  $effect(() => {
    if (work)
      mediaIndex = -1
  })

  type Phase = 'idle' | 'opening' | 'visible' | 'closing'
  let phase = $state<Phase>('idle')
  let screenIn = $state(false)
  let screenOut = $state(false)
  let videoSrc = $state<string | null>(null)
  let videoEl = $state<HTMLVideoElement | null>(null)

  let beamVisible = $state(false)
  let beamOpacity = $state(0)

  let tids: number[] = []
  const clearTids = () => {
    tids.forEach(clearTimeout)
    tids = []
  }
  const wait = (ms: number) => new Promise<void>(r => {
    tids.push(window.setTimeout(r, ms))
  })

  let _opening = false
  let _openerEl = $state<HTMLElement | null>(null)
  let ejectBtnEl = $state<HTMLButtonElement | null>(null)

  async function doOpen() {
    clearTids()
    viewportH = readViewportH()
    screenIn = false
    screenOut = false
    videoSrc = null
    beamVisible = false
    beamOpacity = 0

    _openerEl = document.activeElement as HTMLElement | null

    if (displayWork?.main.type === 'video')
      videoSrc = withBase(displayWork.main.src)

    phase = 'opening'

    await wait(40)
    screenIn = true

    await wait(120)
    beamVisible = true
    await wait(30)
    beamOpacity = 1

    phase = 'visible'
    await wait(20)
    ejectBtnEl?.focus()
  }

  async function doClose() {
    clearTids()
    videoEl?.pause()

    phase = 'closing'
    beamOpacity = 0
    screenOut = true
    await wait(80)
    beamVisible = false
    screenIn = false
    await wait(300)

    phase = 'idle'
    screenOut = false
    videoSrc = null
    _openerEl?.focus()
    _openerEl = null
  }

  $effect(() => {
    const o = isOpen
    if (o && !_opening) {
      _opening = true
      doOpen()
    }
    if (!o && _opening) {
      _opening = false
      doClose()
    }
  })

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeModal()
      return
    }
    if (e.key === 'Tab' && phase === 'visible') {
      const dialog = document.querySelector('[role="dialog"]') as HTMLElement | null
      if (!dialog)
        return
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(el => !el.hasAttribute('disabled'))
      if (focusable.length === 0)
        return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
  }

  let mediaAspect = $state<number | null>(null)
  let imgLoaded = $state(false)
  let gateEl = $state<HTMLDivElement | null>(null)
  let gateHeight = $state<number | null>(null)

  function onVideoMeta() {
    if (videoEl?.videoWidth && videoEl.videoHeight)
      mediaAspect = videoEl.videoWidth / videoEl.videoHeight
  }

  $effect(() => {
    void media
    mediaAspect = null
    if (media?.type === 'image') {
      imgLoaded = false
      const img = new Image()
      img.onload = () => {
        mediaAspect = img.naturalWidth / img.naturalHeight
      }
      img.src = withBase(media.src)
    }
  })

  let gateWidth = $state(0)

  function readViewportH() {
    if (typeof window === 'undefined')
      return 800
    return window.visualViewport?.height ?? window.innerHeight
  }
  let viewportH = $state(readViewportH())
  let belowEl = $state<HTMLDivElement | null>(null)
  let belowH = $state(0)
  const RESERVE_V = 96
  const maxGateHeight = $derived(Math.max(80, viewportH - belowH - RESERVE_V))

  const MIN_SCALE = 1
  const MAX_SCALE = 6
  let zScale = $state(1)
  let zx = $state(0)
  let zy = $state(0)
  let interacting = $state(false)

  const pointers = new Map<number, { x: number, y: number }>()
  let pinchStartDist = 0
  let pinchStartScale = 1
  let isPanning = false
  let lastX = 0
  let lastY = 0

  function resetZoom() {
    zScale = 1
    zx = 0
    zy = 0
  }

  $effect(() => {
    void media
    resetZoom()
  })

  function clampPan() {
    const maxX = (zScale - 1) * gateWidth / 2
    const maxY = (zScale - 1) * (gateHeight ?? 0) / 2
    zx = Math.max(-maxX, Math.min(maxX, zx))
    zy = Math.max(-maxY, Math.min(maxY, zy))
  }

  function zoomAt(cx: number, cy: number, next: number) {
    next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next))
    if (next === zScale)
      return
    const ratio = next / zScale
    zx = cx - (cx - zx) * ratio
    zy = cy - (cy - zy) * ratio
    zScale = next
    if (zScale === 1) {
      zx = 0
      zy = 0
    } else {
      clampPan()
    }
  }

  function localPoint(e: { clientX: number, clientY: number, currentTarget: EventTarget | null }) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    return {
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    }
  }

  function onWheel(e: WheelEvent) {
    if (media?.type !== 'image')
      return
    e.preventDefault()
    const p = localPoint(e)
    zoomAt(p.x, p.y, zScale * (e.deltaY < 0 ? 1.15 : 1 / 1.15))
  }

  function onDblClick(e: MouseEvent) {
    if (media?.type !== 'image')
      return
    if (zScale > 1) {
      resetZoom()
    } else {
      const p = localPoint(e)
      zoomAt(p.x, p.y, 2.5)
    }
  }

  function onPointerDown(e: PointerEvent) {
    if (media?.type !== 'image')
      return
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    interacting = true
    if (pointers.size === 1) {
      isPanning = zScale > 1
      lastX = e.clientX
      lastY = e.clientY
    } else if (pointers.size === 2) {
      isPanning = false
      const pts = [...pointers.values()]
      pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      pinchStartScale = zScale
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!pointers.has(e.pointerId))
      return
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.size === 2 && pinchStartDist > 0) {
      const pts = [...pointers.values()]
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchStartScale * dist / pinchStartDist))
      zScale = next
      if (zScale === 1) {
        zx = 0
        zy = 0
      } else {
        clampPan()
      }
    } else if (isPanning && pointers.size === 1) {
      zx += e.clientX - lastX
      zy += e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      clampPan()
    }
  }

  function onPointerUp(e: PointerEvent) {
    pointers.delete(e.pointerId)
    if (pointers.size < 2)
      pinchStartDist = 0
    if (pointers.size === 1) {
      const p = [...pointers.values()][0]
      isPanning = zScale > 1
      lastX = p.x
      lastY = p.y
    }
    if (pointers.size === 0) {
      isPanning = false
      interacting = false
    }
  }

  $effect(() => {
    const el = gateEl
    if (!el)
      return
    const ro = new ResizeObserver(entries => {
      gateWidth = entries[0]?.contentRect.width ?? 0
    })
    const rafId = requestAnimationFrame(() => ro.observe(el))
    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  })

  $effect(() => {
    const el = belowEl
    if (!el)
      return
    const ro = new ResizeObserver(entries => {
      belowH = entries[0]?.contentRect.height ?? 0
    })
    ro.observe(el)
    return () => ro.disconnect()
  })

  let yearEl = $state<HTMLSpanElement | null>(null)
  let yearHidden = $state(false)

  function measureYear() {
    const el = yearEl
    if (!el)
      return
    yearHidden = el.scrollWidth > el.clientWidth + 1
  }

  $effect(() => {
    void displayWork
    const el = yearEl
    if (!el)
      return
    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measureYear)
    }
    const ro = new ResizeObserver(schedule)
    ro.observe(el)
    schedule()
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  })

  $effect(() => {
    const w = gateWidth
    const aspect = mediaAspect ?? (16 / 9)
    const cap = maxGateHeight
    if (w > 0)
      gateHeight = Math.min(w / aspect, cap)
  })

  const showBackdrop = $derived(phase !== 'idle')

  const mediaDescription = $derived(localize(media?.description, $lang))

  const workHasDescription = $derived(
    !!displayWork
    && [displayWork.main, ...(displayWork.wip ?? [])].some(m => !!m.description),
  )

  function reelName(wip: WorkMedia, i: number): string {
    return wip.name ?? (localize(wip.caption, $lang) || `WIP ${i + 1}`)
  }
</script>

<svelte:window onkeydown={onKeydown} onresize={() => { viewportH = readViewportH() }} />

{#if showBackdrop}
  <div
    class='bd'
    onclick={closeModal}
    onkeydown={e => e.key === 'Enter' && closeModal()}
    role='button'
    tabindex='-1'
    aria-label='Close projection'
    in:fade={{ duration: 180 }}
    out:fade={{ duration: 220 }}
  >

    {#if beamVisible}
      <div class='beam' style='opacity:{beamOpacity}' aria-hidden='true'></div>
    {/if}

    <div
      class='screen-wrap'
      class:screen-wrap--in={screenIn}
      class:screen-wrap--out={screenOut}
      role='dialog'
      aria-modal='true'
      aria-label={displayWork?.title ?? 'Work preview'}
      onclick={e => e.stopPropagation()}
      onkeydown={e => { if (e.key !== 'Escape') e.stopPropagation() }}
    >

      <div class='corner corner--tl' aria-hidden='true'></div>
      <div class='corner corner--tr' aria-hidden='true'></div>
      <div class='corner corner--bl' aria-hidden='true'></div>
      <div class='corner corner--br' aria-hidden='true'></div>

      <button
        bind:this={ejectBtnEl}
        class='eject-btn'
        onclick={e => {
          e.stopPropagation()
          closeModal()
        }}
        aria-label='Close'
        type='button'
      >
        <span class='eject-label'>EJECT</span>
        <svg class='eject-icon' viewBox='0 0 20 20' fill='none' aria-hidden='true'>
          <polyline points='4,14 10,6 16,14' stroke='currentColor' stroke-width='1.6'
                    stroke-linecap='square' stroke-linejoin='miter' />
          <line x1='4' y1='16.5' x2='16' y2='16.5' stroke='currentColor' stroke-width='1.6'
                stroke-linecap='square' />
        </svg>
      </button>

      <div class='gate' bind:this={gateEl} style={gateHeight ? `height:${gateHeight}px` : 'aspect-ratio:16/9'}>

        {#if media?.type === 'video'}
          <div class='media-layer'>
            <!-- svelte-ignore a11y_media_has_caption -->
            <video
              bind:this={videoEl}
              src={videoSrc ?? undefined}
              poster={media.poster ? withBase(media.poster) : undefined}
              onloadedmetadata={onVideoMeta}
              controls
              loop
              playsinline
              controlslist='nodownload'
              preload='metadata'
              class='media-video'
              onclick={e => e.stopPropagation()}
            ></video>
          </div>
        {/if}

        {#if media?.type === 'image'}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class='media-layer media-layer--zoom'
            style:cursor={zScale > 1 ? (interacting ? 'grabbing' : 'grab') : 'zoom-in'}
            onwheel={onWheel}
            ondblclick={onDblClick}
            onpointerdown={onPointerDown}
            onpointermove={onPointerMove}
            onpointerup={onPointerUp}
            onpointercancel={onPointerUp}
          >
            <img
              src={withBase(media.src)}
              alt={displayWork?.title ?? ''}
              class='media-img'
              class:media-img--hidden={!imgLoaded}
              draggable='false'
              onload={() => { imgLoaded = true }}
              style={`transform: translate(${zx}px, ${zy}px) scale(${zScale}); transition: ${interacting ? 'none' : 'transform 0.18s ease'};`}
            />
          </div>
        {/if}

        {#if media?.type === 'image' && !imgLoaded}
          <div class='loading' aria-live='polite'>
            <svg
              class='loading__reel'
              viewBox='0 0 200 200'
              width='72'
              height='72'
              aria-hidden='true'
              xmlns='http://www.w3.org/2000/svg'
            >
              <circle cx='100' cy='100' r='96' class='reel-body' />
              {#each { length: 6 } as _, i}
                <circle cx='100' cy='40' r='26' class='reel-hole' transform={`rotate(${i * 60} 100 100)`} />
              {/each}
              <circle cx='100' cy='100' r='24' class='reel-core' />
              {#each { length: 6 } as _, i}
                <circle cx='100' cy='78' r='5' class='reel-bolt' transform={`rotate(${i * 60} 100 100)`} />
              {/each}
              <circle cx='100' cy='100' r='10' class='reel-center' />
            </svg>
            <span class='loading__label'>LOADING</span>
          </div>
        {/if}

        <div class='scanlines' aria-hidden='true'></div>

        <div class='lens-vignette' aria-hidden='true'></div>

        <div class='screen-sheen' aria-hidden='true'></div>

      </div>

      <div class='below' bind:this={belowEl}>
      <div class='data-strip'>
        <div class='data-col data-col--left'>
          <span class='data-value'>{displayWork?.title ?? '—'}</span>
          {#if displayWork?.year}
            <span class='data-value data-value--year' class:data-value--year-gone={yearHidden} bind:this={yearEl}>{String(displayWork.year).slice(0, 2)}<wbr>{String(displayWork.year).slice(2)}</span>
          {/if}
        </div>

        {#if displayWork?.wip?.length || workHasDescription}
          <div class='data-col data-col--right reel-tabs' role='toolbar' aria-label='Select reel' tabindex='0' onclick={e => e.stopPropagation()} onkeydown={e => { if (e.key !== 'Escape') e.stopPropagation() }}>

            {#if workHasDescription}
              <button
                class='reel-btn lang-btn'
                onclick={e => {
                  e.stopPropagation()
                  toggleLang()
                }}
                aria-label={$lang === 'ru' ? 'Switch to English' : 'Переключить на русский'}
                type='button'
              >
                <span class='lang-btn__opt lang-btn__opt--en' class:lang-btn__opt--on={$lang === 'en'}>EN</span>
                <span class='lang-btn__opt lang-btn__opt--ru' class:lang-btn__opt--on={$lang === 'ru'}>RU</span>
              </button>
            {/if}

            {#if displayWork?.wip?.length}
            <button
              class='reel-btn'
              class:reel-btn--active={mediaIndex === -1}
              onclick={() => {
                mediaIndex = -1
              }}
              aria-label='Reel'
              type='button'
            >1</button>

            {#each displayWork.wip as wip, i}
              <button
                class='reel-btn'
                class:reel-btn--active={mediaIndex === i}
                onclick={() => {
                  mediaIndex = i
                }}
                aria-label={reelName(wip, i)}
                type='button'
              >{i + 2}</button>
            {/each}
            {/if}

          </div>
        {/if}
      </div>

      {#if mediaDescription}
        <div class='desc-strip'>
          <p class='desc-text'>{mediaDescription}</p>
        </div>
      {/if}
      </div>

    </div>
  </div>
{/if}

<style>

  .bd {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(3, 2, 1, 0.97);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
  }

  .beam {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 0;
    width: 0;
    height: 0;
    border-left:  90px solid transparent;
    border-right: 90px solid transparent;
    border-top: 52vh solid rgba(223, 225, 215, 0.02);
    filter: blur(24px);
    transition: opacity 0.7s ease;
  }

  .screen-wrap {
    position: relative;
    width: min(660px, calc(min(100vw, 100dvh * (2 / 3)) - 46px));
    cursor: default;
    z-index: 1;
    opacity: 0;
    transform: translateY(12px);
    transition:
      opacity 0.34s ease,
      transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
    filter:
      drop-shadow(0 -4px 60px rgba(223, 225, 215, 0.03))
      drop-shadow(0 40px 90px rgba(0, 0, 0, 0.99));
  }

  .screen-wrap--in {
    opacity: 1;
    transform: translateY(0);
  }

  .screen-wrap--out {
    opacity: 0;
    transform: translateY(-12px);
  }

  .corner {
    position: absolute;
    width: 15px;
    height: 15px;
    z-index: 20;
    pointer-events: none;
  }

  .corner--tl { top: -10px;  left: -10px;
    border-top:    0.25rem solid var(--color-secondary);
    border-left:   0.25rem solid var(--color-secondary); }
  .corner--tr { top: -10px;  right: -10px;
    border-top:    0.25rem solid var(--color-secondary);
    border-right:  0.25rem solid var(--color-secondary); }
  .corner--bl { bottom: -10px; left: -10px;
    border-bottom: 0.25rem solid var(--color-secondary);
    border-left:   0.25rem solid var(--color-secondary); }
  .corner--br { bottom: -10px; right: -10px;
    border-bottom: 0.25rem solid var(--color-secondary);
    border-right:  0.25rem solid var(--color-secondary); }

  .eject-btn {
    position: absolute;
    top: -40px;
    right: -15px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-secondary);
    font-size: clamp(0.75rem, 0.636rem + 0.227vw, 1rem);
    font-weight: 700;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--color-secondary);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 0;
    transition: color 0.15s;
    z-index: 20;
  }

  .eject-btn:hover { color: rgba(223, 225, 215, 0.72); }
  .eject-icon { width: 15px; height: 15px; flex-shrink: 0; }
  .eject-label { display: block; }

  .gate {
    position: relative;
    width: 100%;
    background: #080604;
    overflow: hidden;
    transition: height 0.38s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .media-layer {
    position: absolute;
    inset: 0;
    z-index: 2;
  }

  .media-layer--zoom {
    touch-action: none;
    z-index: 6;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  .media-layer--zoom .media-img {
    -webkit-user-drag: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .media-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    background: var(--color-primary);
  }

  .media-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  .media-img--hidden {
    opacity: 0;
  }

  .loading {
    position: absolute;
    inset: 0;
    z-index: 7;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    pointer-events: none;
  }

  .loading__reel {
    animation: loading-spin 3.6s linear infinite;
  }

  .loading__reel .reel-body {
    fill: var(--color-secondary);
    filter:
      drop-shadow(0 0 6px rgba(223,225,215,0.08))
      drop-shadow(0 0 2px rgba(0,0,0,0.4));
  }

  .loading__reel .reel-hole   { fill: var(--color-primary); }
  .loading__reel .reel-core   { fill: var(--color-secondary); }
  .loading__reel .reel-bolt   { fill: var(--color-primary); }
  .loading__reel .reel-center { fill: var(--color-primary); }

  .loading__label {
    font-family: var(--font-secondary);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: rgba(223, 225, 215, 0.55);
    animation: loading-blink 1.1s ease-in-out infinite;
  }

  @keyframes loading-spin {
    to { transform: rotate(360deg); }
  }

  @keyframes loading-blink {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.8; }
  }

  .scanlines {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent 3px,
      rgba(0,0,0,0.07) 3px,
      rgba(0,0,0,0.07) 4px
    );
    z-index: 8;
  }

  .lens-vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(
      ellipse 92% 88% at 50% 50%,
      transparent 36%,
      rgba(0,0,0,0.52) 100%
    );
    z-index: 9;
  }

  .screen-sheen {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(140deg, rgba(255,255,255,0.011) 0%, transparent 50%),
      linear-gradient(to bottom, rgba(255,255,255,0.005) 0%, transparent 38%);
    z-index: 10;
  }

  .data-strip {
    background: var(--color-primary);
    border-top: 1px solid rgba(223,225,215,0.07);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 16px;
    min-height: 40px;
  }

  .data-col {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
  }

  .data-value {
    font-family: var(--font-main);
    font-size: clamp(1.0625rem, 0.864rem + 0.398vw, 1.5rem);
    letter-spacing: 0.12em;
    color: var(--color-secondary);
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow:
      1px 1px 0 rgba(0,0,0,0.6),
      0 2px 4px rgba(0,0,0,0.25);
  }

  .data-value--year {
    color: rgba(223,225,215,0.4);
    text-shadow: none;
    min-width: 0;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    word-break: keep-all;
    text-align: center;
    line-height: 0.9;
  }

  .data-value--year-gone {
    visibility: hidden;
  }

  .lang-btn {
    position: relative;
    padding: 0;
    font-family: var(--font-main);
    overflow: hidden;
  }

  .lang-btn__opt {
    position: absolute;
    font-size: 1.25rem;
    line-height: 1;
    color: rgba(223,225,215,0.34);
    transition: color 0.14s, text-shadow 0.14s;
  }

  .lang-btn__opt--en {
    top: 6px;
    left: 7px;
  }

  .lang-btn__opt--ru {
    bottom: 6px;
    right: 7px;
  }

  .lang-btn__opt--on {
    color: rgba(245,243,232,0.95);
    text-shadow: 0 0 7px rgba(223,225,215,0.45);
  }

  .lang-btn:focus-visible {
    outline: 1px solid var(--color-secondary);
    outline-offset: 2px;
  }

  .desc-strip {
    background: var(--color-primary);
    border-top: 1px solid rgba(223,225,215,0.07);
    padding: 12px 16px 14px;
  }

  .desc-text {
    margin: 0;
    max-width: 64ch;
    font-family: var(--font-main), var(--font-body);
    font-size: clamp(1.0625rem, 0.864rem + 0.398vw, 1.5rem);
    font-weight: 400;
    line-height: 1.4;
    letter-spacing: 0.04em;
    color: rgba(223, 225, 215, 0.55);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  .reel-tabs {
    flex-shrink: 0;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    overflow: visible;
  }

  .reel-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-main);
    font-size: 1.5rem;
    line-height: 1;
    letter-spacing: 0.04em;
    color: rgba(223,225,215,0.38);
    background: rgba(223,225,215,0.02);
    border: 1px solid rgba(223,225,215,0.12);
    width: 44px;
    height: 44px;
    padding: 0;
    cursor: pointer;
    transition: color 0.16s, border-color 0.16s, background 0.16s, box-shadow 0.16s;
  }

  .reel-btn:hover:not(.reel-btn--active) {
    color: rgba(223,225,215,0.7);
    border-color: rgba(223,225,215,0.3);
    background: rgba(223,225,215,0.05);
  }

  .reel-btn--active {
    color: rgba(245,243,232,0.96);
    border-color: rgba(223,225,215,0.55);
    background: rgba(223,225,215,0.08);
    text-shadow: 0 0 8px rgba(223,225,215,0.55);
    box-shadow:
      0 0 12px rgba(223,225,215,0.22),
      inset 0 0 10px rgba(223,225,215,0.1);
  }

  .reel-btn:focus-visible {
    outline: 1px solid var(--color-secondary);
    outline-offset: 2px;
  }
</style>
