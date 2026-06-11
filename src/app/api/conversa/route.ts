import { NextRequest, NextResponse } from "next/server"
import { processarPergunta } from "@/lib/processarPergunta"
import { supabaseServer } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { pergunta, historico, conversa_id } = await request.json()
    if (!pergunta || pergunta.trim().length === 0) {
      return NextResponse.json({ erro: "Pergunta vazia" }, { status: 400 })
    }

    const resultado = await processarPergunta(pergunta, historico ?? [])

    // Persiste a troca no banco (se houver conversa)
    if (conversa_id) {
      await supabaseServer.from("nirmata_mensagens").insert([
        { conversa_id, role: "user", content: pergunta },
        { conversa_id, role: "assistant", content: resultado.resposta_final },
      ])
      await supabaseServer
        .from("nirmata_conversas")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversa_id)
    }

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("Erro em /api/conversa:", error)
    return NextResponse.json(
      { erro: "Erro ao processar pergunta: " + (error instanceof Error ? error.message : "Desconhecido") },
      { status: 500 }
    )
  }
}
