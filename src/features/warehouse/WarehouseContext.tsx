import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ALL_WAREHOUSES, warehouseStorage } from '@/lib/warehouse-storage'
import { useMeQuery } from '@/features/auth/auth.api'
import { WarehouseContext, type WarehouseContextValue } from '@/features/warehouse/warehouse-context'

export function WarehouseProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const meQuery = useMeQuery()
  const value = useSyncExternalStore(warehouseStorage.subscribe, warehouseStorage.get)

  const warehouses = useMemo(() => meQuery.data?.warehouses ?? [], [meQuery.data])
  const isAdmin = meQuery.data?.role === 'admin'

  const setValue = useCallback(
    (next: string) => {
      warehouseStorage.set(next)
      // Refetch everything so listings reflect the newly selected warehouse.
      void queryClient.invalidateQueries()
    },
    [queryClient],
  )

  // Reconcile the stored selection against what the user can actually access.
  useEffect(() => {
    if (!meQuery.data) return

    const ids = warehouses.map((warehouse) => String(warehouse.id))
    const isValidConcrete = ids.includes(value)
    const isValidAll = value === ALL_WAREHOUSES && isAdmin

    if (isValidConcrete || isValidAll) return

    const fallback = isAdmin ? ALL_WAREHOUSES : (ids[0] ?? ALL_WAREHOUSES)
    if (fallback !== value) {
      warehouseStorage.set(fallback)
    }
  }, [meQuery.data, warehouses, value, isAdmin])

  const contextValue = useMemo<WarehouseContextValue>(
    () => ({
      value,
      selectedId: value === ALL_WAREHOUSES ? null : Number(value),
      isAll: value === ALL_WAREHOUSES,
      isAdmin,
      warehouses,
      setValue,
    }),
    [value, isAdmin, warehouses, setValue],
  )

  return <WarehouseContext.Provider value={contextValue}>{children}</WarehouseContext.Provider>
}
