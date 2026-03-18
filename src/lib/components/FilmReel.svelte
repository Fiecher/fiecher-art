<script lang='ts'>
  import { onDestroy, onMount } from 'svelte'
  import type { FilmCell } from '$lib/types'

  interface Props {
    cells: FilmCell[]
    scrollX?: number
    tilt?: number
    entryX?: number
    entryDelay?: number
    onCellClick?: (id: string) => void
    visible?: boolean
  }

  const {
    cells,
    scrollX = 0,
    tilt = 2,
    entryX = 0,
    entryDelay = 0,
    onCellClick,
    visible = true,
  }: Props = $props()

  const loopCells = $derived([...cells, ...cells, ...cells])
  const segmentCount = cells.length

  let stripEl = $state<HTMLElement | null>(null)
  let cellSize = $state(0)

  const segmentPx = $derived(segmentCount * cellSize)
  const bleedOffset = $derived(cellSize > 0 ? Math.round(cellSize * 0.55) : 0)

  const normScrollX = $derived(
    segmentPx > 0 ? ((scrollX % segmentPx) + segmentPx) % segmentPx : 0,
  )
  const trackOffset = $derived(segmentPx > 0 ? -segmentPx + bleedOffset - normScrollX : 0)

  let slideX = $state(entryX !== 0 ? 9999 : 0)
  let slideOpa = $state(entryX !== 0 ? 0 : 1)
  let isEntering = $state(false)
  let _entranceRaf = 0

  function easeOut3(t: number) {
    return 1 - (1 - t) ** 3
  }
  function easeOvershoot(t: number) {
    const s = 0.4
    return 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2
  }

  export function playEntrance(delay = entryDelay) {
    if (entryX === 0)
      return
    cancelAnimationFrame(_entranceRaf)
    const run = () => {
      const startX = Math.sign(entryX) * window.innerWidth * 0.75
      slideX = startX
      slideOpa = 0
      isEntering = true
      const DURATION = 1100
      const startTime = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - startTime) / DURATION, 1)
        slideX = startX * (1 - easeOvershoot(t))
        slideOpa = Math.min(1, easeOut3(t * 1.5))
        if (t < 1) {
          _entranceRaf = requestAnimationFrame(tick)
        } else {
          slideX = 0
          slideOpa = 1
          isEntering = false
        }
      }
      _entranceRaf = requestAnimationFrame(tick)
    }
    if (delay > 0)
      setTimeout(run, delay)
    else run()
  }

  const BASE = 220
  const sprockVars = $derived.by(() => {
    if (cellSize <= 0)
      return ''
    const r = cellSize / BASE
    const holeW = Math.round(20 * r)
    const holeH = Math.round(14 * r)
    const holeGap = Math.round(14 * r)
    const holeR = Math.round(3 * r)
    const sprockH = Math.round(20 * r)
    const sprockP = Math.round(8 * r)
    const frameR = Math.round(18 * r)
    const framePad = Math.round(4 * r)
    const frameM = Math.round(8 * r)
    const titleFsLg = Math.max(0.75, 1.2 * r)
    const holeCount = Math.max(3, Math.floor(cellSize / (holeW + holeGap)))
    const holeGapActual = (cellSize - holeCount * holeW) / holeCount
    const holePadding = holeGapActual / 2
    return [
      `--hole-w:${holeW}px`,
      `--hole-h:${holeH}px`,
      `--hole-r:${holeR}px`,
      `--hole-gap:${holeGapActual}px`,
      `--hole-pad:${holePadding}px`,
      `--hole-count:${holeCount}`,
      `--sprock-h:${sprockH}px`,
      `--sprock-p:${sprockP}px`,
      `--frame-r:${frameR}px`,
      `--frame-pad:${framePad}px`,
      `--frame-m:${frameM}px`,
      `--title-fs-lg:${titleFsLg}rem`,
    ].join(';')
  })

  const holeCount = $derived.by(() => {
    if (cellSize <= 0)
      return 4
    const r = cellSize / BASE
    const holeW = Math.round(20 * r)
    const holeGap = Math.round(14 * r)
    return Math.max(3, Math.floor(cellSize / (holeW + holeGap)))
  })

  const sheenEls = $state<(HTMLElement | null)[]>([])
  let pressedIdx = $state<number | null>(null)

  function triggerSheen(idx: number) {
    const el = sheenEls[idx]
    if (!el)
      return
    el.getAnimations().forEach(a => a.cancel())
    el.animate(
      [
        { transform: 'translateX(-250%) skewX(-15deg)', opacity: 0 },
        { transform: 'translateX(-80%) skewX(-15deg)', opacity: 1, offset: 0.1 },
        { transform: 'translateX(250%) skewX(-15deg)', opacity: 0 },
      ],
      { duration: 900, easing: 'cubic-bezier(0.4,0,0.2,1)', fill: 'forwards' },
    )
  }

  function triggerFlash(idx: number, id: string) {
    const originalId = cells[idx % segmentCount]?.id ?? id
    pressedIdx = idx
    setTimeout(() => {
      pressedIdx = null
    }, 180)
    setTimeout(() => onCellClick?.(originalId), 120)
  }

  onMount(() => {
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width
      if (!w || w <= 0)
        return
      cellSize = Math.max(120, Math.min(560, Math.round(w * 0.38)))
    })
    if (stripEl)
      ro.observe(stripEl)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(_entranceRaf)
    }
  })

  onDestroy(() => cancelAnimationFrame(_entranceRaf))
</script>

<div
  class='film-strip'
  class:film-strip--entering={isEntering}
  bind:this={stripEl}
  style={`--tilt:${tilt}deg; --slide-x:${slideX}px; --cell:${cellSize}px; opacity:${slideOpa}; ${sprockVars}`}
>
  <div class='strip-track' style={`transform: translateX(${trackOffset}px)`}>
    {#each loopCells as cell, i (i)}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class='film-cell'
        role='button'
        tabindex={i >= segmentCount && i < segmentCount * 2 ? 0 : -1}
        aria-hidden={i < segmentCount || i >= segmentCount * 2 ? 'true' : undefined}
        aria-label={cell.title ?? 'Open work'}
        onclick={() => triggerFlash(i, cell.id)}
        onkeydown={e => e.key === 'Enter' && triggerFlash(i, cell.id)}
        onmouseenter={() => triggerSheen(i)}
      >
        <div class='sprockets' aria-hidden='true'>
          {#each { length: holeCount } as _}
            <div class='hole'></div>
          {/each}
        </div>

        <div class='cell-frame'>
          <div class='frame-inner' class:frame-inner--pressed={pressedIdx === i}>
            {#if cell.image}
              <div class='img-wrap'>
                {cell.title ?? ''}
                <img src={cell.image} alt='' draggable='false' loading='eager' decoding='async' />
              </div>
            {:else}
              <div class='frame-placeholder'></div>
            {/if}
          </div>
          {#if cell.title}
            <div class='cell-title' aria-hidden='true'><span>{cell.title}</span></div>
          {/if}
          <div class='sheen' aria-hidden='true' bind:this={sheenEls[i]}></div>
        </div>

        <div class='sprockets' aria-hidden='true'>
          {#each { length: holeCount } as _}
            <div class='hole'></div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .film-strip {
    position: absolute;
    left: 0; right: 0;
    top: 50%;
    height: var(--cell);
    transform: translateY(-50%) rotate(var(--tilt, 0deg)) translateX(var(--slide-x, 0px));
    background: var(--color-primary);
    overflow: hidden;
  }
  .film-strip--entering { transition: none; }

  .strip-track {
    display: flex;
    flex-direction: row;
    height: 100%;
    will-change: transform;
  }

  .film-cell {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    cursor: pointer;
    position: relative;
    width: var(--cell);
    height: var(--cell);
    padding: var(--sprock-p) 0;
  }
  .film-cell:focus-visible { outline: 2px solid rgba(255,64,0,0.6); outline-offset: -2px; }

  .sprockets {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    box-sizing: border-box;
    flex-shrink: 0;
    height: var(--sprock-h);
    gap: var(--hole-gap);
    padding: 0 var(--hole-pad);
  }

  .hole {
    flex-shrink: 0;
    background: var(--color-secondary);
    opacity: 0.9;
    width: var(--hole-w);
    height: var(--hole-h);
    border-radius: var(--hole-r);
  }

  .cell-frame {
    flex: 1;
    width: calc(100% - 16px);
    background: var(--color-secondary);
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--frame-r);
    margin: var(--frame-pad) var(--frame-m);
  }

  .img-wrap {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    text-align: center;
    padding: 8px;
    font-family: var(--font-main);
    letter-spacing: 0.08em;
    color: var(--color-primary);
    text-transform: uppercase;
    word-break: break-word;
    line-height: 1.3;
    border-radius: var(--frame-r);
    font-size: 0.65rem;
  }

  .img-wrap img {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    background: var(--color-secondary);
    border-radius: var(--frame-r);
  }

  .frame-placeholder {
    position: absolute; inset: 0;
    background: var(--color-secondary);
    border-radius: var(--frame-r);
  }

  .frame-inner {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.1s cubic-bezier(0.4,0,0.6,1), box-shadow 0.1s ease;
    transform-origin: center center;
    transform: scale(1.05);
  }
  .frame-inner--pressed {
    transform: scale(1.0);
    box-shadow: inset 0 2px 12px rgba(0,0,0,0.55);
  }

  .cell-title {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(11,10,9,0.65);
    opacity: 0;
    transition: opacity 0.18s ease;
    pointer-events: none;
    border-radius: var(--frame-r);
  }
  .film-cell:hover .cell-title,
  .film-cell:focus-visible .cell-title { opacity: 1; }
  .cell-title span {
    font-family: var(--font-main);
    font-size: var(--title-fs-lg);
    letter-spacing: 0.1em;
    color: var(--color-secondary);
    text-align: center;
    padding: 0 8px;
    text-transform: uppercase;
    text-shadow: 1px 1px 0 rgba(0,0,0,0.65), 2px 2px 4px rgba(0,0,0,0.30);
  }

  .sheen {
    position: absolute; inset: 0;
    pointer-events: none;
    border-radius: inherit;
    overflow: hidden;
    background: linear-gradient(
      to right,
      transparent 0%,
      rgba(255,252,235,0.18) 40%,
      rgba(255,255,255,0.72) 50%,
      rgba(255,252,235,0.18) 60%,
      transparent 100%
    );
    width: 40%;
    transform: translateX(-250%) skewX(-15deg);
  }
</style>
