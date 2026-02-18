const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const GRAPHQL_URL = `${API_BASE_URL}/graphql`

async function graphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`)
  }

  const result = await response.json()

  if (result.errors?.length) {
    throw new Error(result.errors[0].message)
  }

  return result.data
}

export async function fetchHealth(): Promise<string> {
  const data = await graphqlRequest<{
    health: { status: string }
  }>(`
    query {
      health {
        status
      }
    }
  `)

  return data.health.status
}

export async function fetchDocuments() {
  const data = await graphqlRequest<{
    documents: {
      files: Array<{ filename: string; chunks: number; uploadedAt: string }>
      totalChunks: number
    }
  }>(`
    query {
      documents {
        files {
          filename
          chunks
          uploadedAt
        }
        totalChunks
      }
    }
  `)

  return data.documents
}

export async function clearDocuments() {
  const data = await graphqlRequest<{
    clearDocuments: { success: boolean }
  }>(`
    mutation {
      clearDocuments {
        success
      }
    }
  `)

  return data.clearDocuments
}
