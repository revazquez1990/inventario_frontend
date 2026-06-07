import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Product } from '@/api/resources'

interface ProductPickerProps {
  products: Product[]
  value: number | ''
  onChange: (value: number | '') => void
}

export function VariantPicker({ products, value, onChange }: ProductPickerProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = value !== '' ? products.find((p) => p.id === value) : undefined

  useEffect(() => {
    if (value === '') {
      setSearch('')
    } else if (selected) {
      setSearch(`${selected.name} · ${selected.code}`)
    }
  }, [value, selected])

  const filtered = search.trim()
    ? products.filter((p) => `${p.name} ${p.code}`.toLowerCase().includes(search.toLowerCase()))
    : products.slice(0, 10)

  function handleInputChange(text: string) {
    setSearch(text)
    setOpen(true)
    if (text === '') onChange('')
  }

  function handleSelect(product: Product) {
    onChange(product.id)
    setSearch(`${product.name} · ${product.code}`)
    setOpen(false)
  }

  function handleClear() {
    onChange('')
    setSearch('')
    setOpen(false)
  }

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  return (
    <div ref={containerRef}>
      <label className="mb-1 block text-sm font-medium text-[#3d443b]">Producto</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#687168]" />
        <input
          className="h-11 w-full rounded-md border border-[#c9c5b8] bg-white pl-10 pr-9 outline-none focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed8]/12"
          placeholder="Buscar por nombre o código..."
          value={search}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
        />
        {(search !== '' || value !== '') && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-[#687168] hover:text-[#3d443b]"
            onClick={handleClear}
          >
            <X className="size-4" />
          </button>
        )}
        {open && filtered.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-[#c9c5b8] bg-white shadow-lg">
            {filtered.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  className={`flex w-full cursor-pointer flex-col px-3 py-2 text-left text-sm hover:bg-[#edf4ef] ${value === product.id ? 'bg-[#edf4ef]' : ''}`}
                  onClick={() => handleSelect(product)}
                >
                  <span className="font-medium">{product.name}</span>
                  <span className="text-xs text-[#687168]">
                    Código: {product.code} · Stock: {product.quantity} · USD {product.price}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {open && search.trim() !== '' && filtered.length === 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-md border border-[#c9c5b8] bg-white px-3 py-2 text-sm text-[#687168] shadow-lg">
            Sin resultados para &ldquo;{search}&rdquo;
          </div>
        )}
      </div>
    </div>
  )
}
