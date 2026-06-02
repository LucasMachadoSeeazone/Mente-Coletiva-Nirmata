import { pipeline } from '@xenova/transformers'

let embeddingPipeline: any = null

export async function getEmbeddingModel() {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/gte-small'
    )
  }
  return embeddingPipeline
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = await getEmbeddingModel()
  const embeddings = await model(text, {
    pooling: 'mean',
    normalize: true,
  })

  // Converte tensor pra array
  return Array.from(embeddings.data as Float32Array)
}
