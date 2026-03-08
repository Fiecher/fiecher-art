<script lang='ts'>
  import { closeModal, modalCell } from '$lib/modal'
  import { fade } from 'svelte/transition'
  import type { WorkMedia } from '$lib/types'

  const work = $derived($modalCell)
  const isOpen = $derived(work !== null)

  let mediaIndex = $state(-1) // -1 = main, 0+ = wip
  const media = $derived<WorkMedia | undefined>(
    mediaIndex === -1 ? work?.main : work?.wip?.[mediaIndex],
  )
  const isVideo = $derived(media?.type === 'video')

  $effect(() => {
    if (work)
      mediaIndex = -1
  })

  let posterAspect = $state<number | null>(null)

  $effect(() => {
    const src = media?.type === 'video' ? media.poster : null
    posterAspect = null
    if (!src)
      return
    const img = new Image()
    img.onload = () => {
      posterAspect = img.naturalWidth / img.naturalHeight
    }
    img.src = src
  })

  const canvasAspect = $derived(
    posterAspect ?
      String(posterAspect) :
        media?.type === 'image' ? 'auto' : '16/9',
  )

  let videoEl = $state<HTMLVideoElement | null>(null)

  function onVideoMeta() {
    if (projState === 'projecting')
      videoEl?.play().catch(() => {})
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape')
      closeModal()
  }

  const SIM_W = 640
  const ANCHOR_L = SIM_W * 0.22, ANCHOR_R = SIM_W * 0.78
  const ANCHOR_Y = 0
  const BAR_HALF = (ANCHOR_R - ANCHOR_L) * 0.95 / 2
  const N = 10, SEG_LEN = 26, GRAVITY = 3200, DAMPING = 0.978, SUBSTEPS = 8

  type Node = { cx: number, cy: number, ox: number, oy: number, pinned: boolean }
  type Point = { x: number, y: number }

  let ropeL: Node[] = [], ropeR: Node[] = []
  let renderL = $state<Point[]>([]), renderR = $state<Point[]>([])
  let barMX = $state(SIM_W / 2), barMY = $state(-200), barAngle = $state(0)

  function makeRope(ax: number): Node[] {
    return Array.from({ length: N }, (_, i) => {
      const x = ax + (Math.random() - 0.5) * 6
      const y = ANCHOR_Y - (N - i) * 4
      return { cx: x, cy: y, ox: x, oy: y, pinned: i === 0 }
    })
  }

  function launch() {
    ropeL = makeRope(ANCHOR_L); ropeR = makeRope(ANCHOR_R)
    const kx = (Math.random() - 0.5) * 60
    for (let i = 1; i < N; i++) {
      const t = i / (N - 1)
      ropeL[i].oy -= t * 55; ropeR[i].oy -= t * 55
      ropeL[i].ox -= kx * t * 0.4; ropeR[i].ox += kx * t * 0.2
    }
  }

  let physRaf = 0, simRunning = false, prevT = 0

  function physicsStep(now: number) {
    if (!simRunning)
      return
    const dt = Math.min((now - prevT) / 1000, 0.032); prevT = now
    const dtSq = dt * dt

    for (const rope of [ropeL, ropeR]) {
      for (const n of rope) {
        if (n.pinned)
          continue
        const vx = (n.cx - n.ox) * DAMPING; const vy = (n.cy - n.oy) * DAMPING
        n.ox = n.cx; n.oy = n.cy
        n.cx += vx; n.cy += vy + GRAVITY * dtSq
      }
    }

    for (let s = 0; s < SUBSTEPS; s++) {
      for (const rope of [ropeL, ropeR]) {
        for (let i = 0; i < rope.length - 1; i++) {
          const a = rope[i]; const b = rope[i + 1]
          const dx = b.cx - a.cx; const dy = b.cy - a.cy
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.001
          const corr = (dist - SEG_LEN) / dist * 0.5
          if (!a.pinned) {
            a.cx += dx * corr; a.cy += dy * corr
          }
          if (!b.pinned) {
            b.cx -= dx * corr; b.cy -= dy * corr
          }
        }
      }
      const lE = ropeL[N - 1]; const rE = ropeR[N - 1]
      const mx = (lE.cx + rE.cx) / 2; const my = (lE.cy + rE.cy) / 2
      const dx = rE.cx - lE.cx; const dy = rE.cy - lE.cy
      const d = Math.sqrt(dx * dx + dy * dy) || 0.001
      lE.cx = mx - (dx / d) * BAR_HALF; lE.cy = my - (dy / d) * BAR_HALF
      rE.cx = mx + (dx / d) * BAR_HALF; rE.cy = my + (dy / d) * BAR_HALF
    }

    renderL = ropeL.map(n => ({ x: n.cx, y: n.cy }))
    renderR = ropeR.map(n => ({ x: n.cx, y: n.cy }))
    const l = ropeL[N - 1]; const r = ropeR[N - 1]
    barMX = (l.cx + r.cx) / 2
    barMY = (l.cy + r.cy) / 2
    barAngle = Math.atan2(r.cy - l.cy, r.cx - l.cx) * 180 / Math.PI
    physRaf = requestAnimationFrame(physicsStep)
  }

  function startSim() {
    cancelAnimationFrame(physRaf); launch(); simRunning = true
    prevT = performance.now(); physRaf = requestAnimationFrame(physicsStep)
  }
  function stopSim() {
    simRunning = false; cancelAnimationFrame(physRaf); barMY = -200
  }

  $effect(() => {
    if (isOpen)
      setTimeout(startSim, 16)
    else stopSim()
    return () => {
      simRunning = false; cancelAnimationFrame(physRaf)
    }
  })

  function pathStr(pts: Point[]) {
    return pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  }

  let svgEl: SVGSVGElement | null = $state(null)
  let pmx = 0, pmy = 0, pmt = 0
  const MFORCE = 0.13, MRAD = 180, CFORCE = 320, CRAD = 260

  function applyImpulse(sx: number, sy: number, ix: number, iy: number, r: number, f: number, radial = false) {
    for (const rope of [ropeL, ropeR]) {
      for (const n of rope) {
        if (n.pinned)
          continue
        const dx = n.cx - sx; const dy = n.cy - sy
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001
        if (dist > r)
          continue
        const w = (1 - dist / r) ** 1.1
        if (radial) {
          n.ox -= (dx / dist) * f * w; n.oy -= (dy / dist) * f * w
        } else {
          n.ox -= ix * w; n.oy -= iy * w
        }
      }
    }
  }

  function toSim(cx: number, cy: number) {
    if (!svgEl)
      return null
    const rect = svgEl.getBoundingClientRect()
    return { x: (cx - rect.left) * (SIM_W / rect.width), y: (cy - rect.top) * (SIM_W / rect.width) }
  }

  function onMouseMove(e: MouseEvent) {
    if (!simRunning)
      return
    const now = performance.now(); const dt = now - pmt
    if (dt < 4)
      return; pmt = now
    const vx = (e.clientX - pmx) / dt; const vy = (e.clientY - pmy) / dt
    pmx = e.clientX; pmy = e.clientY
    if (Math.sqrt(vx * vx + vy * vy) < 0.08)
      return
    const s = toSim(e.clientX, e.clientY); if (!s)
      return
    const sx = SIM_W / svgEl!.getBoundingClientRect().width
    applyImpulse(s.x, s.y, vx * MFORCE * sx, vy * MFORCE * sx, MRAD, MFORCE)
  }

  function onBgClick(e: MouseEvent) {
    const s = toSim(e.clientX, e.clientY)
    if (s)
      applyImpulse(s.x, s.y, 0, 0, CRAD, CFORCE, true)
    closeModal()
  }

  type ProjState = 'idle' | 'warming' | 'aligning' | 'flickering' | 'projecting'

  let projState = $state<ProjState>('idle')
  let videoSrc = $state<string | null>(null)
  let alignX = $state(0), alignY = $state(0)
  let flickerOn = $state(true)

  $effect(() => {
    media; videoSrc = null
  })

  $effect(() => {
    if (!isOpen) {
      setTimeout(() => {
        projState = 'idle'; alignX = 0; alignY = 0; flickerOn = true
      }, 250)
    }
  })

  function startProjector() {
    if (projState !== 'idle')
      return
    if (media?.type === 'video')
      videoSrc = media.src
    projState = 'warming'

    setTimeout(() => {
      projState = 'aligning'
      ;[
        { x: 5, y: -3, t: 0 },
        { x: -7, y: 4, t: 150 },
        { x: 3, y: 7, t: 290 },
        { x: -2, y: -4, t: 430 },
        { x: 0, y: 0, t: 580 },
      ].forEach(({ x, y, t }) => setTimeout(() => {
        alignX = x; alignY = y
      }, t))

      setTimeout(() => {
        projState = 'flickering'
        let acc = 0
        ;[70, 45, 110, 35, 90, 50, 130, 60, 80, 200, 180, 350]
          .forEach(d => {
            acc += d; setTimeout(() => {
              flickerOn = !flickerOn
            }, acc)
          })
        setTimeout(() => {
          flickerOn = true; projState = 'projecting'
          videoEl?.play().catch(() => {})
        }, acc + 80)
      }, 720)
    }, 360)
  }

  const showBeam = $derived(projState !== 'idle')
  const showContent = $derived(projState === 'aligning' || projState === 'flickering' || projState === 'projecting')
  const contentAlpha = $derived(
    projState === 'aligning' ?
      0.5 :
        projState === 'flickering' ?
        (flickerOn ? 0.72 : 0.1) :
        projState === 'projecting' ? 1 : 0,
  )
  const beamAlpha = $derived(
    projState === 'warming' ?
      0.14 :
        projState === 'aligning' ?
        0.30 :
        projState === 'flickering' ?
        (flickerOn ? 0.46 : 0.07) :
        projState === 'projecting' ? 0.24 : 0,
  )

  const SCREEN_W = 'min(640px, 88vw)'
</script>

<svelte:window onkeydown={onKeydown} />

{#if isOpen && work}
  <div
    class='bd'
    onmousemove={onMouseMove}
    onclick={onBgClick}
    role='button' tabindex='-1' aria-label='Close'
    in:fade={{ duration: 180 }}
    out:fade={{ duration: 160 }}
  >
    <button
      class='close-btn'
      onclick={e => {
        e.stopPropagation(); closeModal()
      }}
      aria-label='Close'
      type='button'
    >
      <svg viewBox='0 0 16 16' fill='none'>
        <line x1='2' y1='2' x2='14' y2='14' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' />
        <line x1='14' y1='2' x2='2' y2='14' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' />
      </svg>
    </button>

    <svg
      class='ropes'
      bind:this={svgEl}
      viewBox={`0 0 ${SIM_W} 700`}
      preserveAspectRatio='xMidYMin meet'
      aria-hidden='true'
    >
      <path d={pathStr(renderL)} stroke='rgba(195,188,170,0.6)' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round' />
      <path d={pathStr(renderR)} stroke='rgba(195,188,170,0.6)' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round' />
      <rect x={ANCHOR_L - 4} y={ANCHOR_Y - 3} width='8' height='6' rx='1' fill='rgba(160,155,140,0.5)' />
      <rect x={ANCHOR_R - 4} y={ANCHOR_Y - 3} width='8' height='6' rx='1' fill='rgba(160,155,140,0.5)' />
    </svg>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class='screen-wrap'
      style={`left:${(barMX / SIM_W) * 100}%;top:${barMY}px;rotate:${barAngle}deg;width:${SCREEN_W}`}
      onclick={e => {
        e.stopPropagation(); const s = toSim(e.clientX, e.clientY); if (s)
          applyImpulse(s.x, s.y, 0, 0, CRAD, CFORCE, true)
      }}
    >
      <div class='hanger'></div>

      <div class='canvas' class:lit={projState === 'projecting'} style={`aspect-ratio:${canvasAspect}`}>
        <div class='fabric' aria-hidden='true'></div>
        {#if showBeam}
          <div class='beam' style={`opacity:${beamAlpha}`} aria-hidden='true'></div>
        {/if}

        {#if !showContent}<div class='dark'></div>{/if}

        {#if media?.type !== 'video'}
          <div
            class='img-wrap'
            style={`opacity:${showContent ? contentAlpha : 0};transform:translate(${alignX}px,${alignY}px);transition:transform ${projState === 'projecting' ? '0.26s' : '0.1s'} ease,opacity 0.05s`}
            aria-hidden='true'
          >
            {#if media?.type === 'image'}
              <img src={media.src} alt={work.title} class='media-img' draggable='false' />
            {:else}
              <div class='blank'></div>
            {/if}
            <div class='scanlines'></div>
            <div class='vignette'></div>
          </div>
        {/if}

        {#if media?.type === 'video'}
          <div
            class='video-wrap'
            style={`opacity:${showContent ? contentAlpha : 0};transform:translate(${alignX}px,${alignY}px);transition:transform ${projState === 'projecting' ? '0.26s' : '0.1s'} ease,opacity 0.05s`}
          >
            <video
              bind:this={videoEl}
              src={videoSrc ?? undefined}
              poster={media.poster}
              onloadedmetadata={onVideoMeta}
              controls
              loop
              playsinline
              class='media-video'
              onclick={e => e.stopPropagation()}
            ></video>
            <div class='scanlines' aria-hidden='true'></div>
            <div class='vignette' aria-hidden='true'></div>
            {#if projState === 'projecting'}<div class='grain' aria-hidden='true'></div>{/if}
          </div>
        {/if}

        <div class='sheen' aria-hidden='true'></div>

        {#if projState === 'warming'}
          <p class='proj-status'>LAMP WARMING</p>
        {:else if projState === 'aligning'}
          <p class='proj-status'>ADJUSTING POSITION</p>
        {/if}

        {#if projState === 'idle'}
          {#if media?.type === 'video' && media.poster}
            <img src={media.poster} alt='' class='idle-poster' aria-hidden='true' />
          {/if}
          <button
            class='play-gate'
            onclick={e => {
              e.stopPropagation()
              startProjector()
            }}
            aria-label='Play'
            type='button'
          >
            <div class='play-ring'>
              <svg viewBox='0 0 40 40' fill='none' aria-hidden='true'>
                <polygon points='13,8 34,20 13,32' fill='currentColor' />
              </svg>
            </div>
          </button>
        {/if}
      </div>

      <div class='caption'>
        <span class='cap-title'>{work.title}</span>
        {#if work.wip?.length}
          <div class='wip-tabs'>
            <button
              class='wip-tab'
              class:wip-tab--active={mediaIndex === -1}
              onclick={e => {
                e.stopPropagation()
                mediaIndex = -1
              }}
              type='button'
            >MAIN</button>
            {#each work.wip as _, i}
              <button
                class='wip-tab'
                class:wip-tab--active={mediaIndex === i}
                onclick={e => {
                  e.stopPropagation()
                  mediaIndex = i
                }}
                type='button'
              >WIP {i + 1}</button>
            {/each}
          </div>
        {/if}
      </div>

    </div>
  </div>
{/if}

<style>
  .bd {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(4,3,2,0.93);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    overflow: hidden; cursor: pointer;
  }

  .close-btn {
    position: fixed; top: 20px; right: 24px; z-index: 10000;
    width: 44px; height: 44px; border-radius: 50%;
    border: 1px solid rgba(223,225,215,.18); background: rgba(11,10,9,.7);
    color: rgba(223,225,215,.55); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(8px);
    transition: color .15s, background .15s, border-color .15s, transform .15s;
  }
  .close-btn:hover {
    color: rgba(223,225,215,.95); background: rgba(40,35,30,.85);
    border-color: rgba(223,225,215,.4); transform: scale(1.08);
  }
  .close-btn svg { width: 16px; height: 16px; }

  .ropes {
    position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: min(640px,88vw); height: auto;
    pointer-events: none; z-index: 10; overflow: visible;
  }

  .screen-wrap {
    position: absolute;
    transform: translateX(-50%) translateY(-8px);
    transform-origin: top center; cursor: default;
    display: flex; flex-direction: column; align-items: stretch;
    filter: drop-shadow(0 28px 70px rgba(0,0,0,0.8));
    z-index: 5; will-change: transform, left, top;
  }

  .hanger {
    height: 8px;
    background: linear-gradient(to bottom,#504840,#282420);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06);
  }

  .canvas {
    position: relative; background: #1a1612;
    overflow: hidden; transition: box-shadow 1s ease;
  }
  .canvas.lit { box-shadow: 0 0 120px rgba(240,230,200,0.08); }

  .fabric {
    position: absolute; inset: 0; pointer-events: none; opacity: 0.065;
    background-image:
      repeating-linear-gradient(0deg,transparent 0,transparent 3px,rgba(255,255,255,.5) 3px,rgba(255,255,255,.5) 4px),
      repeating-linear-gradient(90deg,transparent 0,transparent 3px,rgba(255,255,255,.5) 3px,rgba(255,255,255,.5) 4px);
    background-size: 4px 4px;
  }
  .beam {
    position: absolute; inset: 0; pointer-events: none; mix-blend-mode: screen;
    background: radial-gradient(ellipse 86% 80% at 50% 50%,rgba(255,248,220,.62) 0%,rgba(255,238,180,.26) 42%,rgba(255,218,140,.07) 70%,transparent 100%);
    transition: opacity .1s ease;
  }
  .img-wrap  { position: absolute; inset: 0; pointer-events: none; }
  .scanlines {
    position: absolute; inset: 0; pointer-events: none;
    background: repeating-linear-gradient(to bottom,transparent 0,transparent 3px,rgba(0,0,0,.09) 3px,rgba(0,0,0,.09) 4px);
  }
  .vignette  {
    position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 88% 82% at 50% 50%,transparent 38%,rgba(0,0,0,.62) 100%);
  }
  .grain {
    position: absolute; inset: -5%; width: 110%; height: 110%;
    opacity: .06; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 180px 180px; animation: grain-anim .09s steps(1) infinite;
  }
  @keyframes grain-anim {
    0%  { background-position: 0 0 }        25% { background-position: -42px -18px }
    50% { background-position: 22px -52px } 75% { background-position: -58px 14px }
  }
  .dark  { position: absolute; inset: 0; background: #0e0b08; pointer-events: none; }
  .sheen {
    position: absolute; inset: 0; pointer-events: none;
    background:
      linear-gradient(132deg,rgba(255,255,255,.022) 0%,transparent 42%),
      linear-gradient(to bottom,rgba(255,255,255,.007) 0%,transparent 40%);
  }
  .proj-status {
    position: absolute; bottom: 10%; left: 50%; transform: translateX(-50%); margin: 0;
    font-family: var(--font-secondary); font-size: .42rem; font-weight: 700;
    letter-spacing: .32em; color: rgba(255,220,140,.5); text-transform: uppercase;
    white-space: nowrap; pointer-events: none; animation: blink .85s ease-in-out infinite;
  }
  @keyframes blink { 0%,100% { opacity: 1 } 50% { opacity: .22 } }

  .img-wrap  { position: absolute; inset: 0; pointer-events: none; }
  .video-wrap {
    position: absolute; inset: 0;
    display: flex; align-items: stretch;
  }
  .media-video {
    width: 100%; height: 100%; object-fit: contain; display: block; background: #0e0b08;
  }
  .media-img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .blank     { width: 100%; height: 100%; background: linear-gradient(135deg,#2a2520,#181410); }
  .idle-poster {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; opacity: 0.55; pointer-events: none; z-index: 1;
  }

  .play-gate {
    position: absolute; inset: 0; z-index: 4;
    display: flex; align-items: center; justify-content: center;
    background: none; border: none; cursor: pointer;
  }
  .play-ring {
    width: 88px; height: 88px; border-radius: 50%;
    border: 2px solid rgba(223,225,215,.4); background: rgba(8,6,5,.55);
    display: flex; align-items: center; justify-content: center;
    color: rgba(223,225,215,.85); backdrop-filter: blur(6px);
    transition: border-color .2s, transform .2s, background .2s, box-shadow .2s;
  }
  .play-gate:hover .play-ring {
    border-color: rgba(223,225,215,.9); background: rgba(8,6,5,.75);
    transform: scale(1.08); box-shadow: 0 0 32px rgba(223,225,215,.08);
  }
  .play-ring svg { width: 38px; height: 38px; margin-left: 4px; }

  .caption {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 4px 2px; gap: 12px; flex-wrap: wrap;
    background: #0d0b09;
  }
  .cap-title {
    font-family: var(--font-main); font-size: clamp(1.2rem,3vw,1.8rem);
    letter-spacing: .14em; color: rgba(223,225,215,.48);
    text-transform: uppercase; line-height: 1;
  }

  .wip-tabs { display: flex; gap: 3px; }
  .wip-tab {
    font-family: var(--font-secondary); font-size: 0.65rem; font-weight: 700;
    letter-spacing: 0.18em; color: rgba(223,225,215,0.35);
    background: none; border: 1px solid rgba(223,225,215,0.12);
    padding: 5px 10px; cursor: pointer; text-transform: uppercase;
    transition: color .15s, border-color .15s, background .15s;
  }
  .wip-tab--active { color: rgba(223,225,215,0.85); border-color: rgba(223,225,215,0.35); background: rgba(223,225,215,0.06); }
  .wip-tab:hover:not(.wip-tab--active) { color: rgba(223,225,215,0.6); border-color: rgba(223,225,215,0.22); }
</style>
