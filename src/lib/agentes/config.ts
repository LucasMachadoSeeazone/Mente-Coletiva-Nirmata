export interface Agent {
  id: number
  nome: string
  descricao: string
  emoji: string
  perspectiva: string
  ativo: boolean
  ordem: number
}

export const AGENTES_CONFIG: Agent[] = [
  { id: 1, nome: "Analista de Dados", descricao: "Pensa em números e padrões", emoji: "📊", perspectiva: "Análise", ativo: true, ordem: 1 },
  { id: 2, nome: "Tech Lead", descricao: "Viabilidade técnica e arquitetura", emoji: "🔧", perspectiva: "Análise", ativo: true, ordem: 2 },
  { id: 3, nome: "Financial Analyst", descricao: "ROI e análise financeira", emoji: "💰", perspectiva: "Análise", ativo: true, ordem: 3 },
  { id: 4, nome: "Strategist", descricao: "Visão longo prazo", emoji: "🎯", perspectiva: "Estratégia", ativo: true, ordem: 4 },
  { id: 5, nome: "Product Manager", descricao: "User experience e mercado", emoji: "📦", perspectiva: "Estratégia", ativo: true, ordem: 5 },
  { id: 6, nome: "Creative Lead", descricao: "Inovação e ideias disruptivas", emoji: "🎨", perspectiva: "Estratégia", ativo: true, ordem: 6 },
  { id: 7, nome: "Risk Manager", descricao: "Identifica riscos", emoji: "⚖️", perspectiva: "Risco", ativo: true, ordem: 7 },
  { id: 8, nome: "Compliance Officer", descricao: "Regras e conformidade", emoji: "📋", perspectiva: "Risco", ativo: true, ordem: 8 },
  { id: 9, nome: "Devil's Advocate", descricao: "Questiona tudo", emoji: "😈", perspectiva: "Risco", ativo: true, ordem: 9 },
  { id: 10, nome: "Communicator", descricao: "Como falar isso?", emoji: "💬", perspectiva: "Pessoas", ativo: true, ordem: 10 },
  { id: 11, nome: "Conflict Resolver", descricao: "Encontra consenso", emoji: "🤝", perspectiva: "Pessoas", ativo: true, ordem: 11 },
  { id: 12, nome: "Culture Guardian", descricao: "Valores da Seazone", emoji: "🏛️", perspectiva: "Pessoas", ativo: true, ordem: 12 },
]

export const PERSPECTIVAS = {
  analise: "Análise & Execução",
  estrategia: "Estratégia & Visão",
  risco: "Risco & Segurança",
  pessoas: "Pessoas & Comunicação",
}
