<script lang='ts'>
  import { onMount } from 'svelte'
  import type { FilmCell } from '$lib/types'

  interface Props {
    cells: FilmCell[]
    tilt?: number
    entryX?: number
    entryDelay?: number
    onCellClick?: (id: string) => void
    onReady?: () => void
    visible?: boolean
    overlay?: boolean
  }

  const {
    cells,
    tilt = 2,
    entryX = 0,
    entryDelay = 0,
    onCellClick,
    onReady,
    visible = true,
    overlay = false,
  }: Props = $props()

  let wrapEl: HTMLDivElement | null = null
  let canvasEl: HTMLCanvasElement | null = null

  let cellSize = 0
  let canvasW = 0
  let canvasH = 0
  let scrollX = 0
  let slideX = entryX !== 0 ? 9999 : 0
  let slideOpa = entryX !== 0 ? 0 : 1
  let hoverIdx = -1
  let pressIdx = -1
  let sheenIdx = -1
  let sheenT = 0 // 0..1
  let sheenRafId = 0
  let entranceRafId = 0
  let rafId = 0
  let dirty = true

  const imgCache = new Map<string, HTMLImageElement | null>()

  function loadImages() {
    const srcs = [...new Set(cells.map(c => c.image).filter(Boolean))] as string[]
    let loaded = 0
    const total = srcs.length
    if (total === 0) {
      onReady?.()
      return
    }
    srcs.forEach(src => {
      imgCache.set(src, null)
      const img = new Image()
      const done = () => {
        imgCache.set(src, img.complete && img.naturalWidth > 0 ? img : null)
        loaded++
        markDirty()
        if (loaded === total)
          onReady?.()
      }
      img.onload = () => {
        img.decode?.().catch(() => {}).finally(done)
      }
      img.onerror = done
      img.src = src
    })
  }

  const SEG = cells.length
  const loop: FilmCell[] = [...cells, ...cells, ...cells]

  function segPx() {
    return SEG * cellSize
  }
  function bleedOff() {
    return cellSize > 0 ? Math.round(cellSize * 0.55) : 0
  }
  function trackOx(sx: number): number {
    const sp = segPx()
    if (sp <= 0)
      return 0
    const norm = ((sx % sp) + sp) % sp
    return -sp + bleedOff() - norm + cellSize
  }
  function hitCell(cx: number): number {
    const ox = trackOx(scrollX)
    const i = Math.floor((cx - ox) / cellSize)
    return (i < 0 || i >= loop.length) ? -1 : i
  }

  function getMetrics(cs: number) {
    const r = cs / 220
    const holeW = Math.round(20 * r)
    const holeH = Math.round(14 * r)
    const holeGapR = Math.round(14 * r)
    const sprockH = Math.round(20 * r)
    const sprockP = Math.round(8 * r)
    const frameR = Math.round(18 * r)
    const framePad = Math.round(4 * r)
    const frameM = Math.round(8 * r)
    const holeCount = Math.max(3, Math.floor(cs / (holeW + holeGapR)))
    const holeGap = (cs - holeCount * holeW) / holeCount
    const holePad = holeGap / 2
    return { r, holeW, holeH, sprockH, sprockP, frameR, framePad, frameM, holeCount, holeGap, holePad }
  }

  function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    r = Math.min(r, w / 2, h / 2)
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath()
      ctx.roundRect(x, y, w, h, r)
    } else {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
    }
  }

  function draw() {
    if (!canvasEl || cellSize <= 0)
      return
    const ctx = canvasEl.getContext('2d')
    if (!ctx)
      return

    const dpr = window.devicePixelRatio || 1
    const W = canvasW
    const H = canvasH
    const cs = cellSize
    const ox = trackOx(scrollX)

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const m = getMetrics(cs)

    const fy0 = m.sprockP + m.sprockH + m.framePad
    const fw = cs - m.frameM * 2
    const fh = cs - m.sprockP * 2 - m.sprockH * 2 - m.framePad * 2

    for (let i = 0; i < loop.length; i++) {
      const cell = loop[i]
      const cx = ox + i * cs
      if (cx + cs < -cs || cx > W + cs)
        continue

      const fx = cx + m.frameM
      const fy = fy0
      const isHov = i === hoverIdx
      const isPrs = i === pressIdx

      ctx.fillStyle = '#0b0a09'
      ctx.fillRect(cx, 0, cs, H)
      ctx.fillStyle = 'rgba(223, 225, 215, 0.9)'
      for (let pass = 0; pass < 2; pass++) {
        const stripY = pass === 0 ?
          m.sprockP :
            H - m.sprockP - m.sprockH
        const holeY = stripY + (m.sprockH - m.holeH) / 2
        for (let h = 0; h < m.holeCount; h++) {
          const hx = cx + m.holePad + h * (m.holeW + m.holeGap)
          ctx.fillRect(hx, holeY, m.holeW, m.holeH)
        }
      }

      ctx.save()
      rrect(ctx, fx, fy, fw, fh, m.frameR)
      ctx.clip()

      const img = cell.image ? imgCache.get(cell.image) : undefined
      if (img) {
        const scale = isPrs ? 1.0 : 1.05
        const iw = img.naturalWidth
        const ih = img.naturalHeight
        const ir = iw / ih
        const fr = fw / fh
        let sx = 0
        let sy = 0
        let sw = iw
        let sh = ih
        if (ir > fr) {
          sw = sh * fr
          sx = (iw - sw) / 2
        } else {
          sh = sw / fr
          sy = (ih - sh) / 2
        }
        const dw = fw * scale
        const dh = fh * scale
        ctx.drawImage(img, sx, sy, sw, sh, fx - (dw - fw) / 2, fy - (dh - fh) / 2, dw, dh)

        if (isPrs) {
          ctx.fillStyle = 'rgba(0,0,0,0.20)'
          ctx.fillRect(fx, fy, fw, fh)
          const g = ctx.createLinearGradient(fx, fy, fx, fy + 20)
          g.addColorStop(0, 'rgba(0,0,0,0.55)')
          g.addColorStop(1, 'transparent')
          ctx.fillStyle = g
          ctx.fillRect(fx, fy, fw, fh)
        }
      } else {
        ctx.fillStyle = '#dfe1d7'
        ctx.fillRect(fx, fy, fw, fh)
        if (cell.title) {
          ctx.fillStyle = 'rgba(11,10,9,0.45)'
          ctx.font = `${Math.max(9, Math.round(0.65 * 16 * m.r))}px "Trade Gothic LT Std",sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(cell.title.toUpperCase(), fx + fw / 2, fy + fh / 2)
        }
      }

      if (isHov && cell.title) {
        ctx.fillStyle = 'rgba(11,10,9,0.65)'
        ctx.fillRect(fx, fy, fw, fh)
        const fs = Math.max(12, Math.round(1.2 * 16 * m.r))
        ctx.fillStyle = '#dfe1d7'
        ctx.font = `${fs}px "Bebas Neue",sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.letterSpacing = `${(fs * 0.1).toFixed(1)}px`
        ctx.fillText(cell.title.toUpperCase(), fx + fw / 2, fy + fh / 2)
        ctx.letterSpacing = '0px'
      }

      if (i === sheenIdx && sheenT > 0 && sheenT < 1) {
        const opa = sheenT < 0.1 ? sheenT / 0.1 : 1 - (sheenT - 0.1) / 0.9
        const sheenW = fw * 0.40
        const sweepCX = fx + fw * (-1.5 + sheenT * 3.0)
        const sg = ctx.createLinearGradient(sweepCX - sheenW / 2, 0, sweepCX + sheenW / 2, 0)
        sg.addColorStop(0, `rgba(255,252,235,0)`)
        sg.addColorStop(0.35, `rgba(255,252,235,${(0.18 * opa).toFixed(3)})`)
        sg.addColorStop(0.50, `rgba(255,255,255,${(0.72 * opa).toFixed(3)})`)
        sg.addColorStop(0.65, `rgba(255,252,235,${(0.18 * opa).toFixed(3)})`)
        sg.addColorStop(1, `rgba(255,252,235,0)`)
        ctx.save()
        ctx.transform(1, 0, -0.268, 1, fx * 0.268, 0)
        ctx.fillStyle = sg
        ctx.fillRect(sweepCX - sheenW / 2, fy, sheenW, fh)
        ctx.restore()
      }

      ctx.restore()
    }

    const fadeColor = overlay ? '#0b0a09' : '#dfe1d7'
    const fadeColor0 = overlay ? 'rgba(11,10,9,0)' : 'rgba(223,225,215,0)'
    const fadeW = Math.min(72, Math.max(20, W * 0.05))
    const gl = ctx.createLinearGradient(0, 0, fadeW, 0)
    gl.addColorStop(0, fadeColor)
    gl.addColorStop(1, fadeColor0)
    ctx.fillStyle = gl
    ctx.fillRect(0, 0, fadeW, H)
    const gr = ctx.createLinearGradient(W - fadeW, 0, W, 0)
    gr.addColorStop(0, fadeColor0)
    gr.addColorStop(1, fadeColor)
    ctx.fillStyle = gr
    ctx.fillRect(W - fadeW, 0, fadeW, H)

    ctx.restore()
    dirty = false
  }

  function scheduleFrame() {
    if (rafId)
      return
    rafId = requestAnimationFrame(() => {
      rafId = 0
      if (dirty)
        draw()
    })
  }
  function markDirty() {
    dirty = true
    scheduleFrame()
  }

  export function setScrollX(x: number) {
    scrollX = x
    markDirty()
  }
  export function setDragDist(d: number) {
    dragDistPx = d
  }

  function easeOut3(t: number) {
    return 1 - (1 - t) ** 3
  }
  function easeOvershoot(t: number) {
    const s = 0.4
    return 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2
  }
  function applySlide() {
    if (!wrapEl)
      return
    wrapEl.style.transform = `translateY(-50%) rotate(${tilt}deg) translateX(${slideX}px)`
    wrapEl.style.opacity = String(Math.max(0, Math.min(1, slideOpa)))
  }

  export function playEntrance(delay = entryDelay) {
    if (entryX === 0)
      return
    cancelAnimationFrame(entranceRafId)
    const run = () => {
      const startX = Math.sign(entryX) * window.innerWidth * 0.75
      slideX = startX
      slideOpa = 0
      applySlide()
      const DURATION = 1100
      const t0 = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - t0) / DURATION, 1)
        slideX = startX * (1 - easeOvershoot(t))
        slideOpa = Math.min(1, easeOut3(t * 1.5))
        applySlide()
        if (t < 1) {
          entranceRafId = requestAnimationFrame(tick)
        } else {
          slideX = 0
          slideOpa = 1
          applySlide()
        }
      }
      entranceRafId = requestAnimationFrame(tick)
    }
    if (delay > 0)
      setTimeout(run, delay)
    else run()
  }

  let containerW = 0

  function resize(w: number) {
    if (!canvasEl || !wrapEl)
      return
    const cs = Math.max(120, Math.min(560, Math.round(w * 0.38)))
    cellSize = cs
    containerW = w
    const bleed = cs
    const cw = w + bleed * 2
    const dpr = window.devicePixelRatio || 1
    canvasW = cw
    canvasH = cs
    canvasEl.width = Math.round(cw * dpr)
    canvasEl.height = Math.round(cs * dpr)
    canvasEl.style.width = `${cw}px`
    canvasEl.style.height = `${cs}px`
    canvasEl.style.marginLeft = `${-bleed}px`
    wrapEl.style.height = `${cs}px`
    markDirty()
  }

  let dragDistPx = 0

  function localX(e: MouseEvent): number {
    if (!canvasEl)
      return 0
    return e.clientX - canvasEl.getBoundingClientRect().left
  }

  function onMouseMove(e: MouseEvent) {
    const idx = hitCell(localX(e))
    if (idx !== hoverIdx) {
      if (idx >= 0 && idx !== sheenIdx)
        startSheen(idx)
      hoverIdx = idx
      markDirty()
    }
  }

  function onMouseLeave() {
    if (hoverIdx !== -1) {
      hoverIdx = -1
      markDirty()
    }
  }

  function onCanvasClick(e: MouseEvent) {
    if (dragDistPx > 6)
      return
    const idx = hitCell(localX(e))
    if (idx < 0)
      return
    const originalId = cells[idx % SEG]?.id ?? loop[idx].id
    pressIdx = idx
    markDirty()
    setTimeout(() => {
      pressIdx = -1
      markDirty()
    }, 180)
    setTimeout(() => onCellClick?.(originalId), 120)
  }

  function startSheen(idx: number) {
    cancelAnimationFrame(sheenRafId)
    sheenIdx = idx
    sheenT = 0
    const dur = 900
    const t0 = performance.now()
    const tick = (now: number) => {
      sheenT = Math.min((now - t0) / dur, 1)
      markDirty()
      if (sheenT < 1) {
        sheenRafId = requestAnimationFrame(tick)
      } else {
        sheenIdx = -1
        sheenT = 0
      }
    }
    sheenRafId = requestAnimationFrame(tick)
  }

  onMount(() => {
    if (wrapEl && entryX !== 0)
      wrapEl.style.opacity = '0'

    let resizeRaf = 0
    const ro = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect
      if (!rect || rect.width <= 0)
        return
      cancelAnimationFrame(resizeRaf)
      resizeRaf = requestAnimationFrame(() => resize(rect.width))
    })
    if (wrapEl)
      ro.observe(wrapEl)
    loadImages()

    return () => {
      ro.disconnect()
      cancelAnimationFrame(resizeRaf)
      cancelAnimationFrame(entranceRafId)
      cancelAnimationFrame(sheenRafId)
      cancelAnimationFrame(rafId)
    }
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class='film-strip'
  bind:this={wrapEl}
  style={`--tilt:${tilt}deg`}
>
  <canvas
    bind:this={canvasEl}
    class='strip-canvas'
    onclick={onCanvasClick}
    onmousemove={onMouseMove}
    onmouseleave={onMouseLeave}
    role='img'
    aria-label='Works film strip'
  ></canvas>
</div>

<style>
  .film-strip {
    position: absolute;
    left: 0; right: 0;
    top: 50%;
    transform: translateY(-50%) rotate(var(--tilt, 0deg)) translateX(0px);
    opacity: 1;
    background: #0b0a09;
    overflow: visible;
  }

  .strip-canvas {
    display: block;
    cursor: pointer;
  }
</style>
