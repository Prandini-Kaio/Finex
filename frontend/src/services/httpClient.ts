const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface HttpOptions<TBody> {
  method?: HttpMethod
  body?: TBody
  headers?: Record<string, string>
}

export async function httpClient<TResponse, TBody = unknown>(
  path: string,
  options: HttpOptions<TBody> = {},
): Promise<TResponse> {
  const { method = 'GET', body, headers } = options
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return (await response.json()) as TResponse
}




