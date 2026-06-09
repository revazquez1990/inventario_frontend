import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { queryClient } from '@/lib/query-client'
import { AppRoutes } from '@/routes/AppRoutes'
import { WarehouseProvider } from '@/features/warehouse/WarehouseContext'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WarehouseProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </WarehouseProvider>
    </QueryClientProvider>
  )
}
