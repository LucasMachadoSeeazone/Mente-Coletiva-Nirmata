import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

const BUCKET = "agente-documentos"

async function extrairPDF(buffer: Buffer): Promise<string> {
  const pdfParse = require("pdf-parse")
  const data = await pdfParse(buffer)
  return data.text || ""
}
async function extrairDOCX(buffer: Buffer): Promise<string> {
  const mammoth = require("mammoth")
  const result = await mammoth.extractRawText({ buffer })
  return result.value || ""
}
async function extrairXLSX(buffer: Buffer): Promise<string> {
  const XLSX = require("xlsx")
  const workbook = XLSX.read(buffer, { type: "buffer" })
  let texto = ""
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    texto += "\n--- Aba: " + sheetName + " ---\n" + csv
  }
  return texto
}

export async function POST(request: NextRequest) {
  try {
    const { documento_id } = await request.json()
    if (!documento_id) return NextResponse.json({ erro: "documento_id e obrigatorio" }, { status: 400 })

    const { data: doc, error: docErr } = await supabaseServer
      .from("agente_documentos")
      .select("id, nome_arquivo, storage_path")
      .eq("id", documento_id)
      .single()

    if (docErr || !doc) return NextResponse.json({ erro: "Documento nao encontrado" }, { status: 404 })

    const { data: arquivo, error: dlErr } = await supabaseServer.storage.from(BUCKET).download(doc.storage_path)
    if (dlErr || !arquivo) return NextResponse.json({ erro: "Nao consegui baixar o arquivo" }, { status: 500 })

    const buffer = Buffer.from(await arquivo.arrayBuffer())
    const nome = (doc.nome_arquivo || "").toLowerCase()

    let texto = ""
    if (nome.endsWith(".pdf")) texto = await extrairPDF(buffer)
    else if (nome.endsWith(".docx")) texto = await extrairDOCX(buffer)
    else if (nome.endsWith(".xlsx") || nome.endsWith(".xls")) texto = await extrairXLSX(buffer)
    else if (nome.endsWith(".csv")) texto = buffer.toString("utf-8")
    else if (nome.endsWith(".txt")) texto = buffer.toString("utf-8")
    else {
      await supabaseServer.from("agente_documentos").update({ status: "nao_suportado" }).eq("id", documento_id)
      return NextResponse.json({ erro: "Tipo nao suportado (use PDF, Word, Excel, CSV)" }, { status: 400 })
    }

    const textoFinal = (texto || "").trim().slice(0, 15000)

    if (!textoFinal) {
      await supabaseServer.from("agente_documentos").update({ status: "vazio" }).eq("id", documento_id)
      return NextResponse.json({ erro: "Nao consegui extrair conteudo" }, { status: 400 })
    }

    const { error: upErr } = await supabaseServer
      .from("agente_documentos")
      .update({ conteudo_extraido: textoFinal, status: "extraido" })
      .eq("id", documento_id)

    if (upErr) return NextResponse.json({ erro: upErr.message }, { status: 500 })
    return NextResponse.json({ sucesso: true, chars: textoFinal.length })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : "Erro na extracao" }, { status: 500 })
  }
}
