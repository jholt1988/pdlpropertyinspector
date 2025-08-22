/* Lightweight ApiClient wrapper for fetch + localStorage helpers
   - Provides a central place for request headers and token helpers
   - Kept intentionally small to avoid introducing new dependencies
*/
export type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

class ApiClient {
  baseUrl?: string;
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(path: string) {
    if (!path) return this.baseUrl ?? '';
    if (this.baseUrl && path.startsWith('/')) return `${this.baseUrl}${path}`;
    return path;
  }

  async request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    };

    const resp = await fetch(url, {
      ...options,
      headers,
    } as RequestInit);

    if (!resp.ok) {
      const text = await resp.text();
      const error = text || resp.statusText || `HTTP ${resp.status}`;
      throw new Error(error);
    }

    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return resp.json() as Promise<T>;
    }

    // Return raw text for other types
    return (await resp.text()) as unknown as T;
  }

  get<T = any>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { method: 'GET', ...options });
  }
  post<T = any>(path: string, body?: any, options?: RequestOptions) {
    return this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...options });
  }
  put<T = any>(path: string, body?: any, options?: RequestOptions) {
    return this.request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, ...options });
  }
  delete<T = any>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { method: 'DELETE', ...options });
  }

  // Small storage helpers to centralize use of localStorage keys
  storage = {
    getItem: (key: string): string | null => {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        // localStorage may be unavailable in some environments
        console.warn('ApiClient.storage.getItem failed', e);
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn('ApiClient.storage.setItem failed', e);
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('ApiClient.storage.removeItem failed', e);
      }
    },
  };

  // Token helpers (simple, storage-backed)
  setAccessToken(token: string) {
    this.storage.setItem('access_token', token);
  }
  getAccessToken(): string | null {
    return this.storage.getItem('access_token');
  }
  setRefreshToken(token: string) {
    this.storage.setItem('refresh_token', token);
  }
  getRefreshToken(): string | null {
    return this.storage.getItem('refresh_token');
  }
  clearTokens() {
    this.storage.removeItem('access_token');
    this.storage.removeItem('refresh_token');
  }
}

export const apiClient = new ApiClient();
