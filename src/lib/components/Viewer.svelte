<script lang='ts'>
  import { withBase } from '$lib/config'
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
      const img = new Image()
      img.onload = () => {
        mediaAspect = img.naturalWidth / img.naturalHeight
      }
      img.src = withBase(media.src)
    }
  })

  $effect(() => {
    const aspect = mediaAspect ?? (16 / 9)
    if (!gateEl)
      return
    const w = gateEl.getBoundingClientRect().width
    if (w > 0)
      gateHeight = w / aspect
  })

  const showBackdrop = $derived(phase !== 'idle')

  function reelName(wip: WorkMedia, i: number): string {
    return wip.name ?? wip.caption ?? `WIP ${i + 1}`
  }
</script>

<svelte:window onkeydown={onKeydown} />

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
      onkeydown={e => e.stopPropagation()}
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
          <div class='media-layer'>
            <img src={withBase(media.src)} alt={displayWork?.title ?? ''} class='media-img' draggable='false' />
          </div>
        {/if}

        <div class='scanlines' aria-hidden='true'></div>

        <div class='lens-vignette' aria-hidden='true'></div>

        <div class='screen-sheen' aria-hidden='true'></div>

      </div>

      <div class='data-strip'>
        <div class='data-col data-col--left'>
          <span class='data-value'>{displayWork?.title ?? '—'}</span>
        </div>
        <div class='data-col data-col--right'>
          {#if displayWork?.year}
            <span class='data-value'>{displayWork.year}</span>
          {/if}
        </div>
      </div>

      {#if displayWork?.wip?.length}
        <div class='reel-bar' role='toolbar' aria-label='Select reel' tabindex='0' onclick={e => e.stopPropagation()} onkeydown={e => e.stopPropagation()}>

          <button
            class='reel-btn'
            class:reel-btn--active={mediaIndex === -1}
            onclick={() => {
              mediaIndex = -1
            }}
            type='button'
          >
            <span class='reel-btn__led' aria-hidden='true'></span>
            <span class='reel-btn__name'>REEL</span>
          </button>

          {#each displayWork.wip as wip, i}
            <button
              class='reel-btn'
              class:reel-btn--active={mediaIndex === i}
              onclick={() => {
                mediaIndex = i
              }}
              type='button'
            >
              <span class='reel-btn__led' aria-hidden='true'></span>
              <span class='reel-btn__name'>{reelName(wip, i)}</span>
            </button>
          {/each}

        </div>
      {/if}

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
    width: 60vw;
    height: 55vh;
    background: radial-gradient(
      ellipse 50% 100% at 50% 0%,
      rgba(223, 225, 215, 0.055) 0%,
      rgba(223, 225, 215, 0.018) 40%,
      transparent 100%
    );
    transition: opacity 0.7s ease;
  }

  .screen-wrap {
    position: relative;
    width: min(80vw, 660px);
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
    align-items: baseline;
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

  .reel-bar {
    background: var(--color-primary);
    border-top: 1px solid rgba(223,225,215,0.06);
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    padding: 10px 16px 12px;
  }

  .reel-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    font-family: var(--font-secondary);
    font-size: clamp(0.75rem, 0.636rem + 0.227vw, 1rem);
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(223,225,215,0.3);
    background: none;
    border: 1px solid rgba(223,225,215,0.08);
    padding: 10px 18px 10px;
    cursor: pointer;
    min-width: 80px;
    transition: color 0.14s, border-color 0.14s, background 0.14s;
    position: relative;
  }

  .reel-btn__led {
    display: block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(223,225,215,0.14);
    flex-shrink: 0;
    transition: background 0.14s, box-shadow 0.14s;
  }

  .reel-btn__name {
    line-height: 1;
  }

  .reel-btn--active {
    color: rgba(223,225,215,0.88);
    border-color: rgba(223,225,215,0.28);
    background: rgba(223,225,215,0.05);
  }

  .reel-btn--active .reel-btn__led {
    background: rgba(223,225,215,0.9);
    box-shadow: 0 0 7px rgba(223,225,215,0.5);
  }

  .reel-btn:hover:not(.reel-btn--active) {
    color: rgba(223,225,215,0.55);
    border-color: rgba(223,225,215,0.18);
  }

  .reel-btn:hover:not(.reel-btn--active) .reel-btn__led {
    background: rgba(223,225,215,0.35);
  }
</style>
