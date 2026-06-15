import { Warehouse } from 'lucide-react'
import { ALL_STORES, ALL_WAREHOUSES } from '@/lib/warehouse-storage'
import { useWarehouse } from '@/features/warehouse/warehouse-context'

export function WarehouseSelector() {
  const { value, setValue, warehouses, isAdmin } = useWarehouse()

  if (warehouses.length === 0) return null

  const almacenes = warehouses.filter((w) => w.kind !== 'tienda')
  const tiendas = warehouses.filter((w) => w.kind === 'tienda')

  return (
    <label className="flex items-center gap-2 rounded-md border border-[#c9c5b8] bg-white px-2 py-1">
      <Warehouse className="size-4 text-[#16372f]" aria-hidden />
      <span className="sr-only">Ubicación</span>
      <select
        className="max-w-[200px] bg-transparent text-sm font-medium text-[#20231f] outline-none"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      >
        {isAdmin ? (
          <>
            <option value={ALL_WAREHOUSES}>Todos los almacenes</option>
            {tiendas.length > 0 ? <option value={ALL_STORES}>Todas las tiendas</option> : null}
            <optgroup label="Almacenes">
              {almacenes.map((w) => <option key={w.id} value={String(w.id)}>{w.name}</option>)}
            </optgroup>
            {tiendas.length > 0 ? (
              <optgroup label="Tiendas">
                {tiendas.map((w) => <option key={w.id} value={String(w.id)}>{w.name}</option>)}
              </optgroup>
            ) : null}
          </>
        ) : (
          almacenes.map((w) => <option key={w.id} value={String(w.id)}>{w.name}</option>)
        )}
      </select>
    </label>
  )
}
