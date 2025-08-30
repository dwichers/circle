const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
   const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
         'Content-Type': 'application/json',
         ...(init.headers || {}),
      },
   });
   if (!res.ok) {
      throw new Error(await res.text());
   }
   return res.json() as Promise<T>;
}

export const api = {
   get: <T>(path: string) => request<T>(path),
   post: <T>(path: string, body: unknown) =>
      request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
   put: <T>(path: string, body: unknown) =>
      request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
};

export type ApiResult<T> = Promise<T>;
