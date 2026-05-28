'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // TODO: Call /api/conversa
      const response = await fetch('/api/conversa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta: input }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.resposta_final || 'Erro ao processar',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Erro:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua pergunta.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className=\"flex flex-col h-96 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700\">
      {/* Messages */}
      <div className=\"flex-1 overflow-y-auto p-4 space-y-4\">
        {messages.length === 0 ? (
          <div className=\"h-full flex items-center justify-center text-slate-500\">
            <p>Comece uma conversa com Nirmata</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={\lex \\}
              >
                <div
                  className={\max-w-xs px-4 py-2 rounded-lg \\}
                >
                  <p className=\"text-sm\">{msg.content}</p>
                  <span className=\"text-xs opacity-70 mt-1 block\">
                    {msg.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className=\"flex justify-start\">
                <div className=\"bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg\">
                  <p className=\"text-sm text-slate-600 dark:text-slate-400\">
                    Nirmata está pensando...
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className=\"border-t border-slate-200 dark:border-slate-700 p-4 flex gap-2\"
      >
        <input
          type=\"text\"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder=\"Faça uma pergunta...\"
          disabled={loading}
          className=\"flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50\"
        />
        <button
          type=\"submit\"
          disabled={loading || !input.trim()}
          className=\"px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors\"
        >
          {loading ? '...' : 'Enviar'}
        </button>
      </form>
    </div>
  )
}
