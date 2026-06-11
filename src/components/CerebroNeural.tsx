'use client'

import { useEffect, useRef } from 'react'

export type AgenteViz = {
  id: number
  nome: string
  descricao: string
  perspectiva: string
  prompt?: string
  docs_chars?: number
}

type Neuron = {
  cx: number
  cy: number
  hub: boolean
  col: string
  depth: number
  phase: number
  dphx: number
  dphy: number
  dspx: number
  dspy: number
  damp: number
  _x: number
  _y: number
  flash: number
}

type Edge = { a: number; b: number; col?: string; inter?: boolean }
type Pulse = { a: number; b: number; t: number; speed: number }
type Cluster = { x: number; y: number; n: number; r: number; col: string; _hub?: number; _idx?: number[]; _depth?: number }

const CORES: Record<string, string[]> = {
  'Análise': ['56,189,248', '45,212,191', '34,197,94'],
  'Estratégia': ['79,124,255', '59,130,246', '99,102,241'],
  'Risco': ['240,92,92', '248,113,113', '255,122,89'],
  'Pessoas': ['255,126,182', '236,72,153', '244,114,182'],
}
const COR_PADRAO = '203,213,225'

// Conhecimento total do agente = prompt + documentos extraídos.
// Mais conhecimento -> mais neurônios (mín 5, máx 28).
function conhecimentoDoAgente(a: AgenteViz): number {
  const prompt = a.prompt && a.prompt.length > 0 ? a.prompt.length : (a.nome + a.descricao).length
  const docs = a.docs_chars ?? 0
  return prompt + docs
}

function neuroniosDoAgente(a: AgenteViz): number {
  const base = conhecimentoDoAgente(a)
  // /45 pro prompt dar o grosso; docs (milhares de chars) empurram pro teto suavemente
  const n = Math.round(4 + Math.min(base, 400) / 45 + Math.max(0, base - 400) / 1200)
  return Math.max(5, Math.min(28, n))
}

export function CerebroNeural({
  agentes,
  onAgenteClick,
}: {
  agentes: AgenteViz[]
  onAgenteClick?: (a: AgenteViz) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cbRef = useRef(onAgenteClick)
  cbRef.current = onAgenteClick

  // Inclui o conhecimento (prompt+docs) na chave: mudou -> rebuild
  const chave = agentes
    .map((a) => `${a.id}:${a.perspectiva}:${conhecimentoDoAgente(a)}`)
    .join('|')

  useEffect(() => {
    const wrap = wrapRef.current
    const cv = canvasRef.current
    if (!wrap || !cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let W = 0
    let H = 0
    let DPR = 1
    let mx = 0
    let my = 0
    let cmx = 0
    let cmy = 0
    const MAXSHIFT = 16

    const rand = (a: number, b: number) => a + Math.random() * (b - a)
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

    const sprites: Record<string, HTMLCanvasElement> = {}
    const makeSprite = (col: string) => {
      const s = document.createElement('canvas')
      s.width = 128
      s.height = 128
      const g = s.getContext('2d')
      if (g) {
        const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
        grd.addColorStop(0, 'rgba(' + col + ',0.9)')
        grd.addColorStop(0.25, 'rgba(' + col + ',0.45)')
        grd.addColorStop(1, 'rgba(' + col + ',0)')
        g.fillStyle = grd
        g.fillRect(0, 0, 128, 128)
      }
      return s
    }

    const N = Math.max(1, agentes.length)
    const margin = 0.1
    const vis = clamp(1.7 - N * 0.045, 0.6, 1.7)

    const minDist = clamp(0.62 / Math.sqrt(N), 0.08, 0.34)
    const colocados: { x: number; y: number }[] = []
    const colocar = () => {
      for (let attempt = 0; attempt < 60; attempt++) {
        const x = margin + Math.random() * (1 - 2 * margin)
        const y = margin + Math.random() * (1 - 2 * margin)
        let ok = true
        for (const p of colocados) {
          const dx = x - p.x
          const dy = y - p.y
          if (Math.sqrt(dx * dx + dy * dy) < minDist) {
            ok = false
            break
          }
        }
        if (ok) {
          colocados.push({ x, y })
          return { x, y }
        }
      }
      const f = { x: margin + Math.random() * (1 - 2 * margin), y: margin + Math.random() * (1 - 2 * margin) }
      colocados.push(f)
      return f
    }

    const clusters: Cluster[] = agentes.map((a, i) => {
      const tons = CORES[a.perspectiva] ?? [COR_PADRAO]
      const col = tons[i % tons.length]
      const n = neuroniosDoAgente(a)
      const pos = colocar()
      return {
        x: pos.x,
        y: pos.y,
        n,
        r: (0.05 + (n / 28) * 0.05) * vis,
        col,
      }
    })

    const coresUsadas = new Set<string>(clusters.map((c) => c.col))
    coresUsadas.add('255,255,255')
    coresUsadas.forEach((c) => (sprites[c] = makeSprite(c)))

    let neurons: Neuron[] = []
    let edges: Edge[] = []
    let pulses: Pulse[] = []

    const mkNeuron = (cx: number, cy: number, hub: boolean, col: string, depth: number): Neuron => ({
      cx,
      cy,
      hub,
      col,
      depth,
      phase: rand(0, 6.28),
      dphx: rand(0, 6.28),
      dphy: rand(0, 6.28),
      dspx: rand(0.4, 0.95),
      dspy: rand(0.4, 0.95),
      damp: rand(3, 7),
      _x: 0,
      _y: 0,
      flash: 0,
    })

    const build = () => {
      neurons = []
      edges = []
      clusters.forEach((c) => {
        c._depth = rand(0.45, 1.3)
        const hub = neurons.length
        neurons.push(mkNeuron(c.x, c.y, true, c.col, c._depth))
        const idx: number[] = []
        for (let i = 0; i < c.n; i++) {
          const ang = rand(0, 6.28)
          const d = rand(0.28, 1.08) * c.r
          neurons.push(mkNeuron(c.x + Math.cos(ang) * d, c.y + Math.sin(ang) * d, false, c.col, c._depth))
          idx.push(neurons.length - 1)
        }
        idx.forEach((i) => edges.push({ a: hub, b: i, col: c.col }))
        for (let k = 0; k < Math.floor(c.n * 0.5); k++) {
          const i = idx[Math.floor(rand(0, idx.length))]
          const j = idx[Math.floor(rand(0, idx.length))]
          if (i !== j) edges.push({ a: i, b: j, col: c.col })
        }
        c._hub = hub
        c._idx = idx
      })
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          if (Math.random() < 0.35)
            edges.push({ a: clusters[i]._hub!, b: clusters[j]._hub!, inter: true })
        }
      }
      const extra = Math.min(24, clusters.length * 2)
      for (let k = 0; k < extra; k++) {
        const ca = clusters[Math.floor(rand(0, clusters.length))]
        const cb = clusters[Math.floor(rand(0, clusters.length))]
        if (ca === cb || !ca._idx || !cb._idx) continue
        edges.push({
          a: ca._idx[Math.floor(rand(0, ca._idx.length))],
          b: cb._idx[Math.floor(rand(0, cb._idx.length))],
          inter: true,
        })
      }
    }

    const resize = () => {
      DPR = Math.min(2, window.devicePixelRatio || 1)
      const r = wrap.getBoundingClientRect()
      W = r.width
      H = r.height
      cv.width = W * DPR
      cv.height = H * DPR
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }

    const onMove = (e: MouseEvent) => {
      const r = wrap.getBoundingClientRect()
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2
      my = ((e.clientY - r.top) / r.height - 0.5) * 2
    }

    const clusterEm = (x: number, y: number) => {
      const minDim = Math.min(W, H)
      for (let i = 0; i < clusters.length; i++) {
        const c = clusters[i]
        if (c._hub === undefined) continue
        const hub = neurons[c._hub]
        const dx = x - hub._x
        const dy = y - hub._y
        const raio = Math.max(38, c.r * minDim * 1.25)
        if (dx * dx + dy * dy <= raio * raio) return i
      }
      return -1
    }

    const onHover = (e: MouseEvent) => {
      const r = cv.getBoundingClientRect()
      const i = clusterEm(e.clientX - r.left, e.clientY - r.top)
      cv.style.cursor = i >= 0 ? 'pointer' : 'default'
    }

    const onClick = (e: MouseEvent) => {
      const r = cv.getBoundingClientRect()
      const i = clusterEm(e.clientX - r.left, e.clientY - r.top)
      if (i >= 0) {
        const c = clusters[i]
        if (c._hub !== undefined) neurons[c._hub].flash = 1
        cbRef.current?.(agentes[i])
      }
    }

    const spawn = () => {
      if (edges.length === 0 || pulses.length > 30) return
      const e = edges[Math.floor(Math.random() * edges.length)]
      const dir = Math.random() < 0.5
      pulses.push({ a: dir ? e.a : e.b, b: dir ? e.b : e.a, t: 0, speed: rand(0.006, 0.016) })
    }

    let last = performance.now()
    let acc = 0
    let raf = 0

    const frame = (now: number) => {
      const dt = Math.min(50, now - last)
      last = now
      acc += dt
      if (acc > 100) {
        acc = 0
        spawn()
        if (Math.random() < 0.6) spawn()
      }
      cmx += (mx - cmx) * 0.06
      cmy += (my - cmy) * 0.06
      const t = now / 1000

      neurons.forEach((n) => {
        const dx = Math.sin(t * n.dspx + n.dphx) * n.damp
        const dy = Math.cos(t * n.dspy + n.dphy) * n.damp
        n._x = n.cx * W + dx - cmx * MAXSHIFT * n.depth
        n._y = n.cy * H + dy - cmy * MAXSHIFT * n.depth
      })

      ctx.clearRect(0, 0, W, H)

      ctx.lineWidth = 0.6
      edges.forEach((e) => {
        const a = neurons[e.a]
        const b = neurons[e.b]
        ctx.beginPath()
        ctx.moveTo(a._x, a._y)
        ctx.lineTo(b._x, b._y)
        ctx.strokeStyle = e.inter ? 'rgba(255,255,255,0.06)' : 'rgba(' + e.col + ',0.22)'
        ctx.stroke()
      })

      ctx.globalCompositeOperation = 'lighter'

      neurons.forEach((n) => {
        const breathe = 0.5 + 0.5 * Math.sin(t * 2.0 + n.phase)
        const gd = ((n.hub ? 42 : 19) * vis) * (0.85 + breathe * 0.3) + n.flash * 22
        ctx.globalAlpha = (n.hub ? 0.8 : 0.55) + n.flash * 0.4
        ctx.drawImage(sprites[n.col], n._x - gd / 2, n._y - gd / 2, gd, gd)
      })

      ctx.globalAlpha = 1
      neurons.forEach((n) => {
        const core = ((n.hub ? 2.7 : 1.5) * vis) + n.flash * 2
        ctx.beginPath()
        ctx.arc(n._x, n._y, core, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(' + n.col + ',0.95)'
        ctx.fill()
        n.flash *= 0.93
        if (n.flash < 0.01) n.flash = 0
      })

      pulses.forEach((p) => {
        p.t += p.speed * (dt / 16.7)
        const a = neurons[p.a]
        const b = neurons[p.b]
        const x = a._x + (b._x - a._x) * p.t
        const y = a._y + (b._y - a._y) * p.t
        ctx.globalAlpha = 0.9
        ctx.drawImage(sprites['255,255,255'], x - 7, y - 7, 14, 14)
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.arc(x, y, 1.8, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.fill()
        if (p.t >= 1) neurons[p.b].flash = 1
      })

      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      pulses = pulses.filter((p) => p.t < 1)

      raf = requestAnimationFrame(frame)
    }

    resize()
    build()
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMove)
    cv.addEventListener('mousemove', onHover)
    cv.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      cv.removeEventListener('mousemove', onHover)
      cv.removeEventListener('click', onClick)
    }
  }, [chave])

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: 'block' }} />
    </div>
  )
}

