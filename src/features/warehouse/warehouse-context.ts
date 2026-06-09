import { createContext, useContext } from 'react'
import type { Warehouse } from '@/types/api'

export interface WarehouseContextValue {
  /** Raw selector value: `ALL_WAREHOUSES` or a numeric id as string. */
  value: string
  /** Concrete warehouse id, or null when "all warehouses" is active. */
  selectedId: number | null
  isAll: boolean
  isAdmin: boolean
  warehouses: Array<Pick<Warehouse, 'id' | 'name'>>
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
