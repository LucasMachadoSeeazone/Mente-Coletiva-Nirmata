import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

// GET — lista os agentes ativos
export async function GET() {
  const { data, error } = await supabaseServer
    .from("agentes")
    .select("id, nome, descricao, emoji, perspectiva, ativo, ordem, prompt")
    .eq("ativo", true)
    .order("ordem", { ascending: true })

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ agentes: data })
}

// POST — cria um novo agente
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { nome, descricao, perspectiva, prompt } = body

  if (!nome || !nome.trim()) {
    return NextResponse.json({ erro: "Nome é obrigatório" }, { status: 400 })
  }

  // próximo id e ordem (maior atual + 1)
  const { data: ultimo } = await supabaseServer
    .from("agentes")
    .select("id, ordem")
    .order("id", { ascending: false })
    .limit(1)
    .single()

  const novoId = (ultimo?.id ?? 0) + 1
  const novaOrdem = (ultimo?.ordem ?? 0) + 1

  const { data, error } = await supabaseServer
    .from("agentes")
    .insert({
      id: novoId,
      nome,
      descricao: descricao ?? "",
      perspectiva: perspectiva ?? "Análise",
      prompt: prompt ?? "",
      ativo: true,
      ordem: novaOrdem,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ agente: data })
}

// PUT — edita um agente existente
export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, nome, descricao, perspectiva, prompt } = body

  if (!id) return NextResponse.json({ erro: "id é obrigatório" }, { status: 400 })

  const { data, error } = await supabaseServer
    .from("agentes")
    .update({ nome, descricao, perspectiva, prompt })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ agente: data })
}

// DELETE — apaga de vez (hard delete). id vem por query: /api/agentes?id=5
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ erro: "id é obrigatório" }, { status: 400 })

  const { error } = await supabaseServer.from("agentes").delete().eq("id", Number(id))

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
