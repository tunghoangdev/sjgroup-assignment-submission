import axios from 'axios';
import { API_BASE_URL } from '@/constants/api-endpoints';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

// Request interceptor — log or attach token if needed later
apiClient.interceptors.request.use((config) => config);

// Response interceptor — normalize error shape
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? 'Unknown error';
    return Promise.reject(new Error(message));
  }
);