interface GeminiResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}
export async function chamarGemini(prompt: string): Promise<string> {
  const apiKey = process.env.SEAZONE_HUB_API_KEY
  if (!apiKey) {
    throw new Error("SEAZONE_HUB_API_KEY não configurada")
  }
  const response = await fetch("https://hub.seazone.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error("Erro Gemini: " + response.status + " - " + errorText)
  }
  const data: GeminiResponse = await response.json()
  return data.choices[0].message.content
}
