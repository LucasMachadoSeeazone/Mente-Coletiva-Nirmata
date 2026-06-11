import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

// GET -> conversa atual (mais recente) + mensagens; cria uma se nao existir
export async function GET() {
  let { data: conversa } = await supabaseServer
    .from("nirmata_conversas")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!conversa) {
    const { data: nova } = await supabaseServer
      .from("nirmata_conversas")
      .insert({ titulo: "Conversa" })
      .select("id")
      .single()
    conversa = nova
  }

  const { data: mensagens } = await supabaseServer
    .from("nirmata_mensagens")
    .select("role, content")
    .eq("conversa_id", conversa!.id)
    .order("created_at", { ascending: true })

  return NextResponse.json({ conversa_id: conversa!.id, mensagens: mensagens ?? [] })
}

// POST {acao:"nova"} -> cria nova conversa
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  if (body.acao === "nova") {
    const { data, error } = await supabaseServer
      .from("nirmata_conversas")
      .insert({ titulo: "Conversa" })
      .select("id")
      .single()
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ conversa_id: data.id })
  }
  return NextResponse.json({ erro: "acao desconhecida" }, { status: 400 })
}
