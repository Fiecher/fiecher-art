<script lang='ts'>
  interface Props { onDone: () => void }
  const { onDone }: Props = $props()

  import { withBase, WORKS } from '$lib/config'
  import { onMount, tick } from 'svelte'

  const IMAGE_URLS = [
    withBase('/textures/paper.jpg'),
    ...WORKS
      .map(w => w.main.poster ?? w.main.src)
      .filter((src, i, arr) => arr.indexOf(src) === i)
      .map(withBase),
  ]
  const CELL_SIZE = 220

  const REEL_URL = withBase('/reel/reel.mp4')

  let progress = $state(0)
  let _progressRafId = 0

  function setProgress(target: number) {
    target = Math.max(progress, Math.min(target, 1))
    cancelAnimationFrame(_progressRafId)
    const step = () => {
      progress += (target - progress) * 0.25
      if (Math.abs(target - progress) > 0.002) {
        _progressRafId = requestAnimationFrame(step)
      } else {
        progress = target
      }
    }
    _progressRafId = requestAnimationFrame(step)
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
    let worksOk = false
    let finished = false

    async function finish() {
      if (finished)
        return
      finished = true
      setProgress(1)
      await tick()
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          setTimeout(() => onDone(), 100),
        ),
      )
    }

    function check() {
      if (fontsOk && assetsOk && videoOk && paintOk && pageOk && worksOk)
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
      const preRender = document.createElement('div')
      preRender.setAttribute('aria-hidden', 'true')
      preRender.style.cssText = [
        'position:fixed',
        `width:${CELL_SIZE}px`,
        `height:${CELL_SIZE}px`,
        'opacity:0.001',
        'pointer-events:none',
        'overflow:hidden',
        'left:-9999px',
        'top:-9999px',
        'contain:strict',
      ].join(';')
      document.body.appendChild(preRender)

      Promise.all(
        IMAGE_URLS.map((src) =>
          new Promise<void>(resolve => {
            const img = new Image()
            img.width = CELL_SIZE
            img.height = CELL_SIZE
            img.style.cssText = `width:${CELL_SIZE}px;height:${CELL_SIZE}px;object-fit:cover;display:block`
            const timer = window.setTimeout(resolve, 10_000)
            img.onload = () => {
              img.decode?.().catch(() => {}).finally(() => {
                clearTimeout(timer)
                preRender.appendChild(img)
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
    vid.muted = true
    vid.preload = 'auto'

    function destroyVid() {
      vid.pause()
      vid.removeAttribute('src')
      vid.load()
    }

    const videoTimer = window.setTimeout(() => {
      destroyVid()
      videoOk = true
      check()
    }, 8_000)

    vid.addEventListener('canplaythrough', () => {
      clearTimeout(videoTimer)
      destroyVid()
      videoOk = true
      setProgress(0.85)
      check()
    }, { once: true })

    vid.addEventListener('error', () => {
      clearTimeout(videoTimer)
      destroyVid()
      videoOk = true
      check()
    }, { once: true })

    vid.src = REEL_URL
    vid.load()

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        paintOk = true
        check()
      }),
    )

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

    window.addEventListener('works:ready', () => {
      worksOk = true
      setProgress(0.95)
      check()
    }, { once: true })

    setTimeout(() => {
      if (!worksOk) {
        worksOk = true
        check()
      }
    }, 3_000)

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
    <div class='bar-fill' style={`transform: scaleX(${progress})`}></div>
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
  width: 100%;
  background: linear-gradient(
    90deg,
    rgba(223,225,215,0.25),
    var(--color-secondary),
    rgba(223,225,215,0.25)
  );
  transform: scaleX(0);
  transform-origin: left center;
  will-change: transform;
  box-shadow: 0 0 8px rgba(223,225,215,0.25);
}
</style>
