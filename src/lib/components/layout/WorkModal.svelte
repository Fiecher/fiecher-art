<script lang='ts'>
  import { closeModal, modalCell } from '$lib/modal'
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
  $effect(() => {
    if (work)
      mediaIndex = -1
  })

  const media = $derived<WorkMedia | undefined>(
    mediaIndex === -1 ? displayWork?.main : displayWork?.wip?.[mediaIndex],
  )

  type Phase = 'idle' | 'open' | 'poster' | 'igniting' | 'loading' | 'playing' | 'closing'
  let phase = $state<Phase>('idle')

  let screenIn = $state(false)
  let flickerOn = $state(true)
  let videoReady = $state(false)
  let videoSrc = $state<string | null>(null)
  let videoEl = $state<HTMLVideoElement | null>(null)

  let flashOpacity = $state(0)

  let mediaAspect = $state<number | null>(null)

  const showBackdrop = $derived(phase !== 'idle')

  let tids: number[] = []
  const clearTids = () => {
    tids.forEach(clearTimeout)
    tids = []
  }
  const wait = (ms: number) => new Promise<void>(r => {
    tids.push(window.setTimeout(r, ms))
  })

  let flickerRaf = 0
  function stopFlicker() {
    cancelAnimationFrame(flickerRaf)
    flickerRaf = 0
    flickerOn = true
  }
  function runFlicker() {
    const delays = [85, 50, 125, 45, 100, 55, 115, 65, 90, 145]
    let i = 0
    let last = performance.now()
    const tick = (now: number) => {
      if (now - last >= delays[i % delays.length]) {
        flickerOn = !flickerOn
        last = now
        i++
      }
      flickerRaf = requestAnimationFrame(tick)
    }
    flickerRaf = requestAnimationFrame(tick)
  }

  // ── Resolve aspect ratio from an image URL ────────────────
  function loadImageAspect(src: string) {
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight)
        mediaAspect = img.naturalWidth / img.naturalHeight
    }
    img.src = src
  }

  let _opening = false

  async function doOpen() {
    clearTids()
    stopFlicker()
    screenIn = false
    flickerOn = true
    flashOpacity = 0
    videoReady = false
    videoSrc = null
    mediaAspect = null

    const main = displayWork?.main
    if (main?.type === 'video' && main.poster)
      loadImageAspect(main.poster)
    else if (main?.type === 'image')
      loadImageAspect(main.src)

    phase = 'open'
    await wait(30)
    screenIn = true
    await wait(280)
    phase = 'poster'
  }

  async function doIgnite() {
    phase = 'igniting'

    videoSrc = displayWork?.main.src ?? null

    await wait(80)

    const rattlePattern = [60, 40, 90, 30, 70, 45, 55, 35, 80, 25, 65, 50]
    for (const ms of rattlePattern) {
      flickerOn = !flickerOn
      await wait(ms)
    }
    flickerOn = true

    await wait(120)

    flashOpacity = 0.72
    await wait(60)
    flashOpacity = 0.38
    await wait(80)
    flashOpacity = 0.18
    await wait(120)
    flashOpacity = 0

    phase = 'loading'
    runFlicker()

    if (videoReady) {
      stopFlicker()
      phase = 'playing'
      videoEl?.play().catch(() => {})
    }
  }

  function handlePlay() {
    if (phase !== 'poster')
      return
    doIgnite()
  }

  async function doClose() {
    clearTids()
    stopFlicker()
    videoEl?.pause()
    flashOpacity = 0
    phase = 'closing'
    screenIn = false
    await wait(280)
    phase = 'idle'
    videoSrc = null
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

  function onCanPlay() {
    videoReady = true
    if (phase === 'loading') {
      stopFlicker()
      phase = 'playing'
      videoEl?.play().catch(() => {})
    }
  }

  function onVideoMeta() {
    if (videoEl?.videoWidth && videoEl.videoHeight)
      mediaAspect = videoEl.videoWidth / videoEl.videoHeight
  }

  $effect(() => {
    void media
    if (media?.type === 'image')
      loadImageAspect(media.src)
  })

  const canvasAspect = $derived(mediaAspect ? `${mediaAspect}` : '16/9')

  const mediaOpacity = $derived(
    phase === 'playing' ?
      1 :
        phase === 'loading' ? (flickerOn ? 0.78 : 0.04) : 0,
  )
  const mediaTransition = $derived(
    phase === 'loading' ? 'opacity 0.04s linear' : 'opacity 0.35s ease',
  )

  const showDarkCover = $derived(phase === 'open' || phase === 'igniting')

  const posterBrightness = $derived(
    phase === 'igniting' ? (flickerOn ? 0.55 : 0.05) : 1,
  )
  const posterTransition = $derived(
    phase === 'igniting' ? 'filter 0.04s linear' : 'filter 0.2s ease',
  )

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape')
      closeModal()
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if showBackdrop}
  <div
    class='bd'
    onclick={closeModal}
    role='button'
    tabindex='-1'
    aria-label='Close'
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 200 }}
  >
    <div
      class='screen-wrap'
      class:screen-wrap--in={screenIn}
      onclick={e => e.stopPropagation()}
    >
      <div class='canvas' style='aspect-ratio:{canvasAspect}'>

        <div class='fabric' aria-hidden='true'></div>
        {#if media?.type === 'video'}
          {#if phase === 'poster' || phase === 'igniting' || phase === 'loading'}
            <div
              class='poster-layer'
              style='filter:brightness({posterBrightness});transition:{posterTransition}'
              aria-hidden='true'
            >
              <img src={media.poster ?? ''} alt='' class='poster-img' draggable='false' />
            </div>
          {/if}
          {#if videoSrc}
            <div
              class='media-layer'
              style='opacity:{mediaOpacity};transition:{mediaTransition}'
              aria-hidden={phase !== 'playing'}
            >
              <video
                bind:this={videoEl}
                src={videoSrc}
                poster={media.poster}
                oncanplay={onCanPlay}
                onloadedmetadata={onVideoMeta}
                controls
                loop
                playsinline
                controlslist='nodownload'
                class='media-video'
                onclick={e => e.stopPropagation()}
              ></video>
            </div>
          {/if}
          {#if phase === 'loading'}
            <div class='scanlines' aria-hidden='true'></div>
            <div class='vignette' aria-hidden='true'></div>
            <div class='grain' aria-hidden='true'></div>
            <div class='reel-wrap' aria-label='Loading' aria-live='polite'>
              <svg class='reel' viewBox='0 0 200 200' aria-hidden='true' xmlns='http://www.w3.org/2000/svg'>
                <circle cx='100' cy='100' r='96' class='reel-body' />
                {#each { length: 6 } as _, i}
                  <circle cx='100' cy='40' r='26' class='reel-hole'
                          transform={`rotate(${i * 60} 100 100)`} />
                {/each}
                <circle cx='100' cy='100' r='24' class='reel-core' />
                {#each { length: 6 } as _, i}
                  <circle cx='100' cy='78' r='5' class='reel-bolt'
                          transform={`rotate(${i * 60} 100 100)`} />
                {/each}
                <circle cx='100' cy='100' r='10' class='reel-center' />
              </svg>
            </div>
          {/if}
          {#if phase === 'poster'}
            <button
              class='play-btn'
              onclick={e => {
                e.stopPropagation(); handlePlay()
              }}
              aria-label='Play'
              type='button'
            >
              <svg class='play-icon' viewBox='0 0 60 60' fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>
                <polygon points='14,8 54,30 14,52' fill='currentColor' />
              </svg>
            </button>
          {/if}
          {#if flashOpacity > 0}
            <div
              class='proj-flash'
              style='opacity:{flashOpacity}'
              aria-hidden='true'
            ></div>
          {/if}

        {/if}
        {#if media?.type === 'image'}
          <div
            class='media-layer'
            style='opacity:{phase === 'playing' || phase === 'loading' ? 1 : 0};transition:opacity 0.35s ease'
          >
            <img src={media.src} alt={displayWork?.title ?? ''} class='media-img' draggable='false' />
          </div>
          <div class='scanlines' aria-hidden='true'></div>
          <div class='vignette' aria-hidden='true'></div>
        {/if}

        <div class='screen-sheen' aria-hidden='true'></div>

        {#if showDarkCover}
          <div class='dark-cover' aria-hidden='true'></div>
        {/if}

      </div>
      {#if displayWork}
        <div class='meta-bar'>
          <div class='meta-info'>
            <span class='meta-title'>{displayWork.title}</span>
            {#if displayWork.year}
              <span class='meta-year'>{displayWork.year}</span>
            {/if}
          </div>

          {#if displayWork.wip?.length}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class='wip-tabs' onclick={e => e.stopPropagation()}>
              <button
                class='wip-tab'
                class:wip-tab--active={mediaIndex === -1}
                onclick={() => {
                  mediaIndex = -1
                }}
                type='button'
              >MAIN</button>
              {#each displayWork.wip as _, i}
                <button
                  class='wip-tab'
                  class:wip-tab--active={mediaIndex === i}
                  onclick={() => {
                    mediaIndex = i
                  }}
                  type='button'
                >WIP {i + 1}</button>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

    </div>
    <button
      class='close-btn'
      onclick={e => {
        e.stopPropagation(); closeModal()
      }}
      aria-label='Close'
      type='button'
    >ESC</button>

  </div>
{/if}

<style>
  .bd {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(4, 3, 2, 0.96);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
  }

  .screen-wrap {
    position: relative;
    width: min(88vw, 720px);
    cursor: default;
    z-index: 1;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.28s ease, transform 0.28s ease;
    filter: drop-shadow(0 24px 80px rgba(0, 0, 0, 0.95));
  }
  .screen-wrap--in {
    opacity: 1;
    transform: translateY(0);
  }

  .canvas {
    position: relative;
    width: 100%;
    background: var(--color-primary);
    overflow: hidden;
  }

  .fabric {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.04;
    background-image:
      repeating-linear-gradient(0deg,   transparent 0, transparent 3px, rgba(255,255,255,.5) 3px, rgba(255,255,255,.5) 4px),
      repeating-linear-gradient(90deg,  transparent 0, transparent 3px, rgba(255,255,255,.5) 3px, rgba(255,255,255,.5) 4px);
    background-size: 4px 4px;
    z-index: 1;
  }

  .poster-layer {
    position: absolute;
    inset: 0;
    z-index: 2;
  }
  .poster-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .media-layer {
    position: absolute;
    inset: 0;
    z-index: 2;
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

  .scanlines {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0, transparent 3px,
      rgba(0, 0, 0, .10) 3px, rgba(0, 0, 0, .10) 4px
    );
    z-index: 3;
  }
  .vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(ellipse 88% 82% at 50% 50%, transparent 36%, rgba(0,0,0,.66) 100%);
    z-index: 4;
  }
  .grain {
    position: absolute;
    inset: -5%;
    width: 110%;
    height: 110%;
    opacity: .07;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 180px 180px;
    animation: grain-anim .09s steps(1) infinite;
    z-index: 5;
  }
  @keyframes grain-anim {
    0%  { background-position: 0 0 }
    25% { background-position: -42px -18px }
    50% { background-position: 22px -52px }
    75% { background-position: -58px 14px }
  }

  .reel-wrap {
    position: absolute;
    inset: 0;
    z-index: 6;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .reel {
    width: clamp(56px, 13vw, 104px);
    height: clamp(56px, 13vw, 104px);
    animation: reel-spin 3.6s linear infinite;
    opacity: 0.6;
  }
  @keyframes reel-spin { to { transform: rotate(360deg); } }

  .reel-body   { fill: var(--color-secondary); }
  .reel-hole   { fill: var(--color-primary); }
  .reel-core   { fill: var(--color-secondary); }
  .reel-bolt   { fill: var(--color-primary); }
  .reel-center { fill: var(--color-primary); }

  .play-btn {
    position: absolute;
    inset: 0;
    z-index: 9;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(4, 3, 2, 0.28);
    border: none;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  .play-btn:hover {
    background: rgba(4, 3, 2, 0.48);
  }
  .play-icon {
    width: clamp(52px, 10vw, 80px);
    height: clamp(52px, 10vw, 80px);
    color: var(--color-secondary);
    opacity: 0.88;
    filter: drop-shadow(0 2px 20px rgba(0, 0, 0, 0.8));
    transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.18s ease;
  }
  .play-btn:hover .play-icon {
    transform: scale(1.1);
    opacity: 1;
  }

  .screen-sheen {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(132deg, rgba(255,255,255,.018) 0%, transparent 42%),
      linear-gradient(to bottom, rgba(255,255,255,.006) 0%, transparent 36%);
    z-index: 7;
  }
  .dark-cover {
    position: absolute;
    inset: 0;
    background: var(--color-primary);
    pointer-events: none;
    z-index: 8;
  }

  .proj-flash {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 9;
    background: radial-gradient(
      ellipse 80% 70% at 50% 50%,
      rgba(255, 245, 200, 1)   0%,
      rgba(255, 220, 120, 0.9) 30%,
      rgba(255, 180,  60, 0.5) 60%,
      transparent              100%
    );
  }

  .meta-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 16px;
    background: var(--color-primary);
    border-top: 1px solid rgba(223, 225, 215, 0.08);
  }

  .meta-info {
    display: flex;
    align-items: baseline;
    gap: 14px;
    min-width: 0;
  }

  .meta-title {
    font-family: var(--font-main);
    font-size: clamp(1.3rem, 3.5vw, 2rem);
    letter-spacing: .14em;
    color: var(--color-secondary);
    text-transform: uppercase;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meta-year {
    font-family: var(--font-secondary);
    font-size: clamp(.65rem, 1.4vw, .9rem);
    letter-spacing: .22em;
    color: var(--color-secondary);
    opacity: .35;
    white-space: nowrap;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .wip-tabs {
    display: flex;
    gap: 3px;
    flex-shrink: 0;
  }
  .wip-tab {
    font-family: var(--font-secondary);
    font-size: .62rem;
    font-weight: 700;
    letter-spacing: .18em;
    color: rgba(223, 225, 215, .35);
    background: none;
    border: 1px solid rgba(223, 225, 215, .12);
    padding: 5px 10px;
    cursor: pointer;
    text-transform: uppercase;
    transition: color .15s, border-color .15s, background .15s;
  }
  .wip-tab--active {
    color: rgba(223, 225, 215, .85);
    border-color: rgba(223, 225, 215, .35);
    background: rgba(223, 225, 215, .06);
  }
  .wip-tab:hover:not(.wip-tab--active) {
    color: rgba(223, 225, 215, .6);
    border-color: rgba(223, 225, 215, .22);
  }

  .close-btn {
    position: fixed;
    top: 22px;
    right: 26px;
    z-index: 10000;
    font-family: var(--font-secondary);
    font-size: .75rem;
    font-weight: 700;
    letter-spacing: .28em;
    text-transform: uppercase;
    color: rgba(223, 225, 215, .45);
    background: none;
    border: 1px solid rgba(223, 225, 215, .18);
    padding: 10px 20px;
    cursor: pointer;
    transition: color .15s, border-color .15s, background .15s;
  }
  .close-btn:hover {
    color: var(--color-secondary);
    border-color: rgba(223, 225, 215, .45);
    background: rgba(223, 225, 215, .06);
  }
</style>
