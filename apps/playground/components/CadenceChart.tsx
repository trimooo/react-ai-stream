'use client'

import { useEffect, useRef, useCallback } from 'react'

export interface CadenceSample {
  ts: number      // ms since run start
  toksPerSec: number
  cumTokens: number
}

interface Props {
  samples: CadenceSample[]
  color: string
  height?: number
  showCumulative?: boolean
}

export function CadenceChart({ samples, color, height = 80, showCumulative = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, w, h)

    if (samples.length < 2) return

    const metric = showCumulative
      ? samples.map(s => s.cumTokens)
      : samples.map(s => s.toksPerSec)

    const maxVal = Math.max(...metric, 1)
    const minTs = samples[0]!.ts
    const maxTs = samples[samples.length - 1]!.ts
    const tsRange = Math.max(maxTs - minTs, 1)

    const xOf = (i: number) => ((samples[i]!.ts - minTs) / tsRange) * w
    const yOf = (v: number) => h - (v / maxVal) * (h - 4) - 2

    // Fill under curve
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, color + '55')
    grad.addColorStop(1, color + '00')

    ctx.beginPath()
    ctx.moveTo(xOf(0), h)
    for (let i = 0; i < samples.length; i++) {
      ctx.lineTo(xOf(i), yOf(metric[i]!))
    }
    ctx.lineTo(xOf(samples.length - 1), h)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    ctx.beginPath()
    ctx.moveTo(xOf(0), yOf(metric[0]!))
    for (let i = 1; i < samples.length; i++) {
      ctx.lineTo(xOf(i), yOf(metric[i]!))
    }
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.stroke()

    // Last point dot
    if (samples.length > 0) {
      const last = samples.length - 1
      ctx.beginPath()
      ctx.arc(xOf(last), yOf(metric[last]!), 3, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    }
  }, [samples, color, showCumulative, height])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    const observer = new ResizeObserver(draw)
    if (canvasRef.current) observer.observe(canvasRef.current)
    return () => observer.disconnect()
  }, [draw])

  if (samples.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 1 }} />
      </div>
    )
  }

  const metric = showCumulative ? samples.map(s => s.cumTokens) : samples.map(s => s.toksPerSec)
  const peak = Math.max(...metric)
  const last = metric[metric.length - 1]!
  const elapsed = ((samples[samples.length - 1]!.ts - samples[0]!.ts) / 1000).toFixed(1)

  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height }} />
      <div style={{ position: 'absolute', top: 4, right: 6, fontSize: 10, color: color, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
        {showCumulative
          ? `${last} tok · ${elapsed}s`
          : `${last.toFixed(0)} t/s`}
      </div>
      <div style={{ position: 'absolute', top: 4, left: 6, fontSize: 10, color: '#334155', fontVariantNumeric: 'tabular-nums' }}>
        peak {showCumulative ? `${peak} tok` : `${peak.toFixed(0)} t/s`}
      </div>
    </div>
  )
}
