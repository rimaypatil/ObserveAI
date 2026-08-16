import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { APIResponse, StandardErrorResponse } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Attach JWT access token to requests
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('observeai_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Centralized Error Normalization
export interface NormalizedError {
  errorCode: string;
  message: string;
  statusCode: number;
  details?: any;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<StandardErrorResponse>) => {
    if (error.response?.status === 401) {
      // Clear token and notify app redirect if unauthorized
      localStorage.removeItem('observeai_access_token');
      localStorage.removeItem('observeai_refresh_token');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }

    const statusCode = error.response?.status || 500;
    const errorData = error.response?.data?.error;

    const normalizedError: NormalizedError = {
      statusCode,
      errorCode: errorData?.error_code || `ERR_HTTP_${statusCode}`,
      message: errorData?.message || error.message || 'An unexpected error occurred.',
      details: errorData?.details,
    };

    return Promise.reject(normalizedError);
  }
);

// Helper function to extract data payload from backend APIResponse
export function unwrapData<T>(response: { data: APIResponse<T> }): T {
  if (response.data && response.data.success !== undefined) {
    return response.data.data;
  }
  return (response as any).data;
}
