<script lang='ts'>
  import { onDestroy, onMount } from 'svelte'
  import type { FilmCell } from '$lib/types'

  interface Props {
    cells: FilmCell[]
    cellSize: number
    tilt?: number
    entryX?: number
    onCellClick?: (id: string) => void
  }

  const { cells, cellSize, tilt = 3, entryX = 0, onCellClick }: Props = $props()
  let localX = $state(entryX)
  let localOpacity = $state(entryX !== 0 ? 0 : 1)

  $effect(() => {
    if (entryX === 0)
      return
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        localX = 0
        localOpacity = 1
      }),
    )
  })

  const loopCells = $derived([...cells, ...cells, ...cells])
  const segmentLen = $derived(cells.length)

  let offsetCells = $state(0)
  const offset = $derived(offsetCells * cellSize)

  let animating = false
  let animFromCells = 0
  let animTargetCells = 0
  let animStart = 0
  let animDur = 0
  let rafId = 0

  function normalizeCells(v: number): number {
    const s = segmentLen
    if (s === 0)
      return v
    while (v < -2 * s) v += s
    while (v > -s) v -= s
    return v
  }

  function ease(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
  }

  export function scrollBy(px: number, duration = 700) {
    const deltaCells = px / cellSize
    animFromCells = offsetCells
    animTargetCells = normalizeCells(offsetCells - deltaCells)
    animStart = performance.now()
    animDur = duration
    animating = true
  }

  onMount(() => {
    offsetCells = normalizeCells(-segmentLen)

    function tick(now: number) {
      if (animating) {
        const t = Math.min((now - animStart) / animDur, 1)
        offsetCells = normalizeCells(animFromCells + (animTargetCells - animFromCells) * ease(t))
        if (t >= 1) {
          animating = false
          offsetCells = animTargetCells
        }
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
  })

  onDestroy(() => cancelAnimationFrame(rafId))

  const BASE = 220
  const r = $derived(cellSize / BASE)

  const holeW = $derived(Math.round(20 * r))
  const holeH = $derived(Math.round(14 * r))
  const holeGap = $derived(Math.round(14 * r))
  const holeR = $derived(Math.round(3 * r))
  const sprockH = $derived(Math.round(20 * r))
  const sprockP = $derived(Math.round(8 * r))
  const frameR = $derived(Math.round(18 * r))
  const framePad = $derived(Math.round(4 * r))
  const frameM = $derived(Math.round(8 * r))
  const titleFs = $derived(Math.max(0.55, 0.82 * r))
  const holeCount = $derived(Math.max(3, Math.floor(cellSize / (holeW + holeGap))))
  const holeGapActual = $derived((cellSize - holeCount * holeW) / holeCount)
  const holePadding = $derived(holeGapActual / 2)

  const sheenEls = $state<(HTMLElement | null)[]>([])

  function triggerSheen(idx: number) {
    const el = sheenEls[idx]
    if (!el)
      return
    el.getAnimations().forEach(a => a.cancel())
    el.animate(
      [
        { transform: 'translateX(-250%) skewX(-15deg)', opacity: 0 },
        { transform: 'translateX(-80%)  skewX(-15deg)', opacity: 1, offset: 0.1 },
        { transform: 'translateX(250%)  skewX(-15deg)', opacity: 0 },
      ],
      { duration: 900, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' },
    )
  }
</script>

<div
  class='film-strip'
  style={`
    --tilt: ${tilt}deg;
    --local-x: ${localX}px;
    --cell: ${cellSize}px;
    opacity: ${localOpacity}
  `}
>
  <div class='strip-track' style={`transform: translateX(${offset}px)`}>
    {#each loopCells as cell, i (cell.id + i)}
      <div
        class='film-cell'
        role='button'
        tabindex='0'
        onclick={() => onCellClick?.(cell.id)}
        onkeydown={e => e.key === 'Enter' && onCellClick?.(cell.id)}
        onmouseenter={() => triggerSheen(i)}
        aria-label={cell.title ?? 'Open work'}
        style={`width:${cellSize}px; height:${cellSize}px; padding:${sprockP}px 0`}
      >
        <div
          class='sprockets'
          aria-hidden='true'
          style={`height:${sprockH}px; gap:${holeGapActual}px; padding:0 ${holePadding}px`}
        >
          {#each { length: holeCount } as _}
            <div
              class='hole'
              style={`width:${holeW}px; height:${holeH}px; border-radius:${holeR}px`}
            ></div>
          {/each}
        </div>

        <div
          class='cell-frame'
          style={`border-radius:${frameR}px; margin:${framePad}px ${frameM}px`}
        >
          {#if cell.image}
            <img
              src={cell.image}
              alt={cell.title ?? ''}
              draggable='false'
              loading='lazy'
              style={`border-radius:${frameR}px`}
            />
          {:else}
            <div class='frame-placeholder' style={`border-radius:${frameR}px`}></div>
          {/if}
          {#if cell.title}
            <div
              class='cell-title'
              aria-hidden='true'
              style={`border-radius:${frameR}px`}
            >
              <span style={`font-size:${titleFs}rem`}>{cell.title}</span>
            </div>
          {/if}
          <div class='sheen' aria-hidden='true' bind:this={sheenEls[i]}></div>
        </div>

        <div
          class='sprockets'
          aria-hidden='true'
          style={`height:${sprockH}px; gap:${holeGapActual}px; padding:0 ${holePadding}px`}
        >
          {#each { length: holeCount } as _}
            <div
              class='hole'
              style={`width:${holeW}px; height:${holeH}px; border-radius:${holeR}px`}
            ></div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .film-strip {
    position: absolute;
    left: -20%; right: -20%;
    top: 50%;
    height: var(--cell);
    transform: translateY(-50%) rotate(var(--tilt, 3deg)) translateX(var(--local-x, 0px));
    background: var(--color-primary);
    overflow: hidden;
    transition:
      transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1),
      opacity   0.6s ease;
  }

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
  }

  .hole {
    flex-shrink: 0;
    background: var(--color-secondary);
    opacity: 0.9;
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
  }

  .cell-frame img,
  .frame-placeholder {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
  }
  .frame-placeholder { background: var(--color-secondary); }

  .cell-title {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(11,10,9,0.65);
    opacity: 0;
    transition: opacity 0.18s ease;
    pointer-events: none;
  }
  .film-cell:hover .cell-title,
  .film-cell:focus-visible .cell-title { opacity: 1; }
  .cell-title span {
    font-family: var(--font-main);
    letter-spacing: 0.2em;
    color: var(--color-secondary);
    text-align: center;
    padding: 0 8px;
    text-transform: uppercase;
  }

  .sheen {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    overflow: hidden;
    background: linear-gradient(
      to right,
      transparent 0%,
      rgba(255, 252, 235, 0.18) 40%,
      rgba(255, 255, 255, 0.72) 50%,
      rgba(255, 252, 235, 0.18) 60%,
      transparent 100%
    );
    width: 40%;
    transform: translateX(-250%) skewX(-15deg);
  }
</style>
