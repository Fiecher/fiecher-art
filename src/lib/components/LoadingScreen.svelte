<script lang='ts'>
  interface Props { onDone: () => void }
  const { onDone }: Props = $props()

  import { base } from '$app/paths'
  import { WORKS } from '$lib/config'
  import { onMount, tick } from 'svelte'

  const IMAGE_URLS = [
    `${base}/textures/paper.jpg`,
    ...WORKS
      .map(w => w.main.poster ?? w.main.src)
      .filter((src, i, arr) => arr.indexOf(src) === i),
  ]

  const REEL_URL = `${base}/reel/reel.mp4`

  let progress = $state(0)

  function setProgress(target: number) {
    target = Math.max(progress, Math.min(target, 1))
    const step = () => {
      progress += (target - progress) * 0.25
      if (Math.abs(target - progress) > 0.002) {
        requestAnimationFrame(step)
      } else {
        progress = target
      }
    }
    step()
  }

  onMount(() => {
    if (navigator.webdriver || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDone()
      return
    }

    setProgress(0.03)

    let fontsOk = false
    let assetsOk = false
    let videoOk = false
    let paintOk = false
    let pageOk = false
    let finished = false

    async function finish() {
      if (finished)
        return
      finished = true
      setProgress(1)
      await tick()
      setTimeout(() => onDone(), 250)
    }

    function check() {
      if (fontsOk && assetsOk && videoOk && paintOk && pageOk)
        finish()
    }

    Promise.all([
      document.fonts.load('400 16px "Bebas Neue"'),
      document.fonts.load('400 16px "Trade Gothic LT Std"'),
      document.fonts.ready,
    ]).then(() => {
      fontsOk = true
      setProgress(0.08)
      check()
    }).catch(() => {
      fontsOk = true
      check()
    })

    let loaded = 0
    const total = IMAGE_URLS.length
    if (total === 0) {
      assetsOk = true
    } else {
      Promise.all(
        IMAGE_URLS.map((src, i) =>
          new Promise<void>(resolve => {
            const img = new Image()
            const timer = window.setTimeout(resolve, 10_000)
            img.onload = () => {
              img.decode?.().catch(() => {}).finally(() => {
                clearTimeout(timer)
                loaded++
                setProgress(0.1 + (loaded / total) * 0.3)
                resolve()
              })
            }
            img.onerror = () => {
              clearTimeout(timer)
              loaded++
              resolve()
            }
            img.src = src
          }),
        ),
      ).then(() => {
        assetsOk = true
        check()
      })
    }

    const vid = document.createElement('video')
    vid.src = REEL_URL
    vid.muted = true
    vid.preload = 'auto'
    const videoTimer = window.setTimeout(() => {
      videoOk = true
      check()
    }, 8_000)

    vid.addEventListener('canplaythrough', () => {
      clearTimeout(videoTimer)
      videoOk = true
      setProgress(0.85)
      check()
    }, { once: true })

    vid.addEventListener('error', () => {
      clearTimeout(videoTimer)
      videoOk = true
      check()
    }, { once: true })

    vid.load()

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        paintOk = true
        check()
      }),
    )

    // 5. Full page load
    function onPageReady() {
      pageOk = true
      setProgress(0.9)
      check()
    }
    if (document.readyState === 'complete') {
      onPageReady()
    } else {
      window.addEventListener('load', onPageReady, { once: true })
    }

    setTimeout(() => finish(), 15_000)
  })
</script>

<div class='loader' aria-label='Loading' aria-live='polite'>
  <svg
    class='reel'
    viewBox='0 0 200 200'
    width='180'
    height='180'
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
  <div class='bar'>
    <div class='bar-fill' style={`width:${progress * 100}%`}></div>
  </div>
</div>

<style>
.loader {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: var(--color-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 48px;
  isolation: isolate;
}
.reel { animation: spin 3.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.reel-body {
  fill: var(--color-secondary);
  filter:
    drop-shadow(0 0 6px rgba(223,225,215,0.08))
    drop-shadow(0 0 2px rgba(0,0,0,0.4));
}
.reel-hole   { fill: var(--color-primary); }
.reel-core   { fill: var(--color-secondary); }
.reel-bolt   { fill: var(--color-primary); }
.reel-center { fill: var(--color-primary); }
.bar {
  width: 220px;
  height: 4px;
  background: rgba(223,225,215,0.08);
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.6);
}
.bar-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(223,225,215,0.25),
    var(--color-secondary),
    rgba(223,225,215,0.25)
  );
  transition: width 0.25s ease;
  box-shadow: 0 0 8px rgba(223,225,215,0.25);
}
</style>
