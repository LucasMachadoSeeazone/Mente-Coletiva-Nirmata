import { RespostaAgente } from "./parseRespostasAgentes"
import { Agent, AGENTES_CONFIG } from "./agentes/config"

export interface RespostaPorPerspectiva {
  sim: number
  nao: number
  talvez: number
}

export interface RespostaConsolidada {
  resposta_final: string
  consenso: number
  por_perspectiva: {
    [key: string]: RespostaPorPerspectiva
  }
  agentes: Array<{
    id: number
    nome: string
    emoji: string
    perspectiva: string
    pensamento: string
    concorda: boolean
    confianca: number
  }>
}

function normalizarPerspectiva(perspectiva: string): string {
  return perspectiva.toLowerCase().replace(/[àáâãäå]/g, "a").replace(/[èéêë]/g, "e").replace(/[ìíîï]/g, "i").replace(/[òóôõö]/g, "o").replace(/[ùúûü]/g, "u")
}

export function consolidarRespostas(
  respostasAgentes: Map<number, RespostaAgente>,
  agentesConfig: Agent[]
): RespostaConsolidada {
  const por_perspectiva: { [key: string]: RespostaPorPerspectiva } = {
    analise: { sim: 0, nao: 0, talvez: 0 },
    estrategia: { sim: 0, nao: 0, talvez: 0 },
    risco: { sim: 0, nao: 0, talvez: 0 },
    pessoas: { sim: 0, nao: 0, talvez: 0 },
  }

  const agentes_processados: any[] = []
  let totalSim = 0
  let totalNao = 0
  let totalTalvez = 0

  agentesConfig.forEach((agente) => {
    const resposta = respostasAgentes.get(agente.id)
    if (!resposta) return

    const concorda = resposta.conclusao === "SIM"
    const perspectiva_normalizada = normalizarPerspectiva(agente.perspectiva)

    if (!por_perspectiva[perspectiva_normalizada]) {
      por_perspectiva[perspectiva_normalizada] = { sim: 0, nao: 0, talvez: 0 }
    }

    if (resposta.conclusao === "SIM") {
      por_perspectiva[perspectiva_normalizada].sim++
      totalSim++
    } else if (resposta.conclusao === "NAO") {
      por_perspectiva[perspectiva_normalizada].nao++
      totalNao++
    } else {
      por_perspectiva[perspectiva_normalizada].talvez++
      totalTalvez++
    }

    agentes_processados.push({
      id: agente.id,
      nome: agente.nome,
      emoji: agente.emoji,
      perspectiva: agente.perspectiva,
      pensamento: resposta.pensamento,
      concorda,
      confianca: resposta.confianca,
    })
  })

  const total = totalSim + totalNao + totalTalvez
  const consenso = total > 0 ? Math.round((totalSim / total) * 100) : 0

  const resposta_final = `## Analise do Nirmata

**Consenso:** ${consenso}% dos agentes concordam

### Perspectivas:
- Analise: ${por_perspectiva.analise.sim}/${total} concordam
- Estrategia: ${por_perspectiva.estrategia.sim}/${total} concordam
- Risco: ${por_perspectiva.risco.sim}/${total} concordam
- Pessoas: ${por_perspectiva.pessoas.sim}/${total} concordam`

  return {
    resposta_final,
    consenso,
    por_perspectiva,
    agentes: agentes_processados,
  }
}
