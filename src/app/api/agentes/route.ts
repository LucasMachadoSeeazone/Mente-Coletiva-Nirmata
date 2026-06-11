import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

// GET — lista os agentes ativos + total de caracteres de documentos extraidos
export async function GET() {
  const { data, error } = await supabaseServer
    .from("agentes")
    .select("id, nome, descricao, emoji, perspectiva, ativo, ordem, prompt")
    .eq("ativo", true)
    .order("ordem", { ascending: true })

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

  // Soma os caracteres extraidos por agente (conhecimento dos documentos)
  const ids = (data ?? []).map((a) => a.id)
  const docsChars = new Map<number, number>()
  if (ids.length > 0) {
    const { data: docs } = await supabaseServer
      .from("agente_documentos")
      .select("agente_id, conteudo_extraido")
      .in("agente_id", ids)
      .eq("status", "extraido")

    if (docs) {
      for (const d of docs) {
        const len = d.conteudo_extraido ? d.conteudo_extraido.length : 0
        docsChars.set(d.agente_id, (docsChars.get(d.agente_id) ?? 0) + len)
      }
    }
  }

  const agentes = (data ?? []).map((a) => ({
    ...a,
    docs_chars: docsChars.get(a.id) ?? 0,
  }))

  return NextResponse.json({ agentes })
}

// POST — cria um novo agente
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { nome, descricao, perspectiva, prompt } = body

  if (!nome || !nome.trim()) {
    return NextResponse.json({ erro: "Nome e obrigatorio" }, { status: 400 })
  }

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

  if (!id) return NextResponse.json({ erro: "id e obrigatorio" }, { status: 400 })

  const { data, error } = await supabaseServer
    .from("agentes")
    .update({ nome, descricao, perspectiva, prompt })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ agente: data })
}

// DELETE — apaga de vez (hard delete). id por query: /api/agentes?id=5
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ erro: "id e obrigatorio" }, { status: 400 })

  const { error } = await supabaseServer.from("agentes").delete().eq("id", Number(id))

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
