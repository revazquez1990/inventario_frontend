import { createContext, useContext } from 'react'
import type { Warehouse, WarehouseKind } from '@/types/api'

export interface WarehouseContextValue {
  /** Raw selector value: `ALL_WAREHOUSES`, `ALL_STORES`, or a numeric id as string. */
  value: string
  /** Concrete location id, or null when an aggregate scope is active. */
  selectedId: number | null
  /** Kind of the concrete location, or null for aggregates. */
  selectedKind: WarehouseKind | null
  /** True when the scope is an aggregate ("all warehouses" / "all stores"). */
  isAggregate: boolean
  isAdmin: boolean
  /** Every accessible location (admin: warehouses + stores; almacenero: their almacenes). */
  warehouses: Array<Pick<Warehouse, 'id' | 'name' | 'kind'>>
  setValue: (value: string) => void
}

export const WarehouseContext = createContext<WarehouseContextValue | null>(null)

export function useWarehouse(): WarehouseContextValue {
  const context = useContext(WarehouseContext)
  if (!context) {
    throw new Error('useWarehouse must be used within a WarehouseProvider')
  }
  return context
}
