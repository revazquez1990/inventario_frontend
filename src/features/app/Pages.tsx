import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownToLine,
  BadgeDollarSign,
  Edit3,
  FileSpreadsheet,
  FileText,
  PlusCircle,
  PackagePlus,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  Users,
  XCircle,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { apiClient, extractApiError } from '@/api/client'
import {
  type Movement,
  type ImportPreview,
  type OptionItem,
  useDelete,
  useList,
  useMovements,
  usePost,
  useProducts,
  usePut,
  useUsers,
} from '@/api/resources'
import { AppShell } from '@/components/layout/AppShell'
import { ConfirmDestructiveModal } from '@/components/ui/ConfirmDestructiveModal'
import { MoneyDisplay } from '@/components/ui/MoneyDisplay'
import { MovementCodeChip } from '@/components/ui/MovementCodeChip'
import { StockBadge } from '@/components/ui/StockBadge'
import { VariantPicker } from '@/components/ui/VariantPicker'
import { formDataToObject, numberOrZero, stringOrEmpty } from '@/features/app/forms'
import type { User } from '@/types/api'

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#687168]">{eyebrow}</p>
      <h1 className="mt-1 text-3xl font-semibold text-[#20231f]">{title}</h1>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-md border border-[#d8d2c2] bg-[#fbfaf5] p-5">{children}</section>
}

function Field({ label, name, type = 'text', required = false, defaultValue = '' }: { label: string; name: string; type?: string; required?: boolean; defaultValue?: string | number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[#3d443b]">{label}</span>
      <input
        className="h-11 w-full rounded-md border border-[#c9c5b8] bg-white px-3 text-base outline-none focus:border-[#16372f] focus:ring-4 focus:ring-[#16372f]/12"
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
      />
    </label>
  )
}

function SelectField({ label, name, children, required = false, value, onChange, defaultValue }: { label: string; name: string; children: React.ReactNode; required?: boolean; value?: string | number; onChange?: (value: string) => void; defaultValue?: string | number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[#3d443b]">{label}</span>
      <select
        className="h-11 w-full rounded-md border border-[#c9c5b8] bg-white px-3 text-base outline-none focus:border-[#16372f] focus:ring-4 focus:ring-[#16372f]/12"
        name={name}
        required={required}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {children}
      </select>
    </label>
  )
}

function ErrorText({ error }: { error: unknown }) {
  if (!error) return null
  return <p className="rounded-md bg-[#fff1ea] px-3 py-2 text-sm text-[#8a2d1b]">{extractApiError(error).message}</p>
}

function SubmitButton({ label, icon = <Save className="size-4" /> }: { label: string; icon?: React.ReactNode }) {
  return (
    <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#16372f] px-4 font-semibold text-white hover:bg-[#0f2b25]" type="submit">
      {icon}
      {label}
    </button>
  )
}

function ActionButton({ children, onClick, danger = false }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium ${danger ? 'border-[#d69a8a] text-[#8a2d1b] hover:bg-[#fff1ea]' : 'border-[#c9c5b8] text-[#3d443b] hover:bg-[#eee9dc]'}`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function StatusSelect({ name = 'status', defaultValue = 'active' }: { name?: string; defaultValue?: string }) {
  return (
    <SelectField label="Estado" name={name} defaultValue={defaultValue}>
      <option value="active">Activo</option>
      <option value="inactive">Inactivo</option>
    </SelectField>
  )
}

export function DashboardPageFull() {
  const kpis = useQuery({
    queryKey: ['kpis'],
    queryFn: async () => (await apiClient.get('/dashboard/kpis')).data.data as Record<string, number | string>,
  })
  const rate = useQuery({
    queryKey: ['rate-today'],
    queryFn: async () => (await apiClient.get('/exchange-rate/today')).data as { exists: boolean; rate?: { usd_to_cup: string } },
  })
  const metrics = [
    ['Ventas de hoy', `USD ${Number(kpis.data?.sales_total_usd ?? 0).toFixed(2)}`],
    ['Total CUP', `CUP ${Number(kpis.data?.sales_total_cup ?? 0).toFixed(2)}`],
    ['Movimientos', String(kpis.data?.movements_count ?? 0)],
    ['Bajo mínimo', String(kpis.data?.low_stock_count ?? 0)],
  ]

  return (
    <AppShell>
      <SectionTitle eyebrow="Dashboard" title="Resumen operativo" />
      {!rate.data?.exists ? (
        <div className="mb-4 rounded-md border border-[#dfb84b] bg-[#fff7d7] px-4 py-3 text-sm font-medium text-[#6d5312]">
          Ratio = 1 — no se ha definido el ratio del día
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm font-medium text-[#687168]">{label}</p>
            <p className="mt-4 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}

export function CategoriesPage() {
  return <SimpleCatalogPage title="Categorías" endpoint="/categories" queryKey="categories" fields={[['name', 'Nombre'], ['description', 'Descripción']]} />
}

export function UnitsPage() {
  return <SimpleCatalogPage title="Unidades" endpoint="/units" queryKey="units" fields={[['name', 'Nombre'], ['abbreviation', 'Abreviatura']]} />
}

export function SuppliersPage() {
  return <SimpleCatalogPage title="Proveedores" endpoint="/suppliers" queryKey="suppliers" fields={[['name', 'Nombre'], ['contact_name', 'Contacto'], ['phone', 'Teléfono'], ['email', 'Correo']]} />
}

function SimpleCatalogPage({ title, endpoint, queryKey, fields }: { title: string; endpoint: string; queryKey: string; fields: Array<[string, string]> }) {
  const items = useList<Record<string, string | number>>(queryKey, endpoint)
  const create = usePost<Record<string, string>>([queryKey])
  const update = usePut<Record<string, string>>([queryKey])
  const remove = useDelete([queryKey])
  const [editing, setEditing] = useState<Record<string, string | number> | null>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = formDataToObject(new FormData(event.currentTarget))
    if (editing) {
      update.mutate({ path: `${endpoint}/${editing.id}`, input })
    } else {
      create.mutate({ path: endpoint, input })
    }
    event.currentTarget.reset()
    setEditing(null)
  }

  return (
    <AppShell>
      <SectionTitle eyebrow="Catálogo" title={title} />
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card>
          <form key={String(editing?.id ?? 'new')} className="space-y-4" onSubmit={submit}>
            {fields.map(([name, label]) => <Field key={name} label={label} name={name} required={name === 'name'} defaultValue={editing?.[name] ?? ''} />)}
            <StatusSelect defaultValue={String(editing?.status ?? 'active')} />
            <ErrorText error={create.error ?? update.error ?? remove.error} />
            <div className="flex flex-wrap gap-2">
              <SubmitButton label={editing ? 'Actualizar' : 'Guardar'} icon={editing ? <Edit3 className="size-4" /> : <Plus className="size-4" />} />
              {editing ? <button className="h-11 rounded-md border border-[#c9c5b8] px-4 font-medium" type="button" onClick={() => setEditing(null)}>Cancelar</button> : null}
            </div>
          </form>
        </Card>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody>
                {(items.data ?? []).map((item) => (
                  <tr key={String(item.id)} className="border-b border-[#e8e3d4] last:border-0">
                    {fields.slice(0, 3).map(([name]) => <td key={name} className="py-3 pr-4">{String(item[name] ?? '')}</td>)}
                    <td className="py-3 text-[#687168]">{String(item.status ?? '')}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <ActionButton onClick={() => setEditing(item)}><Edit3 className="size-4" /> Editar</ActionButton>
                        <ActionButton danger onClick={() => remove.mutate(`${endpoint}/${item.id}`)}><Trash2 className="size-4" /> Eliminar</ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}

export function AttributesPage() {
  const attributes = useList<Array<OptionItem & { values: Array<{ id: number; value: string }> }>[number]>('attributes', '/attributes')
  const create = usePost<Record<string, string>>(['attributes'])
  const createValue = usePost<Record<string, string>>(['attributes'])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    create.mutate({ path: '/attributes', input: formDataToObject(new FormData(event.currentTarget)) })
    event.currentTarget.reset()
  }

  function submitValue(event: FormEvent<HTMLFormElement>, attributeId: number) {
    event.preventDefault()
    createValue.mutate({ path: `/attributes/${attributeId}/values`, input: formDataToObject(new FormData(event.currentTarget)) })
    event.currentTarget.reset()
  }

  return (
    <AppShell>
      <SectionTitle eyebrow="Catálogo" title="Atributos y valores" />
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card>
          <form className="space-y-4" onSubmit={submit}>
            <Field label="Nombre del atributo" name="name" required />
            <ErrorText error={create.error} />
            <SubmitButton label="Crear atributo" icon={<Plus className="size-4" />} />
          </form>
        </Card>
        <div className="grid gap-3">
          {(attributes.data ?? []).map((attribute) => (
            <Card key={attribute.id}>
              <p className="font-semibold">{attribute.name}</p>
              <p className="mt-2 text-sm text-[#687168]">{attribute.values.map((value) => value.value).join(', ') || 'Sin valores'}</p>
              <form className="mt-3 flex gap-2" onSubmit={(event) => submitValue(event, attribute.id)}>
                <input className="h-10 min-w-0 flex-1 rounded-md border border-[#c9c5b8] px-3 text-sm" name="value" placeholder="Nuevo valor" required />
                <button className="h-10 rounded-md border border-[#c9c5b8] px-3 text-sm font-medium" type="submit">Agregar</button>
              </form>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [belowMin, setBelowMin] = useState(false)
  const params = useMemo(() => {
    const query = new URLSearchParams()
    if (search) query.set('search', search)
    if (categoryFilter) query.set('category_id', categoryFilter)
    if (belowMin) query.set('below_min', 'true')
    const value = query.toString()
    return value ? `?${value}` : ''
  }, [belowMin, categoryFilter, search])
  const products = useProducts(params)
  const categories = useList<OptionItem>('categories', '/categories')
  const units = useList<OptionItem>('units', '/units')
  const create = usePost<Record<string, unknown>>(['products'])
  const updateProduct = usePut<Record<string, unknown>>(['products'])
  const updateVariant = usePut<Record<string, unknown>>(['products'])
  const remove = useDelete(['products'])
  const [editingProduct, setEditingProduct] = useState<number | null>(null)
  const [variants, setVariants] = useState<Array<{ sku: string; price_with_tax: string }>>([{ sku: '', price_with_tax: '' }])
  const [importFile, setImportFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await apiClient.post<{ data: ImportPreview }>('/products/import/preview', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      return data.data
    },
    onSuccess: setPreview,
  })
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return (await apiClient.post('/products/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data
    },
    onSuccess: () => {
      setPreview(null)
      setImportFile(null)
      void products.refetch()
    },
  })

  async function downloadTemplate(format: 'csv' | 'xlsx') {
    const response = await apiClient.get(`/products/import-template?format=${format}`, { responseType: 'blob' })
    const url = URL.createObjectURL(response.data as Blob)
    const link = document.createElement('a')
    link.href = url
    link.download = format === 'xlsx' ? 'plantilla_productos.xlsx' : 'plantilla_productos.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = formDataToObject(new FormData(event.currentTarget))
    const input = {
      name: stringOrEmpty(data.name),
      description: stringOrEmpty(data.description),
      sku_base: stringOrEmpty(data.sku_base),
      category_id: numberOrZero(stringOrEmpty(data.category_id)),
      unit_id: numberOrZero(stringOrEmpty(data.unit_id)),
      min_stock: numberOrZero(stringOrEmpty(data.min_stock)),
      variants: variants.filter((variant) => variant.sku.trim() !== '').map((variant) => ({ sku: variant.sku, price_with_tax: numberOrZero(variant.price_with_tax) })),
    }
    if (editingProduct) {
      updateProduct.mutate({ path: `/products/${editingProduct}`, input })
    } else {
      create.mutate({ path: '/products', input })
    }
    event.currentTarget.reset()
    setVariants([{ sku: '', price_with_tax: '' }])
    setEditingProduct(null)
  }

  function previewUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const file = new FormData(event.currentTarget).get('file')
    if (file instanceof File) {
      setImportFile(file)
      previewMutation.mutate(file)
    }
  }

  function editProduct(productId: number) {
    const product = products.data?.find((item) => item.id === productId)
    if (!product) return
    setEditingProduct(product.id)
    setVariants(product.variants.map((variant) => ({ sku: variant.sku, price_with_tax: variant.price_with_tax })))
  }

  return (
    <AppShell>
      <SectionTitle eyebrow="Inventario" title="Productos y variantes" />
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="space-y-5">
          <Card>
            <h2 className="mb-4 font-semibold">{editingProduct ? 'Editar producto' : 'Crear producto'}</h2>
            <form key={editingProduct ?? 'new'} className="space-y-4" onSubmit={submit}>
              <Field label="Nombre" name="name" required defaultValue={products.data?.find((item) => item.id === editingProduct)?.name ?? ''} />
              <Field label="SKU base" name="sku_base" required defaultValue={products.data?.find((item) => item.id === editingProduct)?.sku_base ?? ''} />
              <Field label="Descripción" name="description" defaultValue={products.data?.find((item) => item.id === editingProduct)?.description ?? ''} />
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField label="Categoría" name="category_id" required defaultValue={products.data?.find((item) => item.id === editingProduct)?.category?.id ?? ''}>
                  <option value="">Seleccionar</option>
                  {(categories.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </SelectField>
                <SelectField label="Unidad" name="unit_id" required defaultValue={products.data?.find((item) => item.id === editingProduct)?.unit?.id ?? ''}>
                  <option value="">Seleccionar</option>
                  {(units.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </SelectField>
              </div>
              <Field label="Stock mínimo" name="min_stock" type="number" required defaultValue={products.data?.find((item) => item.id === editingProduct)?.min_stock ?? 0} />
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium">Variantes</h3>
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-[#c9c5b8] px-3 text-sm font-medium"
                    type="button"
                    onClick={() => setVariants((current) => [...current, { sku: '', price_with_tax: current[0]?.price_with_tax ?? '' }])}
                  >
                    <PlusCircle className="size-4" /> Variante
                  </button>
                </div>
                {variants.map((variant, index) => (
                  <div key={index} className="grid gap-2 rounded-md border border-[#e8e3d4] bg-white p-3 sm:grid-cols-[1fr_120px_44px]">
                    <input className="h-11 rounded-md border border-[#c9c5b8] px-3" placeholder="SKU variante" value={variant.sku} onChange={(event) => setVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, sku: event.target.value } : item))} />
                    <input className="h-11 rounded-md border border-[#c9c5b8] px-3" placeholder="USD" type="number" value={variant.price_with_tax} onChange={(event) => setVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, price_with_tax: event.target.value } : item))} />
                    <button className="grid size-11 place-items-center rounded-md border border-[#d69a8a] text-[#8a2d1b]" type="button" onClick={() => setVariants((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></button>
                  </div>
                ))}
              </div>
              <ErrorText error={create.error ?? updateProduct.error} />
              <div className="flex flex-wrap gap-2">
                <SubmitButton label={editingProduct ? 'Actualizar producto' : 'Crear producto'} icon={<PackagePlus className="size-4" />} />
                {editingProduct ? <button className="h-11 rounded-md border border-[#c9c5b8] px-4 font-medium" type="button" onClick={() => { setEditingProduct(null); setVariants([{ sku: '', price_with_tax: '' }]) }}>Cancelar</button> : null}
              </div>
            </form>
          </Card>
          <Card>
            <h2 className="mb-4 font-semibold">Importar productos</h2>
            <div className="mb-4 flex flex-wrap gap-2">
              <button className="inline-flex h-10 items-center gap-2 rounded-md border border-[#c9c5b8] px-3 text-sm font-medium" type="button" onClick={() => void downloadTemplate('csv')}><ArrowDownToLine className="size-4" /> CSV</button>
              <button className="inline-flex h-10 items-center gap-2 rounded-md border border-[#c9c5b8] px-3 text-sm font-medium" type="button" onClick={() => void downloadTemplate('xlsx')}><FileSpreadsheet className="size-4" /> Excel</button>
            </div>
            <form className="space-y-4" onSubmit={previewUpload}>
              <input className="block w-full text-sm" name="file" type="file" accept=".csv,.xlsx" required />
              <ErrorText error={previewMutation.error ?? importMutation.error} />
              <SubmitButton label="Validar archivo" icon={<Upload className="size-4" />} />
            </form>
            {preview ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium">{preview.valid_rows} filas válidas · {preview.errors_count} errores</p>
                <div className="max-h-56 overflow-auto rounded-md border border-[#e8e3d4] bg-white">
                  {preview.rows.map((row) => (
                    <div key={row.row} className="border-b border-[#e8e3d4] p-3 text-sm last:border-0">
                      <p className="font-medium">Fila {row.row}: {row.data.product_name} · {row.data.variant_sku}</p>
                      {row.errors.length > 0 ? <p className="mt-1 text-[#8a2d1b]">{row.errors.join(' ')}</p> : <p className="mt-1 text-[#276143]">Lista para importar</p>}
                    </div>
                  ))}
                </div>
                <button className="h-11 rounded-md bg-[#16372f] px-4 font-semibold text-white disabled:opacity-50" type="button" disabled={preview.errors_count > 0 || !importFile} onClick={() => importFile && importMutation.mutate(importFile)}>Confirmar importación</button>
              </div>
            ) : null}
          </Card>
        </div>
        <Card>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <input className="h-11 rounded-md border border-[#c9c5b8] px-3" placeholder="Buscar producto o SKU" value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className="h-11 rounded-md border border-[#c9c5b8] px-3" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="">Todas</option>
              {(categories.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <label className="flex min-h-11 items-center gap-2 text-sm font-medium"><input checked={belowMin} type="checkbox" onChange={(event) => setBelowMin(event.target.checked)} /> Bajo mínimo</label>
          </div>
          <div className="grid gap-3">
            {(products.data ?? []).map((product) => (
              <article key={product.id} className="rounded-md border border-[#e8e3d4] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{product.name}</h2>
                    <p className="text-sm text-[#687168]">{product.sku_base} · {product.category?.name} · {product.unit?.name}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StockBadge stock={product.total_stock} min={product.min_stock} />
                    <ActionButton onClick={() => editProduct(product.id)}><Edit3 className="size-4" /> Editar</ActionButton>
                    <ActionButton danger onClick={() => remove.mutate(`/products/${product.id}`)}><Trash2 className="size-4" /> Eliminar</ActionButton>
                  </div>
                </div>
                <div className="mt-3 grid gap-2">
                  {product.variants.map((variant) => (
                    <div key={variant.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-[#f8f6ef] px-3 py-2 text-sm text-[#3d443b]">
                      <span>{variant.sku} · <MoneyDisplay compact usd={variant.price_with_tax} /> · {variant.current_stock} unidades · {variant.status}</span>
                      <div className="flex flex-wrap gap-2">
                        <ActionButton onClick={() => {
                          const nextPrice = window.prompt('Nuevo precio USD', String(variant.price_with_tax))
                          if (nextPrice) updateVariant.mutate({ path: `/products/variants/${variant.id}`, input: { price_with_tax: Number(nextPrice) } })
                        }}><Edit3 className="size-4" /> Precio</ActionButton>
                        <ActionButton onClick={() => updateVariant.mutate({ path: `/products/variants/${variant.id}`, input: { status: variant.status === 'active' ? 'inactive' : 'active' } })}>{variant.status === 'active' ? 'Inactivar' : 'Activar'}</ActionButton>
                        <ActionButton danger onClick={() => remove.mutate(`/products/variants/${variant.id}`)}><Trash2 className="size-4" /> Eliminar</ActionButton>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}

export function MovementsPage() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ type: '', status: '', code: '' })
  const movementParams = useMemo(() => {
    const query = new URLSearchParams({ per_page: '50' })
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.set(key, value)
    })
    return `?${query.toString()}`
  }, [filters])
  const movements = useMovements(movementParams)
  const products = useProducts()
  const suppliers = useList<OptionItem>('suppliers', '/suppliers')
  const create = usePost<Record<string, unknown>>(['movements', 'products', 'kpis'])
  const [type, setType] = useState('venta')
  const [supplierId, setSupplierId] = useState('')
  const [reason, setReason] = useState('')
  const [adjustmentSubtype, setAdjustmentSubtype] = useState('merma')
  const [lines, setLines] = useState<Array<{ variant_id: number | ''; quantity: string; unit_price_with_tax_usd: string }>>([{ variant_id: '', quantity: '1', unit_price_with_tax_usd: '' }])
  const [voiding, setVoiding] = useState<Movement | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const variantsById = useMemo(() => new Map((products.data ?? []).flatMap((product) => product.variants.map((variant) => [variant.id, { ...variant, product }]))), [products.data])
  const totalUsd = lines.reduce((sum, line) => {
    const variant = typeof line.variant_id === 'number' ? variantsById.get(line.variant_id) : undefined
    const price = type === 'entrada' && line.unit_price_with_tax_usd ? Number(line.unit_price_with_tax_usd) : Number(variant?.price_with_tax ?? 0)
    return sum + price * Number(line.quantity || 0)
  }, 0)
  const voidMutation = useMutation({
    mutationFn: async ({ id, reason_void }: { id: number; reason_void: string }) => (await apiClient.post(`/movements/${id}/anular`, { reason_void })).data,
    onSuccess: async () => {
      setVoiding(null)
      setVoidReason('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`movements${movementParams}`] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ])
    },
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload: Record<string, unknown> = {
      items: lines
        .filter((line) => line.variant_id !== '' && Number(line.quantity) !== 0)
        .map((line) => ({
          variant_id: line.variant_id,
          quantity: numberOrZero(line.quantity),
          unit_price_with_tax_usd: line.unit_price_with_tax_usd ? numberOrZero(line.unit_price_with_tax_usd) : undefined,
        })),
    }
    if (type === 'entrada') payload.supplier_id = numberOrZero(supplierId)
    if (type === 'salida') payload.reason = reason
    if (type === 'ajuste') {
      payload.reason = reason
      payload.adjustment_subtype = adjustmentSubtype
    }
    create.mutate({ path: `/movements/${type}`, input: payload })
    setLines([{ variant_id: '', quantity: '1', unit_price_with_tax_usd: '' }])
    setReason('')
  }

  return (
    <AppShell>
      <SectionTitle eyebrow="Operaciones" title="Movimientos de inventario" />
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid grid-cols-4 gap-2">
              {['venta', 'entrada', 'salida', 'ajuste'].map((item) => (
                <button key={item} className={`h-10 rounded-md border text-sm capitalize ${type === item ? 'border-[#16372f] bg-[#16372f] text-white' : 'border-[#c9c5b8]'}`} type="button" onClick={() => setType(item)}>{item}</button>
              ))}
            </div>
            <div className="space-y-3">
              {lines.map((line, index) => {
                const selected = typeof line.variant_id === 'number' ? variantsById.get(line.variant_id) : undefined
                return (
                  <div key={index} className="rounded-md border border-[#e8e3d4] bg-white p-3">
                    <VariantPicker products={products.data ?? []} value={line.variant_id} onChange={(value) => setLines((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, variant_id: value } : item))} />
                    <div className="mt-3 grid gap-2 sm:grid-cols-[100px_1fr_44px]">
                      <input className="h-11 rounded-md border border-[#c9c5b8] px-3" type="number" value={line.quantity} onChange={(event) => setLines((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: event.target.value } : item))} />
                      {type === 'entrada' ? <input className="h-11 rounded-md border border-[#c9c5b8] px-3" placeholder="Precio compra USD" type="number" value={line.unit_price_with_tax_usd} onChange={(event) => setLines((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, unit_price_with_tax_usd: event.target.value } : item))} /> : <p className="flex min-h-11 items-center text-sm text-[#687168]">{selected ? <MoneyDisplay compact usd={selected.price_with_tax} /> : 'Sin variante'}</p>}
                      <button className="grid size-11 place-items-center rounded-md border border-[#d69a8a] text-[#8a2d1b]" type="button" onClick={() => setLines((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></button>
                    </div>
                  </div>
                )
              })}
              <button className="h-11 rounded-md border border-[#c9c5b8] px-4 font-medium" type="button" onClick={() => setLines((current) => [...current, { variant_id: '', quantity: '1', unit_price_with_tax_usd: '' }])}>Agregar línea</button>
            </div>
            {type === 'entrada' ? (
              <SelectField label="Proveedor" name="supplier_id" required value={supplierId} onChange={setSupplierId}>
                <option value="">Seleccionar</option>
                {(suppliers.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </SelectField>
            ) : null}
            {type === 'salida' || type === 'ajuste' ? (
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Motivo</span>
                <input className="h-11 w-full rounded-md border border-[#c9c5b8] px-3" value={reason} onChange={(event) => setReason(event.target.value)} required={type === 'ajuste'} />
              </label>
            ) : null}
            {type === 'ajuste' ? (
              <SelectField label="Subtipo" name="adjustment_subtype" required value={adjustmentSubtype} onChange={setAdjustmentSubtype}>
                <option value="merma">Merma</option>
                <option value="rotura">Rotura</option>
                <option value="conteo_fisico">Conteo físico</option>
              </SelectField>
            ) : null}
            <div className="rounded-md bg-[#edf4ef] px-3 py-2 text-sm">
              Total estimado: <MoneyDisplay usd={totalUsd} />
            </div>
            <ErrorText error={create.error} />
            <SubmitButton label="Registrar" icon={<RefreshCw className="size-4" />} />
          </form>
        </Card>
        <Card>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <select className="h-11 rounded-md border border-[#c9c5b8] px-3" value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}>
              <option value="">Tipo</option>
              {['entrada', 'salida', 'venta', 'ajuste', 'anulacion'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="h-11 rounded-md border border-[#c9c5b8] px-3" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">Estado</option>
              <option value="activo">Activo</option>
              <option value="anulado">Anulado</option>
            </select>
            <input className="h-11 rounded-md border border-[#c9c5b8] px-3" placeholder="Código" value={filters.code} onChange={(event) => setFilters((current) => ({ ...current, code: event.target.value }))} />
          </div>
          <div className="space-y-3">
            {(movements.data?.data ?? []).map((movement: Movement) => (
              <article key={movement.id} className="rounded-md border border-[#e8e3d4] bg-white p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <MovementCodeChip code={movement.code} status={movement.status} />
                  <MoneyDisplay usd={movement.totals.with_tax_usd} cup={movement.totals.with_tax_cup} rate={movement.exchange_rate_snapshot} />
                </div>
                <p className="mt-1 text-sm text-[#687168]">{movement.status} · ratio {movement.exchange_rate_snapshot} · impuesto {movement.tax_rate_snapshot}%</p>
                <p className="mt-2 text-sm text-[#3d443b]">{movement.items.map((item) => `${item.sku} x ${item.quantity}`).join(', ')}</p>
                {movement.status === 'activo' && movement.type !== 'anulacion' ? (
                  <div className="mt-3">
                    <ActionButton danger onClick={() => setVoiding(movement)}><XCircle className="size-4" /> Anular</ActionButton>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </Card>
      </div>
      <ConfirmDestructiveModal
        open={Boolean(voiding)}
        title="Anular movimiento"
        body={`Se creará un movimiento de anulación para ${voiding?.code ?? ''}.`}
        reason={voidReason}
        requireReason
        onReasonChange={setVoidReason}
        onCancel={() => setVoiding(null)}
        onConfirm={() => voiding && voidMutation.mutate({ id: voiding.id, reason_void: voidReason })}
      />
    </AppShell>
  )
}

export function SettingsPage() {
  const rate = usePost<Record<string, number>>(['rate-today'])
  const tax = usePut<Record<string, string>>(['tax-rate'])
  const business = useQuery({
    queryKey: ['business-settings'],
    queryFn: async () => (await apiClient.get('/settings/business')).data.data as Record<string, string>,
  })
  const businessUpdate = usePut<Record<string, string>>(['business-settings'])

  function saveRate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = formDataToObject(new FormData(event.currentTarget))
    rate.mutate({ path: '/exchange-rate', input: { usd_to_cup: numberOrZero(stringOrEmpty(data.usd_to_cup)) } })
  }

  function saveTax(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = formDataToObject(new FormData(event.currentTarget))
    tax.mutate({ path: '/settings/tax-rate', input: { value: stringOrEmpty(data.value) } })
  }

  function saveBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    businessUpdate.mutate({ path: '/settings/business', input: formDataToObject(new FormData(event.currentTarget)) })
  }

  return (
    <AppShell>
      <SectionTitle eyebrow="Configuración" title="Ratio, impuesto y negocio" />
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <form className="space-y-4" onSubmit={saveRate}>
            <Field label="Ratio USD/CUP de hoy" name="usd_to_cup" type="number" required />
            <ErrorText error={rate.error} />
            <SubmitButton label="Guardar ratio" icon={<BadgeDollarSign className="size-4" />} />
          </form>
        </Card>
        <Card>
          <form className="space-y-4" onSubmit={saveTax}>
            <Field label="Tasa de impuesto (%)" name="value" type="number" required />
            <ErrorText error={tax.error} />
            <SubmitButton label="Guardar impuesto" />
          </form>
        </Card>
        <Card>
          <form key={business.data?.business_name ?? 'business'} className="space-y-4" onSubmit={saveBusiness}>
            <Field label="Nombre del negocio" name="business_name" required defaultValue={business.data?.business_name ?? ''} />
            <Field label="Dirección" name="business_address" defaultValue={business.data?.business_address ?? ''} />
            <Field label="Teléfono" name="business_phone" defaultValue={business.data?.business_phone ?? ''} />
            <ErrorText error={businessUpdate.error} />
            <SubmitButton label="Guardar negocio" />
          </form>
        </Card>
      </div>
    </AppShell>
  )
}

export function ReportsPage() {
  const lowStock = useList<Record<string, string | number>>('low-stock', '/reports/low-stock')
  const sales = useQuery({
    queryKey: ['sales-report'],
    queryFn: async () => (await apiClient.get('/dashboard/sales')).data as { totals: Record<string, number> },
  })
  async function downloadReport(path: string, filename: string) {
    const response = await apiClient.get(path, { responseType: 'blob' })
    const url = URL.createObjectURL(response.data as Blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell>
      <SectionTitle eyebrow="Reportes" title="Ventas y bajo mínimo" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Ventas del período</h2>
          <p className="text-3xl font-semibold">USD {Number(sales.data?.totals.total_usd ?? 0).toFixed(2)}</p>
          <p className="mt-2 text-sm text-[#687168]">{sales.data?.totals.sales_count ?? 0} ventas registradas</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton onClick={() => void downloadReport('/dashboard/sales?format=csv', 'reporte_ventas.csv')}><ArrowDownToLine className="size-4" /> CSV</ActionButton>
            <ActionButton onClick={() => void downloadReport('/dashboard/sales?format=xlsx', 'reporte_ventas.xlsx')}><FileSpreadsheet className="size-4" /> Excel</ActionButton>
            <ActionButton onClick={() => void downloadReport('/dashboard/sales?format=pdf', 'reporte_ventas.pdf')}><FileText className="size-4" /> PDF</ActionButton>
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Productos bajo mínimo</h2>
          <div className="space-y-2">
            {(lowStock.data ?? []).map((item) => (
              <p key={String(item.id)} className="rounded-md bg-white px-3 py-2 text-sm">{String(item.name)} · stock {String(item.total_stock)} / mínimo {String(item.min_stock)}</p>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton onClick={() => void downloadReport('/reports/low-stock?format=xlsx', 'productos_bajo_minimo.xlsx')}><FileSpreadsheet className="size-4" /> Excel</ActionButton>
            <ActionButton onClick={() => void downloadReport('/reports/low-stock?format=pdf', 'productos_bajo_minimo.pdf')}><FileText className="size-4" /> PDF</ActionButton>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}

export function UsersPage() {
  const users = useUsers()
  const create = usePost<Record<string, string>>(['users'])
  const update = usePut<Record<string, string>>(['users'])
  const [editing, setEditing] = useState<User | null>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = formDataToObject(new FormData(event.currentTarget))
    if (editing && input.password === '') {
      delete input.password
    }
    if (editing) {
      update.mutate({ path: `/users/${editing.id}`, input })
    } else {
      create.mutate({ path: '/users', input })
    }
    event.currentTarget.reset()
    setEditing(null)
  }

  return (
    <AppShell>
      <SectionTitle eyebrow="Administración" title="Usuarios" />
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card>
          <form key={editing?.id ?? 'new-user'} className="space-y-4" onSubmit={submit}>
            <Field label="Nombre" name="name" required defaultValue={editing?.name ?? ''} />
            <Field label="Correo" name="email" type="email" required defaultValue={editing?.email ?? ''} />
            <Field label="Contraseña" name="password" type="password" required={!editing} />
            <SelectField label="Rol" name="role" required defaultValue={editing?.role ?? 'almacenero'}>
              <option value="almacenero">Almacenero</option>
              <option value="admin">Admin</option>
            </SelectField>
            <StatusSelect defaultValue={editing?.status ?? 'active'} />
            <ErrorText error={create.error ?? update.error} />
            <div className="flex flex-wrap gap-2">
              <SubmitButton label={editing ? 'Actualizar usuario' : 'Crear usuario'} icon={<Users className="size-4" />} />
              {editing ? <button className="h-11 rounded-md border border-[#c9c5b8] px-4 font-medium" type="button" onClick={() => setEditing(null)}>Cancelar</button> : null}
            </div>
          </form>
        </Card>
        <Card>
          <div className="space-y-2">
            {(users.data?.data ?? []).map((user: User) => (
              <div key={user.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-sm">
                <span>{user.name} · {user.email} · {user.role} · {user.status}</span>
                <ActionButton onClick={() => setEditing(user)}><Edit3 className="size-4" /> Editar</ActionButton>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
