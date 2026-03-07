<script lang='ts'>
  interface Props { onDone: () => void }
  const { onDone }: Props = $props()

  import { WORK_SETS } from '$lib/works'
  import { onMount, tick } from 'svelte'

  const POSTER_URLS = WORK_SETS
    .flatMap(s => s.works)
    .map(w => w.main.poster ?? w.main.src)
    .filter((src, i, arr) => arr.indexOf(src) === i)

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
    setProgress(0.03)

    let fontsOk = false
    let postersOk = false
    let paintOk = false
    let finished = false

    async function finish() {
      if (finished)
        return
      finished = true

      setProgress(1)

      await tick()

      setTimeout(() => {
        onDone()
      }, 250)
    }

    function check() {
      if (fontsOk && postersOk && paintOk) {
        finish()
      }
    }

    const CRITICAL_FONTS = [
      { family: 'Bebas Neue', weight: '400' },
      { family: 'Trade Gothic LT Std', weight: '400' },
    ]

    Promise.all([
      ...CRITICAL_FONTS.map(({ family, weight }) =>
        document.fonts.load(`${weight} 16px "${family}"`).catch(() => {
          console.warn(`[loader] font failed: ${family}`)
        }),
      ),
      document.fonts.ready,
    ]).then(() => {
      fontsOk = true
      setProgress(0.15)
      check()
    })

    let loaded = 0
    const total = POSTER_URLS.length || 1

    Promise.all(
      POSTER_URLS.map(src =>
        new Promise<void>(resolve => {
          const img = new Image()
          img.onload = img.onerror = () => {
            setProgress(0.15 + (++loaded / total) * 0.75)
            resolve()
          }
          img.src = src
        }),
      ),
    ).then(() => {
      postersOk = true
      check()
    })

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        paintOk = true
        check()
      }),
    )

    setTimeout(() => {
      console.warn('[loader] forced finish')
      finish()
    }, 6000)
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
      <circle
        cx='100'
        cy='40'
        r='26'
        class='reel-hole'
        transform={`rotate(${i * 60} 100 100)`}
      />
    {/each}

    <circle cx='100' cy='100' r='24' class='reel-core' />

    {#each { length: 6 } as _, i}
      <circle
        cx='100'
        cy='78'
        r='5'
        class='reel-bolt'
        transform={`rotate(${i * 60} 100 100)`}
      />
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
}

.reel {
  animation: spin 3.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.reel-body {
  fill: var(--color-secondary);

  filter:
    drop-shadow(0 0 6px rgba(223,225,215,0.08))
    drop-shadow(0 0 2px rgba(0,0,0,0.4));
}

.reel-hole  { fill: var(--color-primary); }
.reel-core  { fill: var(--color-secondary); }
.reel-bolt  { fill: var(--color-primary); }
.reel-center { fill: var(--color-primary); }

.bar {
  width: 220px;
  height: 4px;

  background: rgba(223,225,215,0.08);

  overflow: hidden;
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
