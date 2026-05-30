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
  get: <T>(path: string) => client.get<T>(path).then((r) => r.data),
  post: <T>(path: string, body?: unknown) => client.post<T>(path, body).then((r) => r.data),
  patch: <T>(path: string, body?: unknown) => client.patch<T>(path, body).then((r) => r.data),
};
