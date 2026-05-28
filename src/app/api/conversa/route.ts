import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { pergunta } = await request.json()

    if (!pergunta || pergunta.trim().length === 0) {
      return NextResponse.json(
        { erro: 'Pergunta vazia' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    // TODO: Implementar lógica completa de conversa
    // 1. Gerar embedding da pergunta
    // 2. Buscar contexto (documentos, memória dos agentes)
    // 3. Chamar 12 agentes em 2 batches
    // 4. Consolidar respostas
    // 5. Salvar no banco

    const conversa_id = uuidv4()

    // Resposta temporária (MVP)
    const resposta_final = \Nirmata recebeu sua pergunta: \\n\nImplementação completa em breve!\;

    // Salva resposta consolidada
    const { data: respostaConsolidada, error: errorResposta } =
      await supabase
        .from('respostas_consolidadas')
        .insert({
          conversa_id,
          pergunta_usuario: pergunta,
          resposta_final,
          consenso: 0,
        })
        .select()
        .single()

    if (errorResposta) throw errorResposta

    // Salva log
    const { error: errorLog } = await supabase
      .from('log_conversacoes_usuario')
      .insert({
        conversa_id,
        pergunta,
        resposta_final,
        agentes_envolvidos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        duracao_ms: 0,
        tokens_usados: 0,
      })

    if (errorLog) throw errorLog

    return NextResponse.json({
      conversa_id,
      pergunta_usuario: pergunta,
      resposta_final,
      consenso: 0,
      por_perspectiva: {
        analise: { sim: 0, nao: 0, resumo: '' },
        estrategia: { sim: 0, nao: 0, resumo: '' },
        risco: { sim: 0, nao: 0, resumo: '' },
        pessoas: { sim: 0, nao: 0, resumo: '' },
      },
      agentes: [],
      tempo_ms: 0,
    })
  } catch (error) {
    console.error('Erro em /api/conversa:', error)
    return NextResponse.json(
      { erro: 'Erro ao processar pergunta' },
      { status: 500 }
    )
  }
}
