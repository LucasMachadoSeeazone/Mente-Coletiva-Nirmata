'use client'

import { AGENTES_CONFIG, PERSPECTIVAS } from '@/lib/agentes/config'

interface AgentResponse {
  agente_id: number
  concorda: boolean
  confianca: number
}

interface AgentePanelProps {
  respostas?: AgentResponse[]
  loading?: boolean
}

export function AgentesPanel({ respostas = [], loading = false }: AgentePanelProps) {
  const getAgentResponse = (agenteId: number) => {
    return respostas.find((r) => r.agente_id === agenteId)
  }

  const groupedAgentes = AGENTES_CONFIG.reduce(
    (acc, agent) => {
      const perspectiva = agent.perspectiva
      if (!acc[perspectiva]) {
        acc[perspectiva] = []
      }
      acc[perspectiva].push(agent)
      return acc
    },
    {} as Record<string, typeof AGENTES_CONFIG>
  )

  return (
    <div className=\"space-y-6\">
      <h2 className=\"text-xl font-semibold\">🤖 Os 12 Agentes</h2>

      {Object.entries(groupedAgentes).map(([perspectiva, agents]) => (
        <div key={perspectiva} className=\"space-y-3\">
          <h3 className=\"text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide\">
            {perspectiva}
          </h3>

          <div className=\"grid grid-cols-1 gap-2\">
            {agents.map((agent) => {
              const response = getAgentResponse(agent.id)
              const hasResponse = !!response

              return (
                <div
                  key={agent.id}
                  className={\p-3 rounded-lg border \\}
                >
                  <div className=\"flex items-start justify-between gap-2\">
                    <div className=\"flex items-start gap-2 flex-1\">
                      <span className=\"text-lg\">{agent.emoji}</span>
                      <div className=\"min-w-0\">
                        <p className=\"text-sm font-semibold text-slate-900 dark:text-slate-100\">
                          {agent.nome}
                        </p>
                        <p className=\"text-xs text-slate-600 dark:text-slate-400 truncate\">
                          {agent.descricao}
                        </p>
                      </div>
                    </div>

                    {hasResponse && (
                      <div className=\"text-right\">
                        <p className=\"text-lg font-bold\">
                          {response.concorda ? '✅' : '❌'}
                        </p>
                        <p className=\"text-xs text-slate-600 dark:text-slate-400\">
                          {response.confianca}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {loading && (
        <div className=\"p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg text-center text-sm text-blue-800 dark:text-blue-200\">
          Agentes analisando...
        </div>
      )}
    </div>
  )
}
