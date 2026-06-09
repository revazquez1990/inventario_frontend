import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownToLine,
  BadgeDollarSign,
  ChevronDown,
  Edit3,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  PackagePlus,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import React, { useMemo, useState, type FormEvent } from 'react'
import { apiClient, extractApiError } from '@/api/client'
import {
  type Movement,
  type ImportPreview,
  type OptionItem,
  type Product,
  type ProductHistoryEntry,
  useAttributes,
  useDelete,
  useList,
  useMovements,
  usePost,
  useProducts,
  usePut,
  useUsers,
  useWarehouses,
} from '@/api/resources'
import { AppShell } from '@/components/layout/AppShell'
import { useWarehouse } from '@/features/warehouse/warehouse-context'
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

function Field({ label, name, type = 'text', required = false, defaultValue = '', onChange }: { label: string; name: string; type?: string; required?: boolean; defaultValue?: string | number; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[#3d443b]">{label}</span>
      <input
        className="h-11 w-full rounded-md border border-[#c9c5b8] bg-white px-3 text-base outline-none focus:border-[#16372f] focus:ring-4 focus:ring-[#16372f]/12"
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        onChange={onChange}
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
    <button className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#16372f] px-4 font-semibold text-white hover:bg-[#0f2b25]" type="submit">
      {icon}
      {label}
    </button>
  )
}

function ActionButton({ children, onClick, danger = false }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium ${danger ? 'border-[#d69a8a] text-[#8a2d1b] hover:bg-[#fff1ea]' : 'border-[#c9c5b8] text-[#3d443b] hover:bg-[#eee9dc]'}`}
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
    ['Sin stock', String(kpis.data?.low_stock_count ?? 0)],
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

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10" onClick={onClose}>
      <div className="my-4 w-full max-w-lg rounded-xl border border-[#e8e3d4] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#e8e3d4] px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="cursor-pointer rounded-md p-1 text-[#687168] hover:bg-[#eee9dc] hover:text-[#3d443b]" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-[#e8e3d4] pt-4">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between rounded-md py-1 text-sm font-semibold text-[#3d443b] hover:text-[#16372f]"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        <ChevronDown className={`size-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}

function ProductDetailModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [historyEnabled, setHistoryEnabled] = useState(false)
  const rateQuery = useQuery({
    queryKey: ['rate-today'],
    queryFn: async () => (await apiClient.get('/exchange-rate/today')).data as { exists: boolean; rate?: { usd_to_cup: string } },
  })
  const rate = Number(rateQuery.data?.rate?.usd_to_cup ?? 1)
  const historyQuery = useQuery({
    queryKey: ['product-history', product.id],
    queryFn: async () => (await apiClient.get<{ data: ProductHistoryEntry[] }>(`/products/${product.id}/movements`)).data.data,
    enabled: historyEnabled,
  })

  const typeColor: Record<string, string> = {
    entrada: 'bg-[#edf4ef] text-[#16372f]',
    salida: 'bg-[#fff1ea] text-[#8a2d1b]',
    venta: 'bg-[#fff1ea] text-[#8a2d1b]',
    ajuste: 'bg-[#f0f0f0] text-[#3d443b]',
    anulacion: 'bg-[#f0f0f0] text-[#687168] line-through',
  }

  return (
    <ModalShell title={product.name} onClose={onClose}>
      <div className="space-y-5">
        {product.image_url && (
          <img src={product.image_url} alt={product.name} className="h-36 w-36 rounded-lg border border-[#e8e3d4] object-cover" />
        )}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {([
            ['Código', product.code],
            ['Estado', product.status],
            ['Categoría', product.category?.name ?? '—'],
            ['Unidad', product.unit?.name ?? '—'],
            ['Referencia', product.reference || '—'],
            ['Fecha de alta', product.created_at ? new Date(product.created_at).toLocaleDateString('es-ES') : '—'],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-[#687168]">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
          <div>
            <dt className="text-xs text-[#687168]">Precio</dt>
            <dd className="font-medium"><MoneyDisplay compact usd={product.price} rate={rate} /></dd>
          </div>
          <div>
            <dt className="text-xs text-[#687168]">Stock actual</dt>
            <dd><StockBadge stock={product.quantity} /></dd>
          </div>
        </dl>

        {(product.attribute_values?.length ?? 0) > 0 ? (
          <div>
            <p className="mb-2 text-xs text-[#687168]">Variedad</p>
            <div className="flex flex-wrap gap-2">
              {(product.attribute_values ?? []).map((value) => (
                <span key={value.id} className="rounded-full border border-[#e8e3d4] bg-[#f8f6ef] px-3 py-1 text-xs font-medium text-[#3d443b]">
                  {value.attribute ? `${value.attribute}: ` : ''}{value.value}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <Accordion title="Historial de movimientos" >
          {!historyEnabled && (
            <button
              type="button"
              className="cursor-pointer text-sm text-[#16372f] underline"
              onClick={() => setHistoryEnabled(true)}
            >
              Cargar historial
            </button>
          )}
          {historyEnabled && historyQuery.isPending && <p className="text-sm text-[#687168]">Cargando...</p>}
          {historyEnabled && historyQuery.isError && <p className="text-sm text-[#8a2d1b]">Error al cargar el historial.</p>}
          {historyEnabled && historyQuery.data?.length === 0 && <p className="text-sm text-[#687168]">Sin movimientos registrados.</p>}
          <div className="space-y-2">
            {(historyQuery.data ?? []).map((entry) => (
              <div key={entry.id} className="rounded-md border border-[#e8e3d4] bg-[#f8f6ef] p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${typeColor[entry.type] ?? ''}`}>{entry.type}</span>
                  <span className="font-mono text-xs text-[#687168]">{entry.code}</span>
                  <span className="ml-auto text-xs text-[#687168]">{new Date(entry.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[#687168]">{entry.created_by ?? 'Sistema'}{entry.supplier ? ` · ${entry.supplier}` : ''}</span>
                  <span className={`font-semibold ${entry.type === 'entrada' ? 'text-[#276143]' : 'text-[#8a2d1b]'}`}>
                    {entry.type === 'entrada' ? '+' : '−'}{entry.quantity} uds
                  </span>
                </div>
                {entry.reason && <p className="mt-1 text-xs text-[#687168]">Motivo: {entry.reason}</p>}
                {entry.status === 'anulado' && <p className="mt-1 text-xs font-medium text-[#8a2d1b]">Anulado</p>}
              </div>
            ))}
          </div>
        </Accordion>
      </div>
    </ModalShell>
  )
}

function MovementDetailModal({ movement, onClose }: { movement: Movement; onClose: () => void }) {
  const detailQuery = useQuery({
    queryKey: ['movement-detail', movement.id],
    queryFn: async () => (await apiClient.get<{ data: Movement }>(`/movements/${movement.id}`)).data.data,
  })
  const m = detailQuery.data ?? movement

  const typeLabel: Record<string, string> = { entrada: 'Entrada', salida: 'Salida', venta: 'Venta', ajuste: 'Ajuste', anulacion: 'Anulación', transferencia: 'Transferencia' }
  const typeColor: Record<string, string> = {
    entrada: 'bg-[#edf4ef] text-[#16372f]',
    salida: 'bg-[#fff1ea] text-[#8a2d1b]',
    venta: 'bg-[#fff1ea] text-[#8a2d1b]',
    ajuste: 'bg-[#f0f0f0] text-[#3d443b]',
    anulacion: 'bg-[#f0f0f0] text-[#687168]',
    transferencia: 'bg-[#eef2ff] text-[#3730a3]',
  }

  return (
    <ModalShell title={`Movimiento ${m.code}`} onClose={onClose}>
      {detailQuery.isPending ? (
        <p className="text-sm text-[#687168]">Cargando...</p>
      ) : (
        <div className="space-y-5 text-sm">
          {/* header badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${typeColor[m.type] ?? ''}`}>{typeLabel[m.type] ?? m.type}</span>
            {m.adjustment_subtype && <span className="rounded-md bg-[#f0f0f0] px-2.5 py-1 text-xs font-medium capitalize">{m.adjustment_subtype}</span>}
            <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${m.status === 'anulado' ? 'bg-[#fff1ea] text-[#8a2d1b]' : 'bg-[#edf4ef] text-[#16372f]'}`}>{m.status}</span>
          </div>

          {/* totals */}
          <div className="rounded-md border border-[#e8e3d4] bg-[#f8f6ef] p-3">
            <p className="text-xs text-[#687168]">Total</p>
            <MoneyDisplay usd={m.totals.with_tax_usd} cup={m.totals.with_tax_cup} rate={Number(m.exchange_rate_snapshot)} />
            <p className="mt-1 text-xs text-[#687168]">ratio {m.exchange_rate_snapshot} · impuesto {m.tax_rate_snapshot}%</p>
          </div>

          {/* items */}
          <div>
            <p className="mb-2 font-semibold">Productos</p>
            <div className="divide-y divide-[#e8e3d4] rounded-md border border-[#e8e3d4]">
              {m.items.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3 px-3 py-2">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-xs text-[#687168]">Código: {item.code}</p>
                  </div>
                  <div className="text-right">
                    <p>{item.quantity} uds</p>
                    {item.unit_price_with_tax_usd && <p className="text-xs text-[#687168]">USD {item.unit_price_with_tax_usd} / u</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* metadata */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
            {m.warehouse && (
              <div className="col-span-2">
                <dt className="text-xs text-[#687168]">{m.type === 'transferencia' ? 'Transferencia' : 'Almacén'}</dt>
                <dd className="font-medium">{m.warehouse.name}{m.to_warehouse ? ` → ${m.to_warehouse.name}` : ''}</dd>
              </div>
            )}
            {m.supplier && (
              <div className="col-span-2">
                <dt className="text-xs text-[#687168]">Proveedor</dt>
                <dd className="font-medium">{m.supplier.name}</dd>
              </div>
            )}
            {m.reason && (
              <div className="col-span-2">
                <dt className="text-xs text-[#687168]">Motivo</dt>
                <dd className="font-medium">{m.reason}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-[#687168]">Creado por</dt>
              <dd className="font-medium">{m.created_by?.name ?? '—'}</dd>
              <dd className="text-xs text-[#687168]">{m.created_by?.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#687168]">Fecha</dt>
              <dd className="font-medium">{m.created_at ? new Date(m.created_at).toLocaleDateString('es-ES') : '—'}</dd>
              <dd className="text-xs text-[#687168]">{m.created_at ? new Date(m.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}</dd>
            </div>
          </dl>

          {/* void info */}
          {m.voided_by && (
            <div className="rounded-md border border-[#d69a8a] bg-[#fff1ea] p-3">
              <p className="mb-2 font-semibold text-[#8a2d1b]">Información de anulación</p>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <dt className="text-xs text-[#687168]">Anulado por</dt>
                  <dd className="font-medium">{m.voided_by.name}</dd>
                  <dd className="text-xs text-[#687168]">{m.voided_by.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#687168]">Fecha de anulación</dt>
                  <dd className="font-medium">{m.voided_at ? new Date(m.voided_at).toLocaleDateString('es-ES') : '—'}</dd>
                </div>
                {m.reason_void && (
                  <div className="col-span-2">
                    <dt className="text-xs text-[#687168]">Motivo de anulación</dt>
                    <dd className="font-medium">{m.reason_void}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      )}
    </ModalShell>
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

export function WarehousesPage() {
  return <SimpleCatalogPage title="Almacenes" endpoint="/warehouses" queryKey="warehouses" fields={[['name', 'Nombre'], ['code', 'Código'], ['address', 'Dirección']]} />
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
              {editing ? <button className="h-11 cursor-pointer rounded-md border border-[#c9c5b8] px-4 font-medium" type="button" onClick={() => setEditing(null)}>Cancelar</button> : null}
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
                <button className="h-10 cursor-pointer rounded-md border border-[#c9c5b8] px-3 text-sm font-medium" type="submit">Agregar</button>
              </form>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

export function ProductsPage() {
  const { isAll } = useWarehouse()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const params = useMemo(() => {
    const query = new URLSearchParams()
    if (search) query.set('search', search)
    if (categoryFilter) query.set('category_id', categoryFilter)
    const value = query.toString()
    return value ? `?${value}` : ''
  }, [categoryFilter, search])
  const products = useProducts(params)
  const categories = useList<OptionItem>('categories', '/categories')
  const units = useList<OptionItem>('units', '/units')
  const attributes = useAttributes()
  const queryClient = useQueryClient()
  const rateQuery = useQuery({
    queryKey: ['rate-today'],
    queryFn: async () => (await apiClient.get('/exchange-rate/today')).data as { exists: boolean; rate?: { usd_to_cup: string } },
  })
  const todayRate = Number(rateQuery.data?.rate?.usd_to_cup ?? 1)
  const remove = useDelete(['products'])
  const [editingProduct, setEditingProduct] = useState<number | null>(null)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [initialQty, setInitialQty] = useState(0)
  const [hasVariety, setHasVariety] = useState(false)
  const [selectedValueIds, setSelectedValueIds] = useState<number[]>([])
  const suppliersForCreate = useList<OptionItem>('suppliers', '/suppliers')
  const [preview, setPreview] = useState<ImportPreview | null>(null)

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const id = formData.get('_id')
      if (id) {
        formData.delete('_id')
        formData.append('_method', 'PUT')
        return (await apiClient.post(`/products/${String(id)}`, formData)).data
      }
      return (await apiClient.post('/products', formData)).data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: [`products${params}`] })
      await queryClient.invalidateQueries({ queryKey: ['movements'] })
      setImageFile(null)
      setEditingProduct(null)
      setInitialQty(0)
    },
  })

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await apiClient.post<{ data: ImportPreview }>('/products/import/preview', formData)
      return data.data
    },
    onSuccess: setPreview,
  })

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return (await apiClient.post('/products/import', formData)).data
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
    const raw = new FormData(event.currentTarget)
    const formData = new FormData()
    formData.append('code', String(raw.get('code') ?? ''))
    formData.append('name', String(raw.get('name') ?? ''))
    formData.append('category_id', String(raw.get('category_id') ?? ''))
    formData.append('unit_id', String(raw.get('unit_id') ?? ''))
    formData.append('price', String(raw.get('price') ?? ''))
    formData.append('reference', String(raw.get('reference') ?? ''))
    formData.append('quantity', String(raw.get('quantity') ?? '0'))
    if (!editingProduct && initialQty > 0) formData.append('supplier_id', String(raw.get('supplier_id') ?? ''))
    if (imageFile) formData.append('image', imageFile)
    formData.append('manage_variety', '1')
    if (hasVariety) selectedValueIds.forEach((id) => formData.append('attribute_value_ids[]', String(id)))
    if (editingProduct) formData.append('_id', String(editingProduct))
    saveMutation.mutate(formData)
    event.currentTarget.reset()
    setImageFile(null)
    setHasVariety(false)
    setSelectedValueIds([])
  }

  function previewUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const file = new FormData(event.currentTarget).get('file')
    if (file instanceof File) {
      setImportFile(file)
      previewMutation.mutate(file)
    }
  }

  function startEdit(product: Product) {
    setEditingProduct(product.id)
    setImageFile(null)
    setInitialQty(0)
    const valueIds = (product.attribute_values ?? []).map((value) => value.id)
    setSelectedValueIds(valueIds)
    setHasVariety(valueIds.length > 0)
  }

  function cancelEdit() {
    setEditingProduct(null)
    setImageFile(null)
    setHasVariety(false)
    setSelectedValueIds([])
  }

  function toggleValue(id: number) {
    setSelectedValueIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]))
  }

  const editing = products.data?.find((item) => item.id === editingProduct)

  return (
    <AppShell>
      <SectionTitle eyebrow="Inventario" title="Productos" />
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="space-y-5">
          <Card>
            <h2 className="mb-4 font-semibold">{editingProduct ? 'Editar producto' : 'Crear producto'}</h2>
            <form key={editingProduct ?? 'new'} className="space-y-4" onSubmit={submit}>
              <Field label="Código" name="code" required defaultValue={editing?.code ?? ''} />
              <Field label="Nombre" name="name" required defaultValue={editing?.name ?? ''} />
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField label="Categoría" name="category_id" required defaultValue={editing?.category?.id ?? ''}>
                  <option value="">Seleccionar</option>
                  {(categories.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </SelectField>
                <SelectField label="Unidad de medida" name="unit_id" required defaultValue={editing?.unit?.id ?? ''}>
                  <option value="">Seleccionar</option>
                  {(units.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </SelectField>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Precio unitario (USD)" name="price" type="number" required defaultValue={editing?.price ?? '0'} />
                <Field label="Cantidad" name="quantity" type="number" required defaultValue={editing?.quantity ?? '0'} onChange={(e) => !editingProduct && setInitialQty(Number(e.target.value))} />
              </div>
              {!editingProduct && isAll && initialQty > 0 ? (
                <div className="rounded-md border border-[#dfb84b] bg-[#fff7d7] px-3 py-2 text-sm font-medium text-[#6d5312]">
                  Selecciona un almacén concreto en la barra superior para registrar el stock inicial.
                </div>
              ) : null}
              {!editingProduct && initialQty > 0 ? (
                <SelectField label="Proveedor (stock inicial)" name="supplier_id">
                  <option value="">Sin proveedor</option>
                  {(suppliersForCreate.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </SelectField>
              ) : null}
              <Field label="Referencia" name="reference" defaultValue={editing?.reference ?? ''} />
              <div className="rounded-md border border-[#e8e3d4] bg-[#f8f6ef] p-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#3d443b]">
                  <input
                    type="checkbox"
                    className="size-4 accent-[#16372f]"
                    checked={hasVariety}
                    onChange={(event) => setHasVariety(event.target.checked)}
                  />
                  ¿Este producto tiene variedad (atributos)?
                </label>
                {hasVariety ? (
                  <div className="mt-3 space-y-3">
                    {(attributes.data ?? []).length === 0 ? (
                      <p className="text-xs text-[#687168]">No hay atributos creados. Créalos en la sección Atributos.</p>
                    ) : null}
                    {(attributes.data ?? []).map((attribute) => (
                      <div key={attribute.id}>
                        <p className="mb-1 text-xs font-medium text-[#687168]">{attribute.name}</p>
                        <div className="flex flex-wrap gap-2">
                          {attribute.values.map((value) => {
                            const active = selectedValueIds.includes(value.id)
                            return (
                              <button
                                type="button"
                                key={value.id}
                                onClick={() => toggleValue(value.id)}
                                className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium ${active ? 'border-[#16372f] bg-[#16372f] text-white' : 'border-[#c9c5b8] bg-white text-[#3d443b] hover:border-[#16372f]'}`}
                              >
                                {value.value}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <div>
                <span className="mb-1 block text-sm font-medium text-[#3d443b]">Imagen del producto</span>
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-[#c9c5b8] bg-[#f8f6ef] px-4 py-5 text-center hover:border-[#16372f] hover:bg-[#edf4ef]">
                  {imageFile ? (
                    <img src={URL.createObjectURL(imageFile)} alt="Vista previa" className="h-24 w-24 rounded-md border border-[#e8e3d4] object-cover" />
                  ) : editing?.image_url ? (
                    <img src={editing.image_url} alt="Imagen actual" className="h-24 w-24 rounded-md border border-[#e8e3d4] object-cover" />
                  ) : (
                    <ImageIcon className="size-10 text-[#c9c5b8]" />
                  )}
                  <span className="text-sm text-[#687168]">
                    {imageFile ? imageFile.name : editing?.image_url ? 'Clic para cambiar la imagen' : 'Clic para subir una imagen'}
                  </span>
                  <span className="text-xs text-[#9a9690]">PNG, JPG, WEBP · máx. 5 MB</span>
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <ErrorText error={saveMutation.error} />
              <div className="flex flex-wrap gap-2">
                <SubmitButton label={editingProduct ? 'Actualizar producto' : 'Crear producto'} icon={<PackagePlus className="size-4" />} />
                {editingProduct ? <button className="h-11 cursor-pointer rounded-md border border-[#c9c5b8] px-4 font-medium" type="button" onClick={cancelEdit}>Cancelar</button> : null}
              </div>
            </form>
          </Card>
          <Card>
            <h2 className="mb-4 font-semibold">Importar productos</h2>
            <div className="mb-4 flex flex-wrap gap-2">
              <button className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-[#c9c5b8] px-3 text-sm font-medium" type="button" onClick={() => void downloadTemplate('csv')}><ArrowDownToLine className="size-4" /> CSV</button>
              <button className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-[#c9c5b8] px-3 text-sm font-medium" type="button" onClick={() => void downloadTemplate('xlsx')}><FileSpreadsheet className="size-4" /> Excel</button>
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
                      <p className="font-medium">Fila {row.row}: {row.data.name} · {row.data.code}</p>
                      {row.errors.length > 0 ? <p className="mt-1 text-[#8a2d1b]">{row.errors.join(' ')}</p> : <p className="mt-1 text-[#276143]">Lista para importar</p>}
                    </div>
                  ))}
                </div>
                <button className="h-11 cursor-pointer rounded-md bg-[#16372f] px-4 font-semibold text-white disabled:opacity-50" type="button" disabled={preview.errors_count > 0 || !importFile} onClick={() => importFile && importMutation.mutate(importFile)}>Confirmar importación</button>
              </div>
            ) : null}
          </Card>
        </div>
        <Card>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
            <input className="h-11 rounded-md border border-[#c9c5b8] px-3" placeholder="Buscar por nombre o código" value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className="h-11 rounded-md border border-[#c9c5b8] px-3" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="">Todas las categorías</option>
              {(categories.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <div className="grid gap-3">
            {(products.data ?? []).map((product) => (
              <article key={product.id} className="rounded-md border border-[#e8e3d4] bg-white p-4">
                <div className="flex flex-wrap items-start gap-3">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="size-16 shrink-0 rounded-md border border-[#e8e3d4] object-cover" />
                  ) : (
                    <div className="grid size-16 shrink-0 place-items-center rounded-md border border-[#e8e3d4] bg-[#f8f6ef] text-[#687168]">
                      <ImageIcon className="size-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="font-semibold">{product.name}</h2>
                        <p className="text-sm text-[#687168]">
                          Código: {product.code} · {product.category?.name} · {product.unit?.name}
                        </p>
                        {product.reference ? <p className="text-sm text-[#687168]">Ref: {product.reference}</p> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <ActionButton onClick={() => setViewingProduct(product)}>Ver más</ActionButton>
                        <ActionButton onClick={() => startEdit(product)}><Edit3 className="size-4" /> Editar</ActionButton>
                        <ActionButton danger onClick={() => remove.mutate(`/products/${product.id}`)}><Trash2 className="size-4" /> Eliminar</ActionButton>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                      <span className="rounded-md bg-[#edf4ef] px-2 py-1 font-semibold text-[#16372f]">
                        <MoneyDisplay compact usd={product.price} rate={todayRate} />
                      </span>
                      <StockBadge stock={product.quantity} />
                      {product.created_at ? <span className="text-[#687168]">Alta: {new Date(product.created_at).toLocaleDateString('es-ES')}</span> : null}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Card>
      </div>
      {viewingProduct && <ProductDetailModal product={viewingProduct} onClose={() => setViewingProduct(null)} />}
    </AppShell>
  )
}

export function MovementsPage() {
  const queryClient = useQueryClient()
  const { warehouses, isAll, selectedId } = useWarehouse()
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
  const create = useMutation({
    mutationFn: async ({ path, input }: { path: string; input: Record<string, unknown> }) => (await apiClient.post(path, input)).data,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`movements${movementParams}`] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['kpis'] }),
      ])
    },
  })
  const [type, setType] = useState('venta')
  const [supplierId, setSupplierId] = useState('')
  const [toWarehouseId, setToWarehouseId] = useState('')
  const [reason, setReason] = useState('')
  const [adjustmentSubtype, setAdjustmentSubtype] = useState('merma')
  const [lines, setLines] = useState<Array<{ product_id: number | ''; quantity: string; unit_price_with_tax_usd: string }>>([{ product_id: '', quantity: '1', unit_price_with_tax_usd: '' }])
  const [voiding, setVoiding] = useState<Movement | null>(null)
  const [viewingMovement, setViewingMovement] = useState<Movement | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const rateQuery = useQuery({
    queryKey: ['rate-today'],
    queryFn: async () => (await apiClient.get('/exchange-rate/today')).data as { exists: boolean; rate?: { usd_to_cup: string } },
  })
  const todayRate = Number(rateQuery.data?.rate?.usd_to_cup ?? 1)
  const productsById = useMemo(() => new Map((products.data ?? []).map((product) => [product.id, product])), [products.data])
  const totalUsd = lines.reduce((sum, line) => {
    const product = typeof line.product_id === 'number' ? productsById.get(line.product_id) : undefined
    const price = type === 'entrada' && line.unit_price_with_tax_usd ? Number(line.unit_price_with_tax_usd) : Number(product?.price ?? 0)
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
        .filter((line) => line.product_id !== '' && Number(line.quantity) !== 0)
        .map((line) => ({
          product_id: line.product_id,
          quantity: numberOrZero(line.quantity),
          unit_price_with_tax_usd: line.unit_price_with_tax_usd ? numberOrZero(line.unit_price_with_tax_usd) : undefined,
        })),
    }
    if (type === 'entrada') payload.supplier_id = supplierId ? numberOrZero(supplierId) : null
    if (type === 'salida') payload.reason = reason
    if (type === 'ajuste') {
      payload.reason = reason
      payload.adjustment_subtype = adjustmentSubtype
    }
    if (type === 'transferencia') {
      payload.to_warehouse_id = numberOrZero(toWarehouseId)
      payload.reason = reason
    }
    create.mutate({ path: `/movements/${type}`, input: payload })
    setLines([{ product_id: '', quantity: '1', unit_price_with_tax_usd: '' }])
    setReason('')
    setToWarehouseId('')
  }

  const transferTargets = warehouses.filter((warehouse) => warehouse.id !== selectedId)
  const submitDisabled = isAll || (type === 'transferencia' && !toWarehouseId)

  return (
    <AppShell>
      <SectionTitle eyebrow="Operaciones" title="Movimientos de inventario" />
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid grid-cols-3 gap-2">
              {['venta', 'entrada', 'salida', 'ajuste', 'transferencia'].map((item) => (
                <button key={item} className={`h-10 cursor-pointer rounded-md border text-sm capitalize ${type === item ? 'border-[#16372f] bg-[#16372f] text-white' : 'border-[#c9c5b8]'}`} type="button" onClick={() => setType(item)}>{item}</button>
              ))}
            </div>
            {isAll ? (
              <div className="rounded-md border border-[#dfb84b] bg-[#fff7d7] px-3 py-2 text-sm font-medium text-[#6d5312]">
                Selecciona un almacén concreto en la barra superior para registrar movimientos.
              </div>
            ) : null}
            <div className="space-y-3">
              {lines.map((line, index) => {
                const selected = typeof line.product_id === 'number' ? productsById.get(line.product_id) : undefined
                return (
                  <div key={index} className="rounded-md border border-[#e8e3d4] bg-white p-3">
                    <VariantPicker products={products.data ?? []} value={line.product_id} onChange={(value) => setLines((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, product_id: value } : item))} />
                    <div className="mt-3 grid gap-2 sm:grid-cols-[100px_1fr_44px]">
                      <input className="h-11 rounded-md border border-[#c9c5b8] px-3" type="number" value={line.quantity} onChange={(event) => setLines((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: event.target.value } : item))} />
                      {type === 'entrada' ? <input className="h-11 rounded-md border border-[#c9c5b8] px-3" placeholder="Precio compra USD" type="number" value={line.unit_price_with_tax_usd} onChange={(event) => setLines((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, unit_price_with_tax_usd: event.target.value } : item))} /> : <p className="flex min-h-11 items-center text-sm text-[#687168]">{selected ? <MoneyDisplay compact usd={selected.price} rate={todayRate} /> : 'Sin producto'}</p>}
                      <button className="grid size-11 cursor-pointer place-items-center rounded-md border border-[#d69a8a] text-[#8a2d1b]" type="button" onClick={() => setLines((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></button>
                    </div>
                  </div>
                )
              })}
              <button className="h-11 cursor-pointer rounded-md border border-[#c9c5b8] px-4 font-medium" type="button" onClick={() => setLines((current) => [...current, { product_id: '', quantity: '1', unit_price_with_tax_usd: '' }])}>Agregar línea</button>
            </div>
            {type === 'entrada' ? (
              <SelectField label="Proveedor" name="supplier_id" value={supplierId} onChange={setSupplierId}>
                <option value="">Sin proveedor</option>
                {(suppliers.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </SelectField>
            ) : null}
            {type === 'transferencia' ? (
              <SelectField label="Almacén destino" name="to_warehouse_id" required value={toWarehouseId} onChange={setToWarehouseId}>
                <option value="">Seleccionar destino</option>
                {transferTargets.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
              </SelectField>
            ) : null}
            {type === 'salida' || type === 'ajuste' || type === 'transferencia' ? (
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
              Total estimado: <MoneyDisplay usd={totalUsd} rate={todayRate} />
            </div>
            <ErrorText error={create.error} />
            <button
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#16372f] px-4 font-semibold text-white hover:bg-[#0f2b25] disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
              disabled={submitDisabled}
            >
              <RefreshCw className="size-4" />
              Registrar
            </button>
          </form>
        </Card>
        <Card>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <select className="h-11 rounded-md border border-[#c9c5b8] px-3" value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}>
              <option value="">Tipo</option>
              {['entrada', 'salida', 'venta', 'ajuste', 'anulacion', 'transferencia'].map((item) => <option key={item} value={item}>{item}</option>)}
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
                <p className="mt-2 text-sm text-[#3d443b]">{movement.items.map((item) => `${item.product_name} x ${item.quantity}`).join(', ')}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-2">
                    <ActionButton onClick={() => setViewingMovement(movement)}>Ver más</ActionButton>
                    {movement.status === 'activo' && movement.type !== 'anulacion' ? (
                      <ActionButton danger onClick={() => setVoiding(movement)}><XCircle className="size-4" /> Anular</ActionButton>
                    ) : null}
                  </div>
                  <p className="text-sm text-[#687168]">{new Date(movement.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}</p>
                </div>
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
      {viewingMovement && <MovementDetailModal movement={viewingMovement} onClose={() => setViewingMovement(null)} />}
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
  const currentRate = useQuery({
    queryKey: ['rate-today'],
    queryFn: async () => (await apiClient.get('/exchange-rate/today')).data as { exists: boolean; rate?: { usd_to_cup: string } },
  })
  const currentTax = useQuery({
    queryKey: ['tax-rate'],
    queryFn: async () => (await apiClient.get('/settings/tax-rate')).data as { value: string },
  })

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
          <form key={currentRate.data?.rate?.usd_to_cup ?? 'rate'} className="space-y-4" onSubmit={saveRate}>
            <Field label="Ratio USD/CUP de hoy" name="usd_to_cup" type="number" required defaultValue={currentRate.data?.rate?.usd_to_cup ?? ''} />
            {!currentRate.data?.exists && currentRate.data?.rate && (
              <p className="text-xs text-[#6d5312]">* Mostrando último ratio guardado. Guarda uno nuevo para hoy.</p>
            )}
            <ErrorText error={rate.error} />
            <SubmitButton label="Guardar ratio" icon={<BadgeDollarSign className="size-4" />} />
          </form>
        </Card>
        <Card>
          <form key={currentTax.data?.value ?? 'tax'} className="space-y-4" onSubmit={saveTax}>
            <Field label="Tasa de impuesto (%)" name="value" type="number" required defaultValue={currentTax.data?.value ?? ''} />
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
          <h2 className="mb-3 font-semibold">Productos sin stock</h2>
          <div className="space-y-2">
            {(lowStock.data ?? []).map((item) => (
              <p key={String(item.id)} className="rounded-md bg-white px-3 py-2 text-sm">{String(item.name)} · cód. {String(item.code)} · cantidad: {String(item.quantity)}</p>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton onClick={() => void downloadReport('/reports/low-stock?format=xlsx', 'productos_sin_stock.xlsx')}><FileSpreadsheet className="size-4" /> Excel</ActionButton>
            <ActionButton onClick={() => void downloadReport('/reports/low-stock?format=pdf', 'productos_sin_stock.pdf')}><FileText className="size-4" /> PDF</ActionButton>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}

export function UsersPage() {
  const users = useUsers()
  const warehouses = useWarehouses()
  const create = usePost<Record<string, unknown>>(['users'])
  const update = usePut<Record<string, unknown>>(['users'])
  const [editing, setEditing] = useState<User | null>(null)
  const [role, setRole] = useState('almacenero')
  const [warehouseIds, setWarehouseIds] = useState<number[]>([])

  function startEdit(user: User) {
    setEditing(user)
    setRole(user.role)
    setWarehouseIds((user.warehouses ?? []).map((warehouse) => warehouse.id))
  }

  function cancelEdit() {
    setEditing(null)
    setRole('almacenero')
    setWarehouseIds([])
  }

  function toggleWarehouse(id: number) {
    setWarehouseIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = formDataToObject(new FormData(event.currentTarget)) as Record<string, unknown>
    if (editing && input.password === '') {
      delete input.password
    }
    input.warehouse_ids = role === 'almacenero' ? warehouseIds : []
    if (editing) {
      update.mutate({ path: `/users/${editing.id}`, input })
    } else {
      create.mutate({ path: '/users', input })
    }
    event.currentTarget.reset()
    cancelEdit()
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
            <SelectField label="Rol" name="role" required value={role} onChange={setRole}>
              <option value="almacenero">Almacenero</option>
              <option value="admin">Admin</option>
            </SelectField>
            {role === 'almacenero' ? (
              <div className="rounded-md border border-[#e8e3d4] bg-[#f8f6ef] p-3">
                <p className="mb-2 text-sm font-medium text-[#3d443b]">Almacenes con acceso</p>
                {(warehouses.data ?? []).length === 0 ? (
                  <p className="text-xs text-[#687168]">No hay almacenes creados. Créalos en la sección Almacenes.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(warehouses.data ?? []).map((warehouse) => {
                      const active = warehouseIds.includes(warehouse.id)
                      return (
                        <button
                          type="button"
                          key={warehouse.id}
                          onClick={() => toggleWarehouse(warehouse.id)}
                          className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium ${active ? 'border-[#16372f] bg-[#16372f] text-white' : 'border-[#c9c5b8] bg-white text-[#3d443b] hover:border-[#16372f]'}`}
                        >
                          {warehouse.name}
                        </button>
                      )
                    })}
                  </div>
                )}
                {warehouseIds.length === 0 ? <p className="mt-2 text-xs text-[#8a2d1b]">Selecciona al menos un almacén.</p> : null}
              </div>
            ) : null}
            <StatusSelect defaultValue={editing?.status ?? 'active'} />
            <ErrorText error={create.error ?? update.error} />
            <div className="flex flex-wrap gap-2">
              <SubmitButton label={editing ? 'Actualizar usuario' : 'Crear usuario'} icon={<Users className="size-4" />} />
              {editing ? <button className="h-11 cursor-pointer rounded-md border border-[#c9c5b8] px-4 font-medium" type="button" onClick={cancelEdit}>Cancelar</button> : null}
            </div>
          </form>
        </Card>
        <Card>
          <div className="space-y-2">
            {(users.data?.data ?? []).map((user: User) => (
              <div key={user.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-sm">
                <span>
                  {user.name} · {user.email} · {user.role} · {user.status}
                  {user.role === 'almacenero' && (user.warehouses?.length ?? 0) > 0
                    ? ` · ${(user.warehouses ?? []).map((warehouse) => warehouse.name).join(', ')}`
                    : ''}
                </span>
                <ActionButton onClick={() => startEdit(user)}><Edit3 className="size-4" /> Editar</ActionButton>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
