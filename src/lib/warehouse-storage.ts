const KEY = 'inventario.warehouse'

// Sentinel values understood by the backend for aggregate scopes.
export const ALL_WAREHOUSES = 'all'
export const ALL_STORES = 'all-tiendas'

type Listener = () => void
const listeners = new Set<Listener>()

/**
 * Module-level store for the active warehouse so both React (via
 * useSyncExternalStore) and the non-React axios interceptor can read it.
 * The value is either `ALL_WAREHOUSES` or a numeric id rendered as a string.
 */
export const warehouseStorage = {
  get(): string {
    return localStorage.getItem(KEY) ?? ALL_WAREHOUSES
  },
  set(value: string) {
    localStorage.setItem(KEY, value)
    listeners.forEach((listener) => listener())
  },
  clear() {
    localStorage.removeItem(KEY)
    listeners.forEach((listener) => listener())
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}
