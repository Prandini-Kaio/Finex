// Detecta automaticamente o hostname/IP do servidor para funcionar em rede local
function getApiUrl(): string {
  // Se houver uma variável de ambiente configurada, usa ela
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Se estiver em desenvolvimento ou acessado via localhost, usa localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    // Se for localhost ou 127.0.0.1, mantém localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8080'
    }
    // Caso contrário, usa o mesmo hostname/IP com a porta do backend
    return `http://${hostname}:8080`
  }
  
  // Fallback padrão
  return 'http://localhost:8080'
}

const API_URL = getApiUrl()

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




