<script lang='ts'>
  import { base } from '$app/paths'
  import { isVideoFullscreen } from '$lib/viewer'
  import { onMount } from 'svelte'

  interface Props {
    ready?: boolean
    playing?: boolean
    dimmed?: boolean
  }
  const { ready = false, playing = false, dimmed = false }: Props = $props()

  let videoEl = $state<HTMLVideoElement | null>(null)
  let muted = $state(true)
  let volume = $state(1)
  let isFullscreen = $state(false)
  let controlsVisible = $state(true)
  let hideTimer = 0

  $effect(() => {
    if (ready && videoEl) {
      if (playing)
        videoEl.play().catch(() => {})
      else videoEl.pause()
    }
  })
  let lastVolume = 1

  function toggleMute() {
    if (!videoEl)
      return
    if (!muted) {
      muted = true
      videoEl.muted = true
    } else {
      if (volume === 0) {
        volume = lastVolume
        videoEl.volume = lastVolume
      }
      muted = false
      videoEl.muted = false
    }
  }

  function onVolumeInput(e: Event) {
    const val = Number.parseFloat((e.target as HTMLInputElement).value)
    volume = val
    if (val > 0)
      lastVolume = val
    if (!videoEl)
      return
    videoEl.volume = val
    if (val === 0) {
      videoEl.muted = true
      muted = true
    } else if (muted) {
      videoEl.muted = false
      muted = false
    }
  }

  async function openFullscreen() {
    if (!videoEl)
      return
    try {
      isFullscreen = true
      if (videoEl.requestFullscreen)
        await videoEl.requestFullscreen()
      else if ((videoEl as any).webkitRequestFullscreen)
        await (videoEl as any).webkitRequestFullscreen()
      else if ((videoEl as any).webkitEnterFullscreen)
        (videoEl as any).webkitEnterFullscreen()
    } catch {
      isFullscreen = false
    }
  }

  function showControls(e?: Event) {
    if (e?.type === 'touchstart')
      isTouch = true
    clearTimeout(hideTimer)
    if (!controlsVisible)
      controlsVisible = true
    hideTimer = window.setTimeout(() => {
      controlsVisible = false
    }, 2500)
  }

  onMount(() => {
    hideTimer = window.setTimeout(() => {
      controlsVisible = false
    }, 2500)

    const onFsChange = () => {
      const fsEl = document.fullscreenElement ?? (document as any).webkitFullscreenElement
      isFullscreen = fsEl === videoEl
      isVideoFullscreen.set(isFullscreen)
      if (videoEl)
        videoEl.style.objectFit = isFullscreen ? 'contain' : 'cover'
    }
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('webkitfullscreenchange', onFsChange)

    return () => {
      clearTimeout(hideTimer)
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('webkitfullscreenchange', onFsChange)
      isVideoFullscreen.set(false)
    }
  })

  $effect(() => {
    const el = videoEl
    if (!el)
      return
    const onVolumeChange = () => {
      muted = el.muted
      if (el.volume !== volume)
        volume = el.volume
    }
    el.addEventListener('volumechange', onVolumeChange)
    return () => el.removeEventListener('volumechange', onVolumeChange)
  })

  let isTouch = $state(false)
  let volHovered = $state(false)
  const showSlider = $derived(isTouch ? true : volHovered)

  function onVolPointerEnter() {
    if (!isTouch)
      volHovered = true
  }
  function onVolPointerLeave() {
    volHovered = false
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class='reel-container'
  class:reel-container--dimmed={dimmed}
  onmousemove={showControls}
  onmouseenter={showControls}
  ontouchstart={showControls}
>
  <video
    bind:this={videoEl}
    class='reel-video'
    src='{base}/reel/reel.mp4'
    {muted}
    loop
    playsinline
    preload='auto'
    controls={isFullscreen}
    aria-label='Reel showreel video'
  ></video>

  <div class='reel-controls' class:reel-controls--visible={controlsVisible && !dimmed}>
    <div
      class='vol-btn'
      class:vol-btn--open={showSlider}
      role='group'
      aria-label='Volume control'
      onpointerenter={onVolPointerEnter}
      onpointerleave={onVolPointerLeave}
    >
      <button
        class='vol-icon-btn'
        onclick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        type='button'
        tabindex={controlsVisible && !dimmed ? 0 : -1}
      >
        <svg class='ctrl-btn__icon' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
          {#if muted || volume === 0}
            <path d='M11 5L6 9H2v6h4l5 4V5z' stroke='currentColor' stroke-width='1.5' stroke-linejoin='round' />
            <line x1='23' y1='9' x2='17' y2='15' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' />
            <line x1='17' y1='9' x2='23' y2='15' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' />
          {:else if volume < 0.5}
            <path d='M11 5L6 9H2v6h4l5 4V5z' stroke='currentColor' stroke-width='1.5' stroke-linejoin='round' />
            <path d='M15.54 8.46a5 5 0 0 1 0 7.07' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' />
          {:else}
            <path d='M11 5L6 9H2v6h4l5 4V5z' stroke='currentColor' stroke-width='1.5' stroke-linejoin='round' />
            <path d='M15.54 8.46a5 5 0 0 1 0 7.07' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' />
            <path d='M19.07 4.93a10 10 0 0 1 0 14.14' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' />
          {/if}
        </svg>
      </button>

      <div class='vol-panel' class:vol-panel--muted={muted} aria-hidden={!showSlider}>
        <div class='vol-slider-wrap'>
          <div class='vol-track'>
            <div class='vol-fill' style={`width:${muted ? 0 : volume * 100}%`}></div>
          </div>
          <input
            class='vol-slider'
            type='range'
            min='0'
            max='1'
            step='0.02'
            value={volume}
            oninput={onVolumeInput}
            aria-label='Volume'
            tabindex={showSlider && controlsVisible && !dimmed ? 0 : -1}
          />
        </div>
      </div>
    </div>

    <button
      class='ctrl-btn'
      onclick={openFullscreen}
      aria-label='Open fullscreen'
      type='button'
      tabindex={controlsVisible && !dimmed ? 0 : -1}
    >
      <span class='ctrl-btn__frame'>
        <svg class='ctrl-btn__icon' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
          <path d='M4 9V5h4' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' />
          <path d='M20 9V5h-4' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' />
          <path d='M4 15v4h4' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' />
          <path d='M20 15v4h-4' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' />
        </svg>
      </span>
    </button>

  </div>
</div>

<style>
  .reel-container {
    position: relative;
    width: 100%;
    height: 100%;
    max-height: 100%;
    background: var(--color-primary);
    overflow: hidden;
    display: flex;
    align-items: center;
  }

  .reel-container::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    background: var(--color-primary);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: opacity;
  }

  .reel-container--dimmed::after { opacity: 0.7; }

  .reel-video {
    width: 100%;
    height: 100%;
    max-height: 100%;
    object-fit: cover;
    display: block;
    position: relative;
    z-index: 1;
  }

  .reel-controls {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    z-index: 10;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    will-change: opacity;
  }
  .reel-controls--visible {
    opacity: 1;
    pointer-events: all;
  }

  .vol-btn {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    height: 45px;
    border: 1px solid var(--color-secondary);
    opacity: 0.45;
    transition:
      opacity 0.2s ease,
      background 0.2s ease,
      width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    width: 45px;
    box-sizing: border-box;
  }

  .vol-btn:hover,
  .vol-btn:focus-within {
    opacity: 1;
  }

  .vol-btn--open {
    width: calc(45px + 96px);
    opacity: 1;
  }

  .vol-icon-btn {
    width: 43px;
    height: 43px;
    flex-shrink: 0;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-tap-highlight-color: transparent;
    color: var(--color-secondary);
  }

  .vol-btn:hover .vol-icon-btn {
    background: var(--color-secondary);
  }

  .vol-btn:hover .vol-icon-btn .ctrl-btn__icon {
    color: var(--color-primary);
  }

  .vol-panel {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 96px;
    height: 100%;
    flex-shrink: 0;
    border-right: 1px solid rgba(223,225,215,0.15);
    overflow: hidden;
  }

  .vol-slider-wrap {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
    height: 100%;
    padding: 0 10px;
    box-sizing: border-box;
  }

  .vol-track {
    position: absolute;
    left: 10px;
    right: 10px;
    height: 2px;
    background: rgba(223, 225, 215, 0.2);
    pointer-events: none;
    border-radius: 1px;
  }
  .vol-fill {
    height: 100%;
    background: var(--color-secondary);
    border-radius: 1px;
    transition: width 0.04s linear;
  }

  .vol-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 100%;
    background: transparent;
    cursor: pointer;
    position: relative;
    z-index: 1;
    outline: none;
    margin: 0;
    padding: 0;
  }

  .vol-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--color-secondary);
    border: none;
    cursor: pointer;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }
  .vol-slider:hover::-webkit-slider-thumb,
  .vol-slider:focus::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px rgba(223,225,215,0.2);
    transform: scale(1.2);
  }
  .vol-slider::-webkit-slider-runnable-track { background: transparent; }

  .vol-slider::-moz-range-thumb {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--color-secondary);
    border: none;
    cursor: pointer;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }
  .vol-slider:hover::-moz-range-thumb,
  .vol-slider:focus::-moz-range-thumb {
    box-shadow: 0 0 0 3px rgba(223,225,215,0.2);
    transform: scale(1.2);
  }
  .vol-slider::-moz-range-track { background: transparent; }

  .vol-panel--muted {
    opacity: 0.3;
    transition: opacity 0.15s ease;
  }
  .vol-panel {
    transition: opacity 0.15s ease;
  }

  @media (hover: none) {
    .vol-btn {
      width: calc(45px + 96px);
      transition: opacity 0.2s ease;
    }
    .vol-panel {
      opacity: 1;
    }
  }

  .ctrl-btn {
    width: 48px;
    height: 48px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-tap-highlight-color: transparent;
    flex-shrink: 0;
  }

  .ctrl-btn__frame {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 45px;
    height: 45px;
    border: 1px solid var(--color-secondary);
    opacity: 0.45;
    transition: opacity 0.2s ease, background 0.2s ease;
  }

  .ctrl-btn:hover .ctrl-btn__frame {
    opacity: 1;
    background: var(--color-secondary);
  }

  .ctrl-btn__icon {
    width: 18px;
    height: 18px;
    color: var(--color-secondary);
    transition: color 0.2s ease;
    flex-shrink: 0;
  }

  .ctrl-btn:hover .ctrl-btn__icon {
    color: var(--color-primary);
  }
</style>
