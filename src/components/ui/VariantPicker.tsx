import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Product, Variant } from '@/api/resources'

interface VariantOption extends Variant {
  productName: string
  minStock: number
}

interface VariantPickerProps {
  products: Product[]
  value: number | ''
  onChange: (value: number | '') => void
}

export function VariantPicker({ products, value, onChange }: VariantPickerProps) {
  const [search, setSearch] = useState('')
  const variants = useMemo<VariantOption[]>(() => products.flatMap((product) =>
    product.variants.map((variant) => ({ ...variant, productName: product.name, minStock: product.min_stock })),
  ), [products])
  const filtered = variants.filter((variant) => {
    const haystack = `${variant.productName} ${variant.sku}`.toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#3d443b]">Variante</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#687168]" />
        <input
          className="h-11 w-full rounded-md border border-[#c9c5b8] bg-white pl-10 pr-3 outline-none focus:border-[#16372f] focus:ring-4 focus:ring-[#16372f]/12"
          placeholder="Buscar producto o SKU"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <select
        className="h-12 w-full rounded-md border border-[#c9c5b8] bg-white px-3 text-base outline-none focus:border-[#16372f] focus:ring-4 focus:ring-[#16372f]/12"
        value={value}
        onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
      >
        <option value="">Seleccionar variante</option>
        {filtered.map((variant) => (
          <option key={variant.id} value={variant.id}>
            {variant.productName} · {variant.sku} · stock {variant.current_stock} · USD {variant.price_with_tax}
          </option>
        ))}
      </select>
    </div>
  )
}
