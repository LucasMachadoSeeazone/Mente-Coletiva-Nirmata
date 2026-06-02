export interface RespostaAgente {
  pensamento: string
  conclusao: "SIM" | "NAO" | "TALVEZ"
  confianca: number
}

export function parseRespostaAgente(texto: string): RespostaAgente {
  try {
    // Remove asteriscos
    const textLimpo = texto.replace(/\*\*/g, "")

    // Regex com acentos opcionais
    const pensamentoMatch = textLimpo.match(/PENSAMENTO:\s*(.+?)(?=\d+\.|CONCLUS)/is)
    const conclusaoMatch = textLimpo.match(/CONCLUS[ÃA]O:\s*(SIM|N[ÃA]O|TALVEZ)/i)
    const confiancaMatch = textLimpo.match(/CONFI[AÂ]N[CÇ]A:\s*(\d+)/i)

    const conclusao = conclusaoMatch ? conclusaoMatch[1].toUpperCase().replace(/[ÃÂ]/g, "A").replace(/[Ç]/g, "C") : "TALVEZ"

    return {
      pensamento: pensamentoMatch ? pensamentoMatch[1].trim().substring(0, 150) : "Sem análise",
      conclusao: (conclusao === "SIM" ? "SIM" : conclusao === "NAO" ? "NAO" : "TALVEZ") as "SIM" | "NAO" | "TALVEZ",
      confianca: confiancaMatch ? Math.min(100, Math.max(0, parseInt(confiancaMatch[1]))) : 50,
    }
  } catch (error) {
    return {
      pensamento: "Erro ao processar resposta",
      conclusao: "TALVEZ",
      confianca: 0,
    }
  }
}
