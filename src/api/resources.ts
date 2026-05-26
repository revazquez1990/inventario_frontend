import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { Paginated, User } from '@/types/api'

export interface OptionItem {
  id: number
  name: string
  abbreviation?: string
}

export interface Variant {
  id: number
  product_id: number
  sku: string
  price_with_tax: string
  current_stock: number
  status: string
}

export interface Product {
  id: number
  name: string
  description?: string
  sku_base: string
  min_stock: number
  status: string
  total_stock: number
  category?: OptionItem
  unit?: OptionItem
  variants: Variant[]
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

export interface Movement {
  id: number
  type: string
  code: string
  status: string
  created_at: string
  exchange_rate_snapshot: string
  tax_rate_snapshot: string
  totals: { with_tax_usd: string; with_tax_cup: string }
  items: Array<{ sku: string; product_name: string; quantity: number }>
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
