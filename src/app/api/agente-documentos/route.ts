import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

const BUCKET = "agente-documentos"

export async function GET(request: NextRequest) {
  const agenteId = request.nextUrl.searchParams.get("agente_id")
  if (!agenteId) return NextResponse.json({ erro: "agente_id e obrigatorio" }, { status: 400 })

  const { data, error } = await supabaseServer
    .from("agente_documentos")
    .select("id, nome_arquivo, tipo, tamanho_bytes, status, created_at")
    .eq("agente_id", Number(agenteId))
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ documentos: data })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const agenteId = formData.get("agente_id")

    if (!file || !agenteId) {
      return NextResponse.json({ erro: "file e agente_id sao obrigatorios" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const caminho = agenteId + "/" + Date.now() + "-" + file.name

    const { error: upErr } = await supabaseServer.storage
      .from(BUCKET)
      .upload(caminho, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      })

    if (upErr) return NextResponse.json({ erro: upErr.message }, { status: 500 })

    const { data, error } = await supabaseServer
      .from("agente_documentos")
      .insert({
        agente_id: Number(agenteId),
        nome_arquivo: file.name,
        tipo: file.type,
        tamanho_bytes: file.size,
        storage_path: caminho,
        status: "pendente",
      })
      .select()
      .single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ documento: data })
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "Erro no upload" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ erro: "id e obrigatorio" }, { status: 400 })

  const { data: doc } = await supabaseServer
    .from("agente_documentos")
    .select("storage_path")
    .eq("id", id)
    .single()

  if (doc?.storage_path) {
    await supabaseServer.storage.from(BUCKET).remove([doc.storage_path])
  }

  const { error } = await supabaseServer.from("agente_documentos").delete().eq("id", id)
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
