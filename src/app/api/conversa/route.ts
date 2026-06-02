import { NextRequest, NextResponse } from 'next/server'
import { processarPergunta } from '@/lib/processarPergunta'

export async function POST(request: NextRequest) {
  try {
    const { pergunta } = await request.json()

    if (!pergunta || pergunta.trim().length === 0) {
      return NextResponse.json(
        { erro: 'Pergunta vazia' },
        { status: 400 }
      )
    }

    // Processa pergunta com todos os 12 agentes
    const resultado = await processarPergunta(pergunta)

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Erro em /api/conversa:', error)
    return NextResponse.json(
      { erro: 'Erro ao processar pergunta: ' + (error instanceof Error ? error.message : 'Desconhecido') },
      { status: 500 }
    )
  }
}
