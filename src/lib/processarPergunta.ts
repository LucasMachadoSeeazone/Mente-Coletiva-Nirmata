import { chamarGemini } from "./gemini"
import { parseRespostaAgente, RespostaAgente } from "./parseRespostasAgentes"
import { consolidarRespostas } from "./consolidarRespostas"
import { supabaseServer } from "./supabase/server"

type AgenteDB = {
  id: number
  nome: string
  descricao: string
  emoji: string | null
  perspectiva: string
  prompt: string | null
  ordem: number
}

export type MensagemHistorico = { role: "user" | "assistant"; content: string }

// Quantas mensagens a Nirmata "lembra" (janela deslizante). Mude aqui se quiser mais/menos.
const JANELA_MEMORIA = 10

/*
 * GANCHO PARA O FUTURO (evolução da memória):
 * Hoje a memória é uma JANELA DESLIZANTE (últimas JANELA_MEMORIA mensagens).
 * Próximos níveis, quando o histórico crescer:
 *   (2) RESUMO: resumir as mensagens que saem da janela num parágrafo e injetar como "resumo da conversa até aqui".
 *   (3) MEMÓRIA SELETIVA: extrair fatos/decisões importantes e guardar numa tabela, injetando só o relevante.
 * A função abaixo (montarContextoHistorico) é o ponto onde essa lógica entraria.
 */
function montarContextoHistorico(historico: MensagemHistorico[]): string {
  if (!historico || historico.length === 0) return ""
  const recentes = historico.slice(-JANELA_MEMORIA)
  const linhas = recentes
    .map((m) => (m.role === "user" ? "Usuário: " : "Nirmata: ") + m.content)
    .join("\n")
  return `Histórico recente da conversa (use para manter contexto e coerência):
${linhas}
`
}

function montarPromptAgente(a: AgenteDB, pergunta: string, contexto: string): string {
  const base =
    a.prompt && a.prompt.trim().length > 0
      ? a.prompt
      : `Você é ${a.nome}, um especialista em ${a.perspectiva}. ${a.descricao}`

  return `${base}

${contexto}Pergunta atual do usuário:
"${pergunta}"

Se faltar contexto importante para uma boa análise, deixe claro no PENSAMENTO o que você precisaria saber.

Responda EXATAMENTE neste formato:
PENSAMENTO: sua análise em 2-3 linhas, pela sua perspectiva
CONCLUSÃO: SIM ou NÃO ou TALVEZ
CONFIANÇA: um número de 0 a 100`
}

export async function processarPergunta(pergunta: string, historico: MensagemHistorico[] = []) {
  const inicio = Date.now()

  const contexto = montarContextoHistorico(historico)

  // 1) Lê os agentes ativos do banco (com o prompt personalizado)
  const { data: agentes, error } = await supabaseServer
    .from("agentes")
    .select("id, nome, descricao, emoji, perspectiva, prompt, ordem")
    .eq("ativo", true)
    .order("ordem", { ascending: true })

  if (error || !agentes || agentes.length === 0) {
    throw new Error("Não consegui carregar os agentes: " + (error?.message ?? "lista vazia"))
  }

  // 2) Chama os agentes em 2 batches (dinâmico)
  const meio = Math.ceil(agentes.length / 2)
  const batches = [agentes.slice(0, meio), agentes.slice(meio)]
  const respostasAgentes = new Map<number, RespostaAgente>()

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (a) => {
        try {
          const resposta = await chamarGemini(montarPromptAgente(a as AgenteDB, pergunta, contexto))
          respostasAgentes.set(a.id, parseRespostaAgente(resposta))
        } catch (e) {
          console.error("❌ Erro agente " + a.id + ":", e)
        }
      })
    )
  }

  // 3) Consolida (consenso + lista de agentes pra UI)
  const consolidada = consolidarRespostas(respostasAgentes, agentes as never)

  // 4) Síntese final — a "voz" da Nirmata, integrando as perspectivas + histórico
  const resumoAgentes = agentes
    .map((a) => {
      const r = respostasAgentes.get(a.id)
      if (!r) return null
      return `- ${a.nome} (${a.perspectiva}): "${r.pensamento}" -> ${r.conclusao} (${r.confianca}%)`
    })
    .filter(Boolean)
    .join("\n")

  const promptSintese = `Você é a Nirmata, uma mente coletiva formada por ${agentes.length} agentes especialistas que acabaram de analisar uma pergunta, cada um pela sua perspectiva.

${contexto}Pergunta atual do usuário:
"${pergunta}"

O que cada agente pensou:
${resumoAgentes}

Escreva UMA resposta final para o usuário, integrando as perspectivas acima de forma coerente e mantendo coerência com o histórico da conversa. Seja claro, direto e prático. Quando houver divergência relevante, aponte os trade-offs. Se faltar informação importante para responder bem, FAÇA perguntas objetivas ao usuário pedindo o contexto que falta (ex.: dados, qual projeto, onde buscar). Termine com uma orientação ou com as perguntas necessárias. Responda em português brasileiro, em texto limpo (quebras de linha e listas simples com "-"), sem markdown pesado (nada de ## ou **) e sem repetir os rótulos PENSAMENTO/CONCLUSÃO/CONFIANÇA.`

  let resposta_final: string
  try {
    resposta_final = await chamarGemini(promptSintese)
  } catch (e) {
    console.error("❌ Erro na síntese final:", e)
    resposta_final = consolidada.resposta_final
  }

  return {
    pergunta_usuario: pergunta,
    resposta_final,
    consenso: consolidada.consenso,
    agentes: consolidada.agentes,
    tempo_ms: Date.now() - inicio,
  }
}
