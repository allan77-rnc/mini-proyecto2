import axios from 'axios';
import { auth } from './firebase';

const BASE_URL = ((import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000')
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');

const client = axios.create({ baseURL: BASE_URL });

client.interceptors.request.use(async (config) => {
  const token = await auth.currentUser?.getIdToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as { message?: string; code?: string } | undefined;
      const err = new Error(data?.message ?? `HTTP ${error.response?.status}`) as Error & {
        code?: string;
        status?: number;
      };
      err.code = data?.code ?? `http/${error.response?.status}`;
      err.status = error.response?.status;
      return Promise.reject(err);
    }
    return Promise.reject(error);
  }
);

export const api = {
  async get<T>(path: string): Promise<T> {
    const { data } = await client.get<T>(path);
    return data;
  },
  async post<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    const { data } = await client.post<T>(path, body);
    return data;
  },
  async patch<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    const { data } = await client.patch<T>(path, body);
    return data;
  },
};
