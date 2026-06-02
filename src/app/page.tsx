'use client'
 
import { useEffect, useRef } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/client'
 
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
type Cluster = {
  x: number
  y: number
  n: number
  r: number
  _depth?: number
  _hub?: number
  _idx?: number[]
}
 
export default function HomePage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
 
  useEffect(() => {
    const stage = stageRef.current
    const cv = canvasRef.current
    if (!stage || !cv) return
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
 
    const PALETTE = [
      '240,92,92',
      '79,124,255',
      '255,126,182',
      '56,189,248',
      '255,122,89',
      '124,108,240',
      '203,213,225',
    ]
 
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
    PALETTE.forEach((c) => (sprites[c] = makeSprite(c)))
    sprites['white'] = makeSprite('255,255,255')
 
    const clusters: Cluster[] = [
      { x: 0.14, y: 0.30, n: 16, r: 0.085 },
      { x: 0.42, y: 0.17, n: 22, r: 0.10 },
      { x: 0.76, y: 0.25, n: 18, r: 0.092 },
      { x: 0.35, y: 0.56, n: 18, r: 0.10 },
      { x: 0.87, y: 0.60, n: 14, r: 0.08 },
      { x: 0.16, y: 0.82, n: 11, r: 0.07 },
      { x: 0.57, y: 0.83, n: 18, r: 0.092 },
    ]
 
    let neurons: Neuron[] = []
    let edges: Edge[] = []
    let pulses: Pulse[] = []
 
    const rand = (a: number, b: number) => a + Math.random() * (b - a)
 
    const mkNeuron = (
      cx: number,
      cy: number,
      hub: boolean,
      col: string,
      depth: number
    ): Neuron => ({
      cx,
      cy,
      hub,
      col,
      depth,
      phase: rand(0, 6.28),
      dphx: rand(0, 6.28),
      dphy: rand(0, 6.28),
      dspx: rand(0.25, 0.6),
      dspy: rand(0.25, 0.6),
      damp: rand(2, 5.5),
      _x: 0,
      _y: 0,
      flash: 0,
    })
 
    const build = () => {
      neurons = []
      edges = []
      clusters.forEach((c, ci) => {
        const col = PALETTE[ci % PALETTE.length]
        c._depth = rand(0.45, 1.3)
        const hub = neurons.length
        neurons.push(mkNeuron(c.x, c.y, true, col, c._depth))
        const idx: number[] = []
        for (let i = 0; i < c.n; i++) {
          const ang = rand(0, 6.28)
          const d = rand(0.32, 1) * c.r
          neurons.push(
            mkNeuron(c.x + Math.cos(ang) * d, c.y + Math.sin(ang) * d, false, col, c._depth)
          )
          idx.push(neurons.length - 1)
        }
        idx.forEach((i) => edges.push({ a: hub, b: i, col }))
        for (let k = 0; k < Math.floor(c.n * 0.5); k++) {
          const i = idx[Math.floor(rand(0, idx.length))]
          const j = idx[Math.floor(rand(0, idx.length))]
          if (i !== j) edges.push({ a: i, b: j, col })
        }
        c._hub = hub
        c._idx = idx
      })
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          if (Math.random() < 0.55)
            edges.push({ a: clusters[i]._hub!, b: clusters[j]._hub!, inter: true })
        }
      }
      for (let k = 0; k < 20; k++) {
        const ca = clusters[Math.floor(rand(0, clusters.length))]
        const cb = clusters[Math.floor(rand(0, clusters.length))]
        if (ca === cb) continue
        edges.push({
          a: ca._idx![Math.floor(rand(0, ca._idx!.length))],
          b: cb._idx![Math.floor(rand(0, cb._idx!.length))],
          inter: true,
        })
      }
    }
 
    const resize = () => {
      DPR = Math.min(2, window.devicePixelRatio || 1)
      const r = stage.getBoundingClientRect()
      W = r.width
      H = r.height
      cv.width = W * DPR
      cv.height = H * DPR
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
 
    const onMove = (e: MouseEvent) => {
      const r = stage.getBoundingClientRect()
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2
      my = ((e.clientY - r.top) / r.height - 0.5) * 2
    }
    const onLeave = () => {
      mx = 0
      my = 0
    }
 
    const spawn = () => {
      if (edges.length === 0 || pulses.length > 28) return
      const e = edges[Math.floor(Math.random() * edges.length)]
      const dir = Math.random() < 0.5
      pulses.push({
        a: dir ? e.a : e.b,
        b: dir ? e.b : e.a,
        t: 0,
        speed: rand(0.005, 0.013),
      })
    }
 
    let last = performance.now()
    let acc = 0
    let raf = 0
 
    const frame = (now: number) => {
      const dt = Math.min(50, now - last)
      last = now
      acc += dt
      if (acc > 120) {
        acc = 0
        spawn()
        if (Math.random() < 0.5) spawn()
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
        const breathe = 0.5 + 0.5 * Math.sin(t * 1.4 + n.phase)
        const gd = (n.hub ? 40 : 18) * (0.85 + breathe * 0.3) + n.flash * 22
        ctx.globalAlpha = (n.hub ? 0.8 : 0.55) + n.flash * 0.4
        ctx.drawImage(sprites[n.col], n._x - gd / 2, n._y - gd / 2, gd, gd)
      })
 
      ctx.globalAlpha = 1
      neurons.forEach((n) => {
        const core = (n.hub ? 2.6 : 1.4) + n.flash * 2
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
        ctx.drawImage(sprites['white'], x - 7, y - 7, 14, 14)
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
    stage.addEventListener('mousemove', onMove)
    stage.addEventListener('mouseleave', onLeave)
 
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      stage.removeEventListener('mousemove', onMove)
      stage.removeEventListener('mouseleave', onLeave)
    }
  }, [])
 
  const handleLogin = async () => {
    const supabase = createBrowserSupabase()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: 'seazone.com.br', prompt: 'select_account' },
      },
    })
  }
 
  return (
    <div
      ref={stageRef}
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 50% 40%, #0a0a12 0%, #020203 65%, #000000 100%)',
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />
 
      <div className="relative z-10 w-full max-w-sm px-4">
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'rgba(8,8,12,0.55)',
            border: '1px solid rgba(79,124,255,0.18)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-5">
            <img
              src="/logo-seazone.png"
              alt="Seazone"
              style={{ width: 36, height: 36, objectFit: 'contain' }}
            />
            <h1
              className="text-3xl font-bold"
              style={{
                background: 'linear-gradient(90deg,#7dd3fc,#3b82f6,#1d4ed8)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Nirmata
            </h1>
          </div>
 
          <button
            type="button"
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-medium py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg whitespace-nowrap"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.5 13.2l7.9 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.8-9.9 6.8-17.4z" />
              <path fill="#FBBC05" d="M10.4 28.3c-.5-1.4-.7-2.9-.7-4.3s.3-2.9.7-4.3l-7.9-6.1C.9 16.7 0 20.2 0 24s.9 7.3 2.5 10.4l7.9-6.1z" />
              <path fill="#34A853" d="M24 48c6.3 0 11.6-2.1 15.5-5.6l-7.4-5.7c-2.1 1.4-4.8 2.2-8.1 2.2-6.4 0-11.7-3.7-13.6-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
            </svg>
            Continuar com Google
          </button>
        </div>
      </div>
 
      <p
        className="absolute bottom-3 right-4 text-xs"
        style={{ color: 'rgba(148,163,184,0.35)' }}
      >
        Criado por: Lucas Machado — Time de Dados
      </p>
    </div>
  )
}
