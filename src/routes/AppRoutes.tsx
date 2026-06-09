import { Navigate, Route, Routes } from 'react-router-dom'
import {
  AttributesPage,
  CategoriesPage,
  DashboardPageFull,
  MovementsPage,
  ProductsPage,
  ReportsPage,
  SettingsPage,
  SuppliersPage,
  UnitsPage,
  UsersPage,
  WarehousesPage,
} from '@/features/app/Pages'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<DashboardPageFull />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<ProductsPage />} />
        <Route path="/products/import" element={<ProductsPage />} />
        <Route path="/movements" element={<MovementsPage />} />
        <Route path="/movements/new/:type" element={<MovementsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/attributes" element={<AttributesPage />} />
        <Route path="/units" element={<UnitsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/warehouses" element={<WarehousesPage />} />
        <Route path="/reports/sales" element={<ReportsPage />} />
        <Route path="/reports/low-stock" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
