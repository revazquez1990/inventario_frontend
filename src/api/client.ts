import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { env } from '@/lib/env'
import { authStorage } from '@/lib/auth-storage'
import { warehouseStorage } from '@/lib/warehouse-storage'

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { Accept: 'application/json' },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStorage.getToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  config.headers.set('X-Warehouse-Id', warehouseStorage.get())
  if (!(config.data instanceof FormData)) {
    config.headers.set('Content-Type', 'application/json')
  }
  return config
})

let refreshing: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = authStorage.getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token')
  const { data } = await axios.post<{ token: string; refresh_token: string }>(
    `${env.apiBaseUrl}/auth/refresh`,
    { refresh_token: refreshToken },
  )
  authStorage.set(data.token, data.refresh_token)
  return data.token
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        refreshing ??= refreshAccessToken().finally(() => {
          refreshing = null
        })
        const newToken = await refreshing
        original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${newToken}` }
        return apiClient.request(original)
      } catch {
        authStorage.clear()
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  },
)

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export function extractApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: ApiError } | undefined
    if (data?.error) return data.error
    return { code: 'UNKNOWN', message: error.message }
  }
  return { code: 'UNKNOWN', message: 'Error inesperado' }
}
