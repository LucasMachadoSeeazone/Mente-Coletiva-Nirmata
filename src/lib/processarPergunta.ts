import { generateEmbedding } from "./embeddings"
import { chamarGemini } from "./gemini"
import { criarPromptAgente } from "./agentes/prompts"
import { parseRespostaAgente } from "./parseRespostasAgentes"
import { consolidarRespostas } from "./consolidarRespostas"
import { AGENTES_CONFIG } from "./agentes/config"

export async function processarPergunta(pergunta: string) {
  const inicio = Date.now()

  try {
    console.log("🧠 Nirmata processando:", pergunta)

    const embedding = await generateEmbedding(pergunta)
    console.log("✅ Embedding gerado")

    const batch1Ids = [1, 2, 3, 4, 5, 6]
    const batch2Ids = [7, 8, 9, 10, 11, 12]

    const respostasAgentes = new Map()

    await Promise.all(
      batch1Ids.map(async (agente_id) => {
        try {
          const agente = AGENTES_CONFIG.find((a) => a.id === agente_id)
          if (!agente) return

          const prompt = criarPromptAgente(agente_id, pergunta, "")
          const resposta = await chamarGemini(prompt)
          
          // LOG DA RESPOSTA BRUTA
          console.log(`📝 Resposta bruta agente ${agente.nome}:`, resposta)
          
          const parsed = parseRespostaAgente(resposta)
          respostasAgentes.set(agente_id, parsed)
          console.log(`✅ Agente ${agente.nome} respondeu`)
        } catch (error) {
          console.error(`❌ Erro agente ${agente_id}:`, error)
        }
      })
    )

    await Promise.all(
      batch2Ids.map(async (agente_id) => {
        try {
          const agente = AGENTES_CONFIG.find((a) => a.id === agente_id)
          if (!agente) return

          const prompt = criarPromptAgente(agente_id, pergunta, "")
          const resposta = await chamarGemini(prompt)
          
          // LOG DA RESPOSTA BRUTA
          console.log(`📝 Resposta bruta agente ${agente.nome}:`, resposta)
          
          const parsed = parseRespostaAgente(resposta)
          respostasAgentes.set(agente_id, parsed)
          console.log(`✅ Agente ${agente.nome} respondeu`)
        } catch (error) {
          console.error(`❌ Erro agente ${agente_id}:`, error)
        }
      })
    )

    const consolidada = consolidarRespostas(respostasAgentes, AGENTES_CONFIG)
    console.log("✅ Respostas consolidadas")

    const duracao_ms = Date.now() - inicio

    return {
      pergunta_usuario: pergunta,
      resposta_final: consolidada.resposta_final,
      consenso: consolidada.consenso,
      agentes: consolidada.agentes,
      tempo_ms: duracao_ms,
    }
  } catch (error) {
    console.error("❌ Erro ao processar pergunta:", error)
    throw error
  }
}
