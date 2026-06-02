'use client'

import { useState } from 'react'

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

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/conversa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta: input }),
      })

      const data = await response.json()

      console.log("📥 Resposta da API:", data)
      console.log("📊 Agentes recebidos:", data.agentes?.length || 0)

      if (onNovaResposta && data.agentes) {
        console.log("🔔 Chamando callback com agentes:", data.agentes.length)
        onNovaResposta(data.agentes)
      } else {
        console.log("⚠️ Callback não chamado ou sem agentes")
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.resposta_final || 'Erro ao processar',
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Erro:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Erro ao conectar com a API',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-96 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 pt-10">
            Comece uma conversa com os agentes...
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">Agentes pensando...</p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Digite sua pergunta..."
            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors text-sm font-semibold"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
