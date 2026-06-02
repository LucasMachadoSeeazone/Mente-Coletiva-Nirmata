'use client'

import { useState } from 'react'
import { ChatBox } from '@/components/ChatBox'
import { AgentesPanel } from '@/components/AgentesPanel'

interface AgentResponse {
  id: number
  nome: string
  emoji: string
  perspectiva: string
  pensamento: string
  concorda: boolean
  confianca: number
}

export default function MentePage() {
  const [agentesRespostas, setAgentesRespostas] = useState<AgentResponse[]>([])

  const handleNovaResposta = (agentes: AgentResponse[]) => {
    console.log("📌 Estado atualizado com agentes:", agentes.length)
    setAgentesRespostas(agentes)
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">🧠 Nirmata</h1>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Chat Section */}
        <div className="grid grid-cols-3 gap-8">
          {/* Chat Column */}
          <div className="col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">💬 Chat com Nirmata</h2>
            <ChatBox onNovaResposta={handleNovaResposta} />
          </div>

          {/* Agents Panel */}
          <div className="space-y-4">
            <AgentesPanel respostas={agentesRespostas} />
          </div>
        </div>

        {/* History */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">📋 Histórico</h2>
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6 h-40 flex items-center justify-center text-slate-500">
            Histórico de conversas virá aqui
          </div>
        </div>
      </main>
    </div>
  )
}
