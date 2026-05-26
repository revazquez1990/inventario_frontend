import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { authStorage } from '@/lib/auth-storage'
import type { AuthResponse, User } from '@/types/api'

export interface LoginInput {
  email: string
  password: string
}

interface MeResponse {
  data: User
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', input)
      authStorage.set(data.token, data.refresh_token)
      return data
    },
  })
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout')
    },
    onSettled: () => {
      authStorage.clear()
    },
  })
}

export function useMeQuery(enabled = true) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get<MeResponse>('/auth/me')
      return data.data
    },
    enabled: enabled && authStorage.hasSession(),
    retry: false,
  })
}
