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

// Limite de caracteres de documentos injetados por agente (proteção de tamanho/custo)
const LIMITE_DOCS_POR_AGENTE = 8000

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

function montarPromptAgente(a: AgenteDB, pergunta: string, contexto: string, docs: string): string {
  const base =
    a.prompt && a.prompt.trim().length > 0
      ? a.prompt
      : `Você é ${a.nome}, um especialista em ${a.perspectiva}. ${a.descricao}`

  const blocoDocs = docs
    ? `
Documentos de conhecimento deste agente (use como fonte ao analisar, quando relevante):
${docs}
`
    : ""

  return `${base}
${blocoDocs}
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

  // 1b) Lê os documentos extraídos de todos os agentes ativos (1 query só)
  const ids = agentes.map((a) => a.id)
  const { data: docsData } = await supabaseServer
    .from("agente_documentos")
    .select("agente_id, nome_arquivo, conteudo_extraido")
    .in("agente_id", ids)
    .eq("status", "extraido")

  // Agrupa por agente, respeitando o limite de caracteres por agente
  const docsPorAgente = new Map<number, string>()
  if (docsData) {
    for (const d of docsData) {
      if (!d.conteudo_extraido) continue
      const atual = docsPorAgente.get(d.agente_id) ?? ""
      if (atual.length >= LIMITE_DOCS_POR_AGENTE) continue
      const restante = LIMITE_DOCS_POR_AGENTE - atual.length
      const trecho = `\n[Documento: ${d.nome_arquivo}]\n${d.conteudo_extraido.slice(0, restante)}`
      docsPorAgente.set(d.agente_id, atual + trecho)
    }
  }

  // 2) Chama os agentes em 2 batches (dinâmico)
  const meio = Math.ceil(agentes.length / 2)
  const batches = [agentes.slice(0, meio), agentes.slice(meio)]
  const respostasAgentes = new Map<number, RespostaAgente>()

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (a) => {
        try {
          const docs = docsPorAgente.get(a.id) ?? ""
          const resposta = await chamarGemini(montarPromptAgente(a as AgenteDB, pergunta, contexto, docs))
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

O que cada agente pensou (resumo interno, NÃO repita isso ao usuário):
${resumoAgentes}

Escreva a resposta da Nirmata seguindo ESTAS REGRAS DE ESTILO:
- Seja CONCISO e direto. Vá ao ponto.
- Comece dando sua orientação/posição principal logo nas primeiras linhas (não enrole, não comece com "para responder preciso de mais dados").
- Integre as perspectivas dos agentes de forma natural, sem listar agente por agente.
- Se houver divergência relevante, mencione o principal trade-off em 1-2 frases.
- Só peça mais contexto se for REALMENTE necessário, e no máximo 2 a 3 perguntas essenciais ao final (não faça questionários longos).
- Tom profissional, claro e prático. Português brasileiro.
- Texto limpo: pode usar quebras de linha e listas curtas com "-". Sem markdown pesado (nada de ## ou **). Não repita os rótulos PENSAMENTO/CONCLUSÃO/CONFIANÇA.
- No geral, mire em algo entre um parágrafo curto e uns 2-3 parágrafos. Evite respostas enormes.`

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
