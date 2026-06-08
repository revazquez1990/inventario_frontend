import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { Paginated, User } from '@/types/api'

export interface OptionItem {
  id: number
  name: string
  abbreviation?: string
}

export interface Product {
  id: number
  code: string
  name: string
  price: string
  reference?: string
  variety?: string
  quantity: number
  image_url?: string
  status: string
  created_at?: string
  category?: OptionItem
  unit?: OptionItem
}

export interface ImportPreviewRow {
  row: number
  status: 'valid' | 'error'
  errors: string[]
  data: Record<string, string>
}

export interface ImportPreview {
  valid_rows: number
  errors_count: number
  rows: ImportPreviewRow[]
}

export interface MovementUser {
  id: number
  name: string
  email: string
}

export interface MovementItem {
  id?: number
  product_id?: number
  code: string
  product_name: string
  quantity: number
  unit_price_with_tax_usd?: string
  subtotal_with_tax_usd?: string
  subtotal_with_tax_cup?: string
}

export interface ProductHistoryEntry {
  id: number
  code: string
  type: string
  status: string
  quantity: number
  created_at: string
  created_by?: string | null
  supplier?: string | null
  reason?: string | null
}

export interface Movement {
  id: number
  type: string
  adjustment_subtype?: string | null
  code: string
  status: string
  created_at: string
  exchange_rate_snapshot: string
  tax_rate_snapshot: string
  reason?: string | null
  reason_void?: string | null
  supplier?: { id: number; name: string } | null
  created_by?: MovementUser | null
  voided_by?: MovementUser | null
  voided_at?: string | null
  totals: {
    without_tax_usd: string
    tax_usd: string
    with_tax_usd: string
    without_tax_cup: string
    tax_cup: string
    with_tax_cup: string
  }
  items: MovementItem[]
}

export function useList<T>(key: string, path: string) {
  return useQuery({
    queryKey: [key],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: T[] }>(path)
      return data.data
    },
  })
}

export function usePaginated<T>(key: string, path: string) {
  return useQuery({
    queryKey: [key],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<T>>(path)
      return data
    },
  })
}

export function usePost<TInput>(invalidateKeys: string[]) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ path, input }: { path: string; input: TInput }) => {
      const { data } = await apiClient.post(path, input)
      return data
    },
    onSuccess: async () => {
      await Promise.all(invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
    },
  })
}

export function usePut<TInput>(invalidateKeys: string[]) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ path, input }: { path: string; input: TInput }) => {
      const { data } = await apiClient.put(path, input)
      return data
    },
    onSuccess: async () => {
      await Promise.all(invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
    },
  })
}

export function useDelete(invalidateKeys: string[]) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (path: string) => {
      await apiClient.delete(path)
    },
    onSuccess: async () => {
      await Promise.all(invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
    },
  })
}

export function useUsers() {
  return usePaginated<User>('users', '/users')
}

export function useProducts(params = '') {
  return useList<Product>(`products${params}`, `/products${params}`)
}

export function useMovements(params = '?per_page=50') {
  return usePaginated<Movement>(`movements${params}`, `/movements${params}`)
}
