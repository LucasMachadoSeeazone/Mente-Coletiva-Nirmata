'use client'

import { useEffect, useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AgentResponse {
  id: number
  nome: string
  emoji: string
  perspectiva: string
  pensamento: string
  concorda: boolean
  confianca: number
}

interface ChatBoxProps {
  onNovaResposta?: (agentes: AgentResponse[]) => void
}

export function ChatBox({ onNovaResposta }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversaId, setConversaId] = useState<string | null>(null)

  // Carrega a conversa salva ao abrir
  useEffect(() => {
    fetch('/api/historico')
      .then((r) => r.json())
      .then((d) => {
        if (d.conversa_id) setConversaId(d.conversa_id)
        if (d.mensagens) setMessages(d.mensagens)
      })
      .catch(() => {})
  }, [])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const perguntaAtual = input
    const userMessage: Message = { role: 'user', content: perguntaAtual }
    const historico = messages // conversa até agora (janela deslizante usa isso)
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/conversa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta: perguntaAtual, historico, conversa_id: conversaId }),
      })

      const data = await response.json()

      if (onNovaResposta && data.agentes) {
        onNovaResposta(data.agentes)
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.resposta_final || 'Erro ao processar' }])
    } catch (error) {
      console.error('Erro:', error)
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Erro ao conectar com a API' }])
    } finally {
      setLoading(false)
    }
  }

  const novaConversa = async () => {
    if (messages.length > 0 && !confirm('Começar uma nova conversa? A atual continua salva no histórico.')) return
    try {
      const r = await fetch('/api/historico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'nova' }),
      })
      const d = await r.json()
      if (d.conversa_id) {
        setConversaId(d.conversa_id)
        setMessages([])
      }
    } catch {
      alert('Erro ao criar nova conversa.')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end mb-2 flex-shrink-0">
        <button
          type="button"
          onClick={novaConversa}
          className="text-xs text-slate-400 hover:text-slate-200"
          style={{ cursor: 'pointer', background: 'none', border: 'none' }}
        >
          + Nova conversa
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-slate-500 text-sm px-2">
            Comece uma conversa com os agentes...
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap"
                style={
                  msg.role === 'user'
                    ? { background: 'rgba(59,130,246,0.9)', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-lg text-sm text-slate-400" style={{ background: 'rgba(255,255,255,0.08)' }}>
              Agentes pensando...
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Digite sua pergunta..."
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ background: 'rgba(59,130,246,0.9)', color: '#fff', cursor: 'pointer' }}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
