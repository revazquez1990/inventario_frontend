import { Warehouse } from 'lucide-react'
import { ALL_WAREHOUSES } from '@/lib/warehouse-storage'
import { useWarehouse } from '@/features/warehouse/warehouse-context'

export function WarehouseSelector() {
  const { value, setValue, warehouses, isAdmin } = useWarehouse()

  if (warehouses.length === 0) return null

  return (
    <label className="flex items-center gap-2 rounded-md border border-[#c9c5b8] bg-white px-2 py-1">
      <Warehouse className="size-4 text-[#16372f]" aria-hidden />
      <span className="sr-only">Almacén</span>
      <select
        className="max-w-[180px] bg-transparent text-sm font-medium text-[#20231f] outline-none"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      >
        {isAdmin ? <option value={ALL_WAREHOUSES}>Todos los almacenes</option> : null}
        {warehouses.map((warehouse) => (
          <option key={warehouse.id} value={String(warehouse.id)}>
            {warehouse.name}
          </option>
        ))}
      </select>
    </label>
  )
}
