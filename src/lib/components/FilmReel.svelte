<script lang='ts'>
  import { onDestroy, onMount } from 'svelte'
  import type { FilmCell } from '$lib/types'

  interface Props {
    cells: FilmCell[]
    cellSize: number
    tilt?: number
    entryX?: number
    entryDelay?: number
    initialSection?: number
    cellsPerSection?: number
    onCellClick?: (id: string) => void
  }

  const { cells, cellSize, tilt = 3, entryX = 0, entryDelay = 0, initialSection = 0, cellsPerSection = 2, onCellClick }: Props = $props()

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

  let dragging = false
  let dragStartX = 0
  let dragStartCells = 0
  let dragVelX = 0
  let dragLastX = 0
  let dragLastT = 0

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
    if (cellSize <= 0)
      return
    const deltaCells = px / cellSize
    animFromCells = offsetCells
    animTargetCells = normalizeCells(offsetCells - deltaCells)
    animStart = performance.now()
    animDur = duration
    animating = true
  }

  export function getDragDeltaCells(): number {
    return dragging ? offsetCells - dragStartCells : 0
  }

  export function snapTo(targetOffsetCells: number, duration = 500) {
    dragging = false
    animFromCells = offsetCells
    animTargetCells = normalizeCells(targetOffsetCells)
    animStart = performance.now()
    animDur = duration
    animating = true
  }

  export function onDragStart(clientX: number) {
    if (cellSize <= 0)
      return
    animating = false
    dragging = true
    dragStartX = clientX
    dragStartCells = offsetCells
    dragVelX = 0
    dragLastX = clientX
    dragLastT = performance.now()
  }

  export function onDragMove(clientX: number) {
    if (!dragging || cellSize <= 0)
      return
    const now = performance.now()
    const dt = now - dragLastT
    if (dt > 0) {
      dragVelX = (clientX - dragLastX) / dt
    }
    dragLastX = clientX
    dragLastT = now
    const deltaPx = clientX - dragStartX
    offsetCells = normalizeCells(dragStartCells + deltaPx / cellSize)
  }

  export function onDragEnd() {
    if (!dragging)
      return
    dragging = false
  }

  const entryXCompensated = $derived(
    entryX === 0 ?
      0 :
        entryX + Math.sign(entryX) * Math.abs(initialSection) * cellsPerSection * cellSize,
  )
  let slideX = $state(entryXCompensated)
  let slideOpa = $state(entryX !== 0 ? 0 : 1)

  onMount(() => {
    offsetCells = normalizeCells(-segmentLen)

    if (entryX !== 0) {
      slideX = entryXCompensated
      const triggerEntrance = () => {
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            slideX = 0
            slideOpa = 1
          }),
        )
      }
      if (entryDelay > 0) {
        window.setTimeout(triggerEntrance, entryDelay)
      } else {
        triggerEntrance()
      }
    }

    function tick(now: number) {
      if (animating) {
        const t = Math.min((now - animStart) / animDur, 1)
        const e = ease(t)
        offsetCells = normalizeCells(
          animFromCells + (animTargetCells - animFromCells) * e,
        )
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
  let pressedIdx = $state<number | null>(null)

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

  function triggerFlash(idx: number, id: string) {
    pressedIdx = idx
    window.setTimeout(() => {
      pressedIdx = null
    }, 180)
    window.setTimeout(() => onCellClick?.(id), 120)
  }
</script>

<div
  class='film-strip'
  class:film-strip--dragging={dragging}
  style={`
    --tilt:    ${tilt}deg;
    --slide-x: ${slideX}px;
    --cell:    ${cellSize}px;
    opacity:   ${slideOpa};
  `}
>
  <div class='strip-track' style={`transform:translateX(${offset}px)`}>
    {#each loopCells as cell, i (cell.id + i)}
      <div
        class='film-cell'
        role='button'
        tabindex='0'
        onclick={() => triggerFlash(i, cell.id)}
        onkeydown={e => e.key === 'Enter' && triggerFlash(i, cell.id)}
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
            <div class='hole' style={`width:${holeW}px; height:${holeH}px; border-radius:${holeR}px`}></div>
          {/each}
        </div>

        <div class='cell-frame' style={`border-radius:${frameR}px; margin:${framePad}px ${frameM}px`}>
          <div class='frame-inner' class:frame-inner--pressed={pressedIdx === i}>
            {#if cell.image}
              <div
                class='img-wrap'
                style={`border-radius:${frameR}px; font-size:${Math.max(0.5, titleFs * 0.9)}rem`}
              >
                {cell.title ?? ''}
                <img
                  src={cell.image}
                  alt=''
                  draggable='false'
                  loading='lazy'
                  style={`border-radius:${frameR}px`}
                />
              </div>
            {:else}
              <div class='frame-placeholder' style={`border-radius:${frameR}px`}></div>
            {/if}
          </div>
          {#if cell.title}
            <div class='cell-title' aria-hidden='true' style={`border-radius:${frameR}px`}>
              <span style={`font-size:${titleFs * 1.5}rem`}>{cell.title}</span>
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
            <div class='hole' style={`width:${holeW}px; height:${holeH}px; border-radius:${holeR}px`}></div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .film-strip {
    position: absolute;
    left: -25%; right: -25%;
    top: 50%;
    height: var(--cell);
    transform: translateY(-50%) rotate(var(--tilt, 3deg)) translateX(var(--slide-x, 0px));
    background: var(--color-primary);
    overflow: hidden;
    cursor: grab;
    transition:
      transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1),
      opacity   0.6s ease;
    isolation: isolate;
  }

  .film-strip--dragging {
    cursor: grabbing;
    user-select: none;
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
    box-shadow: inset 0 0 12px rgba(0,0,0,0.35);
  }

  .cell-frame::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 3;
    background-image:
      radial-gradient(circle, rgba(11,10,9,0.5) 1px, transparent 1px),
      radial-gradient(circle, rgba(11,10,9,0.5) 1px, transparent 1px);
    background-size: 5px 5px;
    background-position: 0 0, 2.5px 2.5px;
    mix-blend-mode: multiply;
    opacity: 1;
    border-radius: inherit;
  }

  .img-wrap {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 8px;
    font-family: var(--font-main);
    letter-spacing: 0.08em;
    color: var(--color-primary);
    text-transform: uppercase;
    word-break: break-word;
    line-height: 1.3;
  }

  .img-wrap img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    background: var(--color-secondary);
  }

  .frame-placeholder {
    position: absolute;
    inset: 0;
    background: var(--color-secondary);
  }

  .frame-inner {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      transform 0.1s cubic-bezier(0.4, 0, 0.6, 1),
      box-shadow 0.1s ease;
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
  }
  .film-cell:hover .cell-title,
  .film-cell:focus-visible .cell-title { opacity: 1; }
  .cell-title span {
    font-family: var(--font-main);
    letter-spacing: 0.1em;
    color: var(--color-secondary);
    text-align: center;
    padding: 0 8px;
    text-transform: uppercase;
    text-shadow:
      1px 1px 0 rgba(0,0,0,0.65),
      2px 2px 4px rgba(0,0,0,0.30);
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
      rgba(255,252,235,0.18) 40%,
      rgba(255,255,255,0.72) 50%,
      rgba(255,252,235,0.18) 60%,
      transparent 100%
    );
    width: 40%;
    transform: translateX(-250%) skewX(-15deg);
  }
</style>
