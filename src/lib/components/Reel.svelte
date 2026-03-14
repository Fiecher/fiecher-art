<script lang='ts'>
  import { base } from '$app/paths'
  import { isVideoFullscreen } from '$lib/viewer'
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'

  interface Props {
    ready?: boolean
    dimmed?: boolean
  }
  const { ready = false, dimmed = false }: Props = $props()

  let videoEl = $state<HTMLVideoElement | null>(null)
  let muted = $state(true)
  let isFullscreen = $state(false)
  let controlsVisible = $state(true)
  let hideTimer = 0

  $effect(() => {
    if (ready && videoEl) {
      videoEl.play().catch(() => {})
    }
  })

  export function pause() {
    videoEl?.pause()
  }

  export function play() {
    videoEl?.play().catch(() => {})
  }

  function toggleMute() {
    if (!videoEl)
      return
    muted = !muted
    videoEl.muted = muted
  }

  async function openFullscreen() {
    if (!videoEl)
      return
    try {
      isFullscreen = true
      if (videoEl.requestFullscreen) {
        await videoEl.requestFullscreen()
      } else if ((videoEl as any).webkitRequestFullscreen) {
        await (videoEl as any).webkitRequestFullscreen()
      } else if ((videoEl as any).webkitEnterFullscreen) {
        ;(videoEl as any).webkitEnterFullscreen()
      }
    } catch {
      isFullscreen = false
    }
  }

  function showControls() {
    controlsVisible = true
    clearTimeout(hideTimer)
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
      if (videoEl) {
        videoEl.style.objectFit = isFullscreen ? 'contain' : 'cover'
      }
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
    }
    el.addEventListener('volumechange', onVolumeChange)
    return () => el.removeEventListener('volumechange', onVolumeChange)
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class='reel-container'
  onmousemove={showControls}
  onmouseenter={showControls}
  ontouchstart={showControls}
>
  <video
    bind:this={videoEl}
    class='reel-video'
    class:reel-video--dimmed={dimmed}
    src='{base}/reel/reel.mp4'
    {muted}
    loop
    playsinline
    preload='auto'
    controls={isFullscreen}
    aria-label='Reel showreel video'
  ></video>

  {#if controlsVisible && !dimmed}
    <div class='reel-controls' transition:fade={{ duration: 200 }}>

      <button
        class='ctrl-btn'
        onclick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        type='button'
      >
        <span class='ctrl-btn__frame'>
          <svg class='ctrl-btn__icon' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
            {#if muted}
              <path d='M11 5L6 9H2v6h4l5 4V5z' stroke='currentColor' stroke-width='1.5' stroke-linejoin='round' />
              <line x1='23' y1='9' x2='17' y2='15' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' />
              <line x1='17' y1='9' x2='23' y2='15' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' />
            {:else}
              <path d='M11 5L6 9H2v6h4l5 4V5z' stroke='currentColor' stroke-width='1.5' stroke-linejoin='round' />
              <path d='M15.54 8.46a5 5 0 0 1 0 7.07' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' />
              <path d='M19.07 4.93a10 10 0 0 1 0 14.14' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' />
            {/if}
          </svg>
        </span>
      </button>

      <button
        class='ctrl-btn'
        onclick={openFullscreen}
        aria-label='Open fullscreen'
        type='button'
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
  {/if}
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

  .reel-video {
    width: 100%;
    height: 100%;
    max-height: 100%;
    object-fit: cover;
    display: block;
    position: relative;
    z-index: 1;
    transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .reel-video--dimmed {
    opacity: 0.3;
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
    pointer-events: all;
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
