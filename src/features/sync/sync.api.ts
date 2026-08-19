import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

export interface SyncStatus {
  role: 'central' | 'node'
  node_id: string
  central_configured: boolean
  pending_total: number
  pending_by_entity: Record<string, number>
  last_sync_at: string | null
}

export interface SyncRunResult {
  pushed: Record<string, number>
  pulled: Record<string, number>
}

/** Estado local de sincronización del nodo (pendientes de subir, última sync). */
export function useSyncStatus() {
  return useQuery({
    queryKey: ['sync-status'],
    queryFn: async () => (await apiClient.get<{ data: SyncStatus }>('/sync/status')).data.data,
    refetchInterval: 60_000,
    // El central no expone datos de nodo relevantes; igual devuelve role: 'central'.
    staleTime: 30_000,
  })
}

/** Dispara una sincronización (sube pendientes y baja lo consolidado). */
export function useSyncRun() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => (await apiClient.post<{ data: SyncRunResult }>('/sync/run')).data.data,
    onSuccess: async () => {
      // Tras sincronizar pudo cambiar el catálogo, stock y movimientos: refrescamos todo.
      await queryClient.invalidateQueries()
    },
  })
}
