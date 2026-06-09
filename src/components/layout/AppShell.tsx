import { Boxes, FileBarChart2, LogOut, Menu, PackageSearch, Settings, Tags, Truck, Users, Warehouse } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { queryClient } from '@/lib/query-client'
import { useLogoutMutation, useMeQuery } from '@/features/auth/auth.api'
import { RateBadge } from '@/components/ui/RateBadge'
import { WarehouseSelector } from '@/features/warehouse/WarehouseSelector'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const meQuery = useMeQuery()
  const logoutMutation = useLogoutMutation()
  const user = meQuery.data
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navItems = [
    { to: '/', label: 'Dashboard', icon: FileBarChart2, adminOnly: false },
    { to: '/products', label: 'Productos', icon: Boxes, adminOnly: false },
    { to: '/movements', label: 'Movimientos', icon: PackageSearch, adminOnly: false },
    { to: '/categories', label: 'Categorías', icon: Tags, adminOnly: false },
    { to: '/units', label: 'Unidades', icon: Tags, adminOnly: true },
    { to: '/attributes', label: 'Atributos', icon: Tags, adminOnly: true },
    { to: '/suppliers', label: 'Proveedores', icon: Truck, adminOnly: false },
    { to: '/reports/sales', label: 'Reportes', icon: FileBarChart2, adminOnly: false },
    { to: '/warehouses', label: 'Almacenes', icon: Warehouse, adminOnly: true },
    { to: '/settings', label: 'Configuración', icon: Settings, adminOnly: false },
    { to: '/users', label: 'Usuarios', icon: Users, adminOnly: true },
  ].filter((item) => !item.adminOnly || user?.role === 'admin')

  async function handleLogout() {
    await logoutMutation.mutateAsync()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f4f2ea] text-[#20231f]">
      <header className="sticky top-0 z-10 border-b border-[#d8d2c2] bg-[#fbfaf5]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="grid size-11 place-items-center rounded-md text-[#27342f] hover:bg-[#eee9dc] lg:hidden"
              type="button"
              aria-label="Abrir navegación"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            <div className="grid size-10 place-items-center rounded-md bg-[#16372f] text-white">
              <PackageSearch className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-4">Inventario</p>
              <p className="text-xs text-[#697269]">Operación local</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <WarehouseSelector />
            <div className="hidden md:block">
              <RateBadge />
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.name ?? 'Usuario'}</p>
              <p className="text-xs capitalize text-[#697269]">{user?.role ?? ''}</p>
            </div>
            <button
              className="grid size-11 place-items-center rounded-md text-[#27342f] transition hover:bg-[#eee9dc] disabled:opacity-60"
              type="button"
              aria-label="Cerrar sesión"
              disabled={logoutMutation.isPending}
              onClick={handleLogout}
            >
              <LogOut className="size-5" />
            </button>
          </div>
        </div>
      </header>
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/30" type="button" aria-label="Cerrar navegación" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-[#fbfaf5] p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold">Navegación</p>
              <button className="h-11 rounded-md px-3 font-medium" type="button" onClick={() => setDrawerOpen(false)}>Cerrar</button>
            </div>
            <div className="mb-4 md:hidden">
              <RateBadge />
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    className={({ isActive }) =>
                      `flex h-12 items-center gap-3 rounded-md px-3 text-sm font-medium ${isActive ? 'bg-[#16372f] text-white' : 'text-[#3d443b] hover:bg-[#eee9dc]'}`
                    }
                    to={item.to}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
          </aside>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-20 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  className={({ isActive }) =>
                    `flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium ${isActive ? 'bg-[#16372f] text-white' : 'text-[#3d443b] hover:bg-[#eee9dc]'}`
                  }
                  to={item.to}
                >
                  <Icon className="size-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  )
}
