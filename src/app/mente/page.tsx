'use client'

import { useEffect, useState } from 'react'
import { ChatBox } from '@/components/ChatBox'
import { CerebroNeural, type AgenteViz } from '@/components/CerebroNeural'
import { AGENTES_CONFIG } from '@/lib/agentes/config'

interface AgentResponse {
  id: number
  nome: string
  emoji: string
  perspectiva: string
  pensamento: string
  concorda: boolean
  confianca: number
}

type Agente = {
  id: number
  nome: string
  descricao: string
  emoji?: string
  perspectiva: string
  ativo?: boolean
  ordem?: number
  prompt?: string
  docs_chars?: number
}

type Documento = {
  id: string
  nome_arquivo: string
  tipo: string | null
  tamanho_bytes: number | null
  status: string | null
}

const PERSPECTIVAS = ['Análise', 'Estratégia', 'Risco', 'Pessoas']

const FALLBACK: Agente[] = AGENTES_CONFIG.filter((a) => a.ativo).map((a) => ({ ...a }))

const painelStyle: React.CSSProperties = {
  background: 'rgba(8,8,12,0.5)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
}

function formatarTamanho(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function labelStatus(s: string | null): string {
  if (s === 'extraido') return 'texto extraído ✓'
  if (s === 'pendente') return 'processando...'
  if (s === 'nao_suportado') return 'tipo não suportado'
  if (s === 'vazio') return 'sem texto'
  return s ?? ''
}

export default function MentePage() {
  const [, setAgentesRespostas] = useState<AgentResponse[]>([])
  const [agentes, setAgentes] = useState<Agente[]>(FALLBACK)
  const [agenteSel, setAgenteSel] = useState<Agente | null>(null)
  const [modoNovo, setModoNovo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ nome: '', descricao: '', perspectiva: 'Análise', prompt: '' })

  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [enviandoDoc, setEnviandoDoc] = useState(false)
  const [docVisualizando, setDocVisualizando] = useState<{ nome: string; texto: string } | null>(null)
  const [carregandoConteudo, setCarregandoConteudo] = useState(false)

  const carregarAgentes = () => {
    fetch('/api/agentes')
      .then((r) => r.json())
      .then((d) => {
        if (d.agentes) setAgentes(d.agentes)
      })
      .catch(() => {})
  }

  const carregarDocumentos = (agenteId: number) => {
    fetch('/api/agente-documentos?agente_id=' + agenteId)
      .then((r) => r.json())
      .then((d) => setDocumentos(d.documentos ?? []))
      .catch(() => setDocumentos([]))
  }

  useEffect(() => {
    carregarAgentes()
  }, [])

  useEffect(() => {
    if (agenteSel) {
      setForm({
        nome: agenteSel.nome,
        descricao: agenteSel.descricao,
        perspectiva: agenteSel.perspectiva,
        prompt: agenteSel.prompt ?? '',
      })
      if (!modoNovo && agenteSel.id > 0) {
        carregarDocumentos(agenteSel.id)
      } else {
        setDocumentos([])
      }
    }
  }, [agenteSel, modoNovo])

  const handleNovaResposta = (a: AgentResponse[]) => setAgentesRespostas(a)

  const abrirAgente = (a: AgenteViz) => {
    const full = agentes.find((x) => x.id === a.id) ?? null
    setModoNovo(false)
    setAgenteSel(full)
  }
  const abrirNovo = () => {
    setModoNovo(true)
    setAgenteSel({ id: -1, nome: '', descricao: '', perspectiva: 'Análise', prompt: '' })
  }
  const fechar = () => {
    setAgenteSel(null)
    setModoNovo(false)
    setDocumentos([])
    setDocVisualizando(null)
  }

  const salvar = async () => {
    if (!form.nome.trim()) {
      alert('Dá um nome pro agente antes de salvar 🙂')
      return
    }
    setSalvando(true)
    try {
      if (modoNovo) {
        await fetch('/api/agentes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        await fetch('/api/agentes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: agenteSel?.id, ...form }),
        })
      }
      carregarAgentes()
      fechar()
    } catch {
      alert('Erro ao salvar. Tenta de novo.')
    } finally {
      setSalvando(false)
    }
  }

  const remover = async () => {
    if (!agenteSel || modoNovo) return
    if (!confirm(`Remover o agente "${agenteSel.nome}" de vez? Essa ação não tem volta.`)) return
    setSalvando(true)
    try {
      await fetch(`/api/agentes?id=${agenteSel.id}`, { method: 'DELETE' })
      carregarAgentes()
      fechar()
    } catch {
      alert('Erro ao remover. Tenta de novo.')
    } finally {
      setSalvando(false)
    }
  }

  const enviarDocumento = async (file: File) => {
    if (!agenteSel || agenteSel.id <= 0) return
    setEnviandoDoc(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('agente_id', String(agenteSel.id))
      const r = await fetch('/api/agente-documentos', { method: 'POST', body: fd })
      const d = await r.json()
      if (d.erro) {
        alert('Erro ao enviar: ' + d.erro)
      } else {
        carregarDocumentos(agenteSel.id)
        if (d.documento?.id) {
          const re = await fetch('/api/extrair-documento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documento_id: d.documento.id }),
          })
          const rd = await re.json()
          if (rd.erro) console.warn('Extração:', rd.erro)
          carregarDocumentos(agenteSel.id)
          carregarAgentes() // bolha cresce com o novo conhecimento
        }
      }
    } catch {
      alert('Erro ao enviar o documento.')
    } finally {
      setEnviandoDoc(false)
    }
  }

  const removerDocumento = async (id: string) => {
    if (!confirm('Remover este documento? O agente vai "esquecer" esse conteúdo.')) return
    try {
      await fetch('/api/agente-documentos?id=' + id, { method: 'DELETE' })
      if (agenteSel) carregarDocumentos(agenteSel.id)
      carregarAgentes() // bolha encolhe (agente "esqueceu")
    } catch {
      alert('Erro ao remover o documento.')
    }
  }

  const verConteudo = async (doc: Documento) => {
    if (doc.status !== 'extraido') {
      alert('Este documento ainda não tem texto extraído.')
      return
    }
    setCarregandoConteudo(true)
    try {
      const r = await fetch('/api/agente-documentos?id=' + doc.id + '&conteudo=1')
      const d = await r.json()
      setDocVisualizando({
        nome: doc.nome_arquivo,
        texto: d.documento?.conteudo_extraido ?? '(vazio)',
      })
    } catch {
      alert('Erro ao carregar o conteúdo.')
    } finally {
      setCarregandoConteudo(false)
    }
  }

  return (
    <div
      className="relative h-screen w-full flex flex-col overflow-hidden text-slate-100"
      style={{ background: 'radial-gradient(circle at 50% 40%, #0a0a12 0%, #020203 65%, #000000 100%)' }}
    >
      {/* Barra do topo */}
      <header className="border-b" style={{ ...painelStyle, borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-seazone.png" alt="Seazone" style={{ width: 26, height: 26, objectFit: 'contain' }} />
            <h1
              className="text-xl font-bold"
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
          <span
            className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-md"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            online
          </span>
        </div>
      </header>

      {/* Corpo */}
      <div className="flex-1 min-h-0 grid grid-cols-[260px_1fr_320px] gap-4 p-4">
        {/* ESQUERDA — Métricas */}
        <aside className="rounded-2xl p-4 overflow-auto" style={painelStyle}>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <span>📊</span> Métricas
          </div>
          <p className="text-xs text-slate-500">Agentes ativos</p>
          <p className="text-2xl font-semibold mb-3">{agentes.length}</p>
          <p className="text-xs text-slate-500">Confiança de decisão</p>
          <p className="text-2xl font-semibold mb-4" style={{ color: '#60a5fa' }}>
            92%<span className="text-xs text-slate-500 font-normal ml-2">· futuro</span>
          </p>
          <p className="text-xs text-slate-400 mb-2">Fontes de dados</p>
          <div className="flex flex-col gap-2 text-sm text-slate-300">
            {['Data Lake', 'NEKT', 'Supabase / SeaMir', 'Slack', 'Email', 'Reuniões'].map((f) => (
              <div key={f} className="flex items-center justify-between">
                <span>{f}</span>
                <span className="text-xs text-slate-600">futuro</span>
              </div>
            ))}
          </div>
        </aside>

        {/* CENTRO — Cérebro */}
        <section className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <CerebroNeural agentes={agentes} onAgenteClick={abrirAgente} />
          <div className="absolute top-3 left-4 z-10 text-sm text-slate-400 pointer-events-none">
            Cérebro · {agentes.length} agentes
          </div>
          <button
            type="button"
            onClick={abrirNovo}
            className="absolute top-3 right-4 z-10 inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(96,165,250,0.18)', color: '#bfdbfe', border: '1px solid rgba(96,165,250,0.35)', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Agente
          </button>
        </section>

        {/* DIREITA — Atividade + Chat */}
        <aside className="flex flex-col gap-4 min-h-0">
          <div className="rounded-2xl p-4 overflow-auto flex-shrink-0" style={painelStyle}>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
              <span>📡</span> Atividade <span className="text-xs text-slate-600">· futuro</span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { i: '💬', t: 'Slack · decisão registrada' },
                { i: '📄', t: 'Documento ingerido' },
                { i: '⚠️', t: 'Consenso atingido' },
                { i: '🧠', t: 'Simulação concluída' },
              ].map((ev, k) => (
                <div
                  key={k}
                  className="rounded-lg p-2 text-xs text-slate-300"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="mr-2">{ev.i}</span>
                  {ev.t}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4 flex-1 min-h-0 flex flex-col" style={painelStyle}>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-3 flex-shrink-0">
              <span>💬</span> Chat
            </div>
            <div className="flex-1 min-h-0">
              <ChatBox onNovaResposta={handleNovaResposta} />
            </div>
          </div>
        </aside>
      </div>

      {/* Painel lateral do agente */}
      {agenteSel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={fechar} />
          <div
            className="relative h-full w-[400px] p-6 overflow-auto"
            style={{
              background: 'rgba(10,10,16,0.92)',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{modoNovo ? '✨' : agenteSel.emoji ?? '🧠'}</span>
                <h2 className="text-lg font-semibold">{modoNovo ? 'Novo agente' : 'Editar agente'}</h2>
              </div>
              <button type="button" onClick={fechar} className="text-slate-400 hover:text-slate-200" style={{ cursor: 'pointer', fontSize: 20 }}>
                ✕
              </button>
            </div>

            <label className="block text-xs text-slate-400 mb-1">Nome</label>
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full mb-4 px-3 py-2 rounded-lg text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
            />

            <label className="block text-xs text-slate-400 mb-1">Descrição (legenda curta)</label>
            <input
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full mb-4 px-3 py-2 rounded-lg text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
            />

            <label className="block text-xs text-slate-400 mb-1">
              Prompt / Instruções <span className="text-slate-600">(como o agente pensa e age)</span>
            </label>
            <textarea
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              rows={8}
              className="w-full mb-1 px-3 py-2 rounded-lg text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', lineHeight: 1.5 }}
            />
            <p className="text-xs text-slate-600 mb-4">{form.prompt.length} caracteres · quanto maior, mais "neurônios" o agente terá</p>

            <label className="block text-xs text-slate-400 mb-1">Perspectiva</label>
            <select
              value={form.perspectiva}
              onChange={(e) => setForm({ ...form, perspectiva: e.target.value })}
              className="w-full mb-6 px-3 py-2 rounded-lg text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
            >
              {PERSPECTIVAS.map((p) => (
                <option key={p} value={p} style={{ color: '#000' }}>
                  {p}
                </option>
              ))}
            </select>

            {/* Documentos do agente */}
            <div className="mb-6">
              <label className="block text-xs text-slate-400 mb-2">
                Documentos <span className="text-slate-600">(PDF, Word, Excel, CSV)</span>
              </label>

              {modoNovo || !agenteSel || agenteSel.id <= 0 ? (
                <p className="text-xs text-slate-600">Salve o agente primeiro pra poder anexar documentos.</p>
              ) : (
                <>
                  <label
                    className="flex items-center justify-center gap-2 w-full py-2 mb-3 rounded-lg text-sm cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', color: '#cbd5e1' }}
                  >
                    {enviandoDoc ? 'Enviando e lendo...' : '+ Anexar documento'}
                    <input
                      type="file"
                      hidden
                      disabled={enviandoDoc}
                      accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.txt"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) enviarDocumento(f)
                        e.target.value = ''
                      }}
                    />
                  </label>

                  {documentos.length === 0 ? (
                    <p className="text-xs text-slate-600">Nenhum documento anexado ainda.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {documentos.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <button
                            type="button"
                            onClick={() => verConteudo(doc)}
                            className="min-w-0 text-left flex-1"
                            style={{ cursor: doc.status === 'extraido' ? 'pointer' : 'default', background: 'none', border: 'none', padding: 0 }}
                            title={doc.status === 'extraido' ? 'Clique pra ver o que o agente sabe deste documento' : ''}
                          >
                            <p className="truncate text-slate-200 hover:text-blue-300">{doc.nome_arquivo}</p>
                            <p className="text-slate-500">
                              {formatarTamanho(doc.tamanho_bytes)} · {labelStatus(doc.status)}
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => removerDocumento(doc.id)}
                            className="text-slate-500 hover:text-red-400 flex-shrink-0"
                            style={{ cursor: 'pointer', fontSize: 16, background: 'none', border: 'none' }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={salvar}
                disabled={salvando}
                className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: 'rgba(96,165,250,0.25)', color: '#dbeafe', border: '1px solid rgba(96,165,250,0.45)', cursor: 'pointer' }}
              >
                {salvando ? 'Salvando...' : modoNovo ? 'Criar agente' : 'Salvar'}
              </button>
              {!modoNovo && (
                <button
                  type="button"
                  onClick={remover}
                  disabled={salvando}
                  className="py-2 px-3 rounded-lg text-sm disabled:opacity-50"
                  style={{ background: 'rgba(240,92,92,0.15)', color: '#fca5a5', border: '1px solid rgba(240,92,92,0.35)', cursor: 'pointer' }}
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: conteúdo extraído (o que o agente "sabe" deste documento) */}
      {docVisualizando && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setDocVisualizando(null)} />
          <div
            className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl p-6 flex flex-col"
            style={{
              background: 'rgba(12,12,18,0.97)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate">📄 {docVisualizando.nome}</h3>
                <p className="text-xs text-slate-500">O que o agente sabe deste documento (texto extraído)</p>
              </div>
              <button
                type="button"
                onClick={() => setDocVisualizando(null)}
                className="text-slate-400 hover:text-slate-200 flex-shrink-0 ml-4"
                style={{ cursor: 'pointer', fontSize: 20, background: 'none', border: 'none' }}
              >
                ✕
              </button>
            </div>
            <div
              className="flex-1 min-h-0 overflow-auto rounded-lg p-4 text-xs text-slate-300 whitespace-pre-wrap"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', lineHeight: 1.6 }}
            >
              {carregandoConteudo ? 'Carregando...' : docVisualizando.texto}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
