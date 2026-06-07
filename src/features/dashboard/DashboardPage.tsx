import { AlertTriangle, ArrowDownUp, CircleDollarSign, Package } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'

const metrics = [
  { label: 'Ventas de hoy', value: 'USD 0.00', icon: CircleDollarSign },
  { label: 'Movimientos', value: '0', icon: ArrowDownUp },
  { label: 'Productos bajo mínimo', value: '0', icon: AlertTriangle },
  { label: 'Variantes activas', value: '0', icon: Package },
]

export function DashboardPage() {
  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#687168]">
            Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-[#20231f]">Resumen operativo</h1>
        </div>
        <div className="rounded-md border border-[#dfb84b] bg-[#fff7d7] px-4 py-3 text-sm font-medium text-[#6d5312]">
          Ratio = 1 — no se ha definido el ratio del día
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <article key={metric.label} className="rounded-md border border-[#d8d2c2] bg-[#fbfaf5] p-5">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm font-medium text-[#687168]">{metric.label}</p>
                <Icon className="size-5 text-[#16372f]" />
              </div>
              <p className="text-3xl font-semibold">{metric.value}</p>
            </article>
          )
        })}
      </section>
    </AppShell>
  )
}
