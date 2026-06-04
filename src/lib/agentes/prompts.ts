import { AGENTES_CONFIG } from "./config"
export function criarPromptAgente(
  agente_id: number,
  pergunta: string,
  contexto: string = ""
) {
  const agente = AGENTES_CONFIG.find((a) => a.id === agente_id)
  if (!agente) throw new Error("Agente " + agente_id + " não encontrado")
  return `Você é ${agente.nome}, um especialista em ${agente.perspectiva}.
Descrição: ${agente.descricao}
Pergunta do usuário:
"${pergunta}"
Responda de forma estruturada:
1. PENSAMENTO: Sua análise profunda (2-3 linhas)
2. CONCLUSÃO: SIM / NÃO / TALVEZ
3. CONFIANÇA: Um número de 0-100 indicando sua certeza
Seja conciso e direto.`
}
