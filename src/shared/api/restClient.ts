import { getApiBaseUrl } from '@/shared/config/api';

export type RestClientOptions = {
  baseUrl?: string;
  getHeaders?: () => Record<string, string>;
};

export type RestClient = {
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, body: unknown) => Promise<T>;
  patch: <T>(path: string, body: unknown) => Promise<T>;
  delete: (path: string) => Promise<void>;
};

const joinUrl = (baseUrl: string, path: string) => {
  const base = baseUrl.replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
};

const parseJson = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
};

export const createRestClient = (options: RestClientOptions = {}): RestClient => {
  const baseUrl = options.baseUrl ?? getApiBaseUrl();

  const request = async (path: string, init: RequestInit): Promise<Response> => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.getHeaders?.() ?? {}),
    };
    if (init.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(joinUrl(baseUrl, path), {
      ...init,
      headers: {
        ...headers,
        ...(init.headers as Record<string, string> | undefined),
      },
    });
    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(message || `HTTP ${response.status}`);
    }
    return response;
  };

  return {
    async get<T>(path: string): Promise<T> {
      const response = await request(path, { method: 'GET' });
      return parseJson<T>(response);
    },
    async post<T>(path: string, body: unknown): Promise<T> {
      const response = await request(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return parseJson<T>(response);
    },
    async patch<T>(path: string, body: unknown): Promise<T> {
      const response = await request(path, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      return parseJson<T>(response);
    },
    async delete(path: string): Promise<void> {
      await request(path, { method: 'DELETE' });
    },
  };
};
