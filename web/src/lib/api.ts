const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach JWT token from localStorage if present
  if (typeof window !== 'undefined') {
    const token = getStoredToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err: any) {
    const errMsg = err?.message || 'Connection failed';
    console.warn(`[DevCommand API] Backend unavailable at ${url}: ${errMsg}`);
    throw new ApiError(
      `Cannot connect to DevCommand API server at ${API_BASE_URL}. Ensure the backend is running on port 8000.`,
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
      // Clear expired credentials and notify listeners
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
};
