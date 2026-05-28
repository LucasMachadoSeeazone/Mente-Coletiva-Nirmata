export type Database = {
  public: {
    Tables: {
      agentes: {
        Row: {
          id: number
          nome: string
          descricao: string | null
          emoji: string | null
          perspectiva: string | null
          ativo: boolean
          ordem: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['agentes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['agentes']['Insert']>
      }
      agente_memoria: {
        Row: {
          id: number
          agente_id: number
          user_id: string | null
          tipo: 'decisao' | 'fato' | 'aprendizado' | 'opiniao' | 'insight'
          conteudo: string
          contexto: string | null
          importancia: number
          embedding: number[] | null
          fonte: string | null
          timestamp_criacao: string
          timestamp_ultimo_acesso: string | null
        }
        Insert: Omit<Database['public']['Tables']['agente_memoria']['Row'], 'id' | 'timestamp_criacao'>
        Update: Partial<Database['public']['Tables']['agente_memoria']['Insert']>
      }
      respostas_consolidadas: {
        Row: {
          id: number
          conversa_id: string
          pergunta_usuario: string
          resposta_final: string | null
          consenso: number | null
          timestamp: string
        }
        Insert: Omit<Database['public']['Tables']['respostas_consolidadas']['Row'], 'id' | 'timestamp'>
        Update: Partial<Database['public']['Tables']['respostas_consolidadas']['Insert']>
      }
      respostas_agentes: {
        Row: {
          id: number
          resposta_id: number
          agente_id: number | null
          pensamento: string | null
          concorda: boolean | null
          confianca: number | null
          timestamp: string
        }
        Insert: Omit<Database['public']['Tables']['respostas_agentes']['Row'], 'id' | 'timestamp'>
        Update: Partial<Database['public']['Tables']['respostas_agentes']['Insert']>
      }
      aprendizados_usuario: {
        Row: {
          id: number
          user_id: string | null
          tipo: 'decisao_tomada' | 'motivo' | 'resultado' | 'feedback'
          descricao: string
          conversa_id: string | null
          contexto: Record<string, any> | null
          embedding: number[] | null
          timestamp: string
        }
        Insert: Omit<Database['public']['Tables']['aprendizados_usuario']['Row'], 'id' | 'timestamp'>
        Update: Partial<Database['public']['Tables']['aprendizados_usuario']['Insert']>
      }
      log_conversacoes_usuario: {
        Row: {
          id: number
          conversa_id: string | null
          pergunta: string | null
          resposta_final: string | null
          agentes_envolvidos: number[] | null
          duracao_ms: number | null
          tokens_usados: number | null
          timestamp: string
        }
        Insert: Omit<Database['public']['Tables']['log_conversacoes_usuario']['Row'], 'id' | 'timestamp'>
        Update: Partial<Database['public']['Tables']['log_conversacoes_usuario']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
