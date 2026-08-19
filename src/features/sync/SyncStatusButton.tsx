import { AlertTriangle, Check, RefreshCw, UploadCloud } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { useSyncRun, useSyncStatus } from './sync.api'

function timeAgo(iso: string | null): string {
  if (!iso) return 'nunca'
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.round(diffMs / 60000)
  if (min < 1) return 'hace un momento'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  return new Date(iso).toLocaleDateString('es-ES')
}

/**
 * Indicador de sincronización del nodo: muestra los movimientos/productos
 * pendientes de subir y la última sincronización, con un botón para sincronizar
 * ahora. Además sincroniza automáticamente al recuperar internet y cada 5 min.
 * En el servidor central no se muestra (no aplica).
 */
export function SyncStatusButton() {
  const statusQuery = useSyncStatus()
  const runMutation = useSyncRun()
  const status = statusQuery.data

  const canSync = status?.role === 'node' && status.central_configured
  const isPending = runMutation.isPending

  const sync = useCallback(() => {
    if (canSync && !isPending) runMutation.mutate()
  }, [canSync, isPending, runMutation])

  // Auto-sync: al recuperar conexión y periódicamente (internet limitada -> intervalo amplio).
  const syncRef = useRef(sync)
  syncRef.current = sync
  useEffect(() => {
    const onOnline = () => syncRef.current()
    window.addEventListener('online', onOnline)
    const interval = window.setInterval(() => syncRef.current(), 5 * 60_000)
    return () => {
      window.removeEventListener('online', onOnline)
      window.clearInterval(interval)
    }
  }, [])

  if (!status || status.role !== 'node') return null

  const pending = status.pending_total
  const failed = runMutation.isError
  const notConfigured = !status.central_configured

  const label = notConfigured
    ? 'Sync sin configurar'
    : isPending
      ? 'Sincronizando…'
      : pending > 0
        ? `${pending} por subir`
        : 'Al día'

  const tone = notConfigured || failed
    ? 'border-[#d69a8a] bg-[#fff1ea] text-[#8a2d1b]'
    : pending > 0
      ? 'border-[#d8c48a] bg-[#fbf6e6] text-[#7a5c15]'
      : 'border-[#bcd3c4] bg-[#edf4ef] text-[#16372f]'

  const Icon = notConfigured || failed ? AlertTriangle : isPending ? RefreshCw : pending > 0 ? UploadCloud : Check

  return (
    <button
      type="button"
      onClick={sync}
      disabled={!canSync || isPending}
      title={`Última sincronización: ${timeAgo(status.last_sync_at)}${notConfigured ? ' · Configura SYNC_CENTRAL_URL y SYNC_NODE_TOKEN' : ''}`}
      className={`flex h-11 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${tone}`}
    >
      <Icon className={`size-4 ${isPending ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
