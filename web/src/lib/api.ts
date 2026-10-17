export const CLOUD_API_URL = 'https://smart-project-manager-em2i.onrender.com/api/v1';

function getInitialBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('devcommand_api_url');
    if (override) return override;
  }
  return process.env.NEXT_PUBLIC_API_URL || CLOUD_API_URL;
}

let activeApiUrl = getInitialBaseUrl();

export function getApiBaseUrl(): string {
  return activeApiUrl;
}

export function setApiBaseUrl(url: string) {
  activeApiUrl = url.trim().replace(/\/+$/, '');
  if (typeof window !== 'undefined') {
    localStorage.setItem('devcommand_api_url', activeApiUrl);
  }
}

export class ApiError extends Error {
  status: number;
  data: any;
  isNetworkError: boolean;
  constructor(message: string, status: number, data: any = null, isNetworkError: boolean = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
  }
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('devcommand_access_token');
}

async function executeFetch(
  baseUrl: string,
  endpoint: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const url = `${baseUrl}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (typeof window !== 'undefined') {
    const token = getStoredToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const currentBase = activeApiUrl;
  const isLocal = currentBase.includes('localhost') || currentBase.includes('127.0.0.1');
  const timeout = isLocal ? 10000 : 90000;

  let response: Response | null = null;
  let connectionError: any = null;

  try {
    response = await executeFetch(currentBase, endpoint, options, timeout);
  } catch (err: any) {
    connectionError = err;
  }

  // Automatic Fallback: If local backend failed to connect, seamlessly try the live Cloud backend
  if ((!response || connectionError) && isLocal && currentBase !== CLOUD_API_URL) {
    console.info(`[DevCommand API] Local backend unreachable at ${currentBase}. Auto-falling back to live Cloud API: ${CLOUD_API_URL}`);
    try {
      response = await executeFetch(CLOUD_API_URL, endpoint, options, 90000);
      setApiBaseUrl(CLOUD_API_URL);
      connectionError = null;
    } catch (fallbackErr: any) {
      connectionError = fallbackErr;
    }
  }

  if (!response || connectionError) {
    const errMsg = connectionError?.name === 'AbortError' ? 'Request timed out' : (connectionError?.message || 'Connection failed');
    console.warn(`[DevCommand API] Backend unavailable: ${errMsg}`);
    
    const helpfulMessage = activeApiUrl.includes('localhost')
      ? `Cannot connect to local backend at ${activeApiUrl}. Start it with 'uvicorn app.main:app --port 8000', or use the live cloud API.`
      : `Cannot connect to DevCommand API server at ${activeApiUrl}. If the Render backend is waking up, please wait ~20s and try again.`;

    throw new ApiError(
      helpfulMessage,
      0,
      { originalError: errMsg },
      true
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('devcommand_access_token');
      localStorage.removeItem('devcommand_refresh_token');
      window.dispatchEvent(new CustomEvent('devcommand:unauthorized'));
    }
    const message = data.detail || response.statusText || 'API request failed';
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

  // Auth
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('devcommand_access_token', accessToken);
      localStorage.setItem('devcommand_refresh_token', refreshToken);
    }
  },
  clearTokens: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('devcommand_access_token');
      localStorage.removeItem('devcommand_refresh_token');
    }
  },
  getToken: () => getStoredToken(),
  isAuthenticated: () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('devcommand_access_token');
    }
    return false;
  },
  getBaseUrl: () => getApiBaseUrl(),
  setBaseUrl: (url: string) => setApiBaseUrl(url),

  // Copilot AI & Qdrant RAG
  sendChatMessage: (data: import('../types').ChatRequest) =>
    request<import('../types').ChatResponse>('/chat/message', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getChatHistory: (projectId?: string) =>
    request<{ status: string; history: import('../types').ChatMessage[] }>(
      `/chat/history${projectId ? `?project_id=${projectId}` : ''}`,
      { method: 'GET' }
    ),
  clearChatHistory: (projectId?: string) =>
    request<{ status: string; cleared: boolean; message: string }>(
      `/chat/history${projectId ? `?project_id=${projectId}` : ''}`,
      { method: 'DELETE' }
    ),
  getQdrantStatus: () => request<import('../types').QdrantStatus>('/chat/qdrant-status', { method: 'GET' }),
  syncKnowledgeBase: () =>
    request<{ message: string; points_indexed: number }>('/chat/sync-knowledge', { method: 'POST' }),
};
