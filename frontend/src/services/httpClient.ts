// Detecta automaticamente o hostname/IP do servidor para funcionar em rede local
function getApiUrl(): string {
  // Se houver uma variável de ambiente configurada, usa ela
  if (import.meta.env.VITE_API_URL) {
    console.log('[getApiUrl] Usando VITE_API_URL:', import.meta.env.VITE_API_URL)
    return import.meta.env.VITE_API_URL
  }
  
  // Se estiver em desenvolvimento ou acessado via localhost, usa localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const port = window.location.port
    console.log('[getApiUrl] Detected hostname:', hostname, 'port:', port)
    
    // Se for localhost ou 127.0.0.1, mantém localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const url = 'http://localhost:8080'
      console.log('[getApiUrl] Using localhost URL:', url)
      return url
    }
    // Caso contrário, usa o mesmo hostname/IP com a porta do backend
    const url = `http://${hostname}:8080`
    console.log('[getApiUrl] Using network URL:', url)
    return url
  }
  
  // Fallback padrão
  console.warn('[getApiUrl] Fallback to localhost:8080')
  return 'http://localhost:8080'
}

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
  // Calcula a URL da API dinamicamente a cada requisição
  const API_URL = getApiUrl()
  const fullUrl = `${API_URL}${path}`
  
  // Log sempre para debug
  console.log(`[httpClient] ${method || 'GET'} ${fullUrl}`)
  
  const { method = 'GET', body, headers } = options
  const response = await fetch(fullUrl, {
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




