import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { authStorage } from '@/lib/auth-storage'
import { useMeQuery } from '@/features/auth/auth.api'

export function RequireAuth() {
  const location = useLocation()
  const hasSession = authStorage.hasSession()
  const meQuery = useMeQuery(hasSession)

  if (!hasSession) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (meQuery.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f2ea] text-[#3d443b]">
        <div className="h-2 w-48 overflow-hidden rounded-full bg-[#d8d2c2]">
          <div className="h-full w-1/2 animate-[loading-bar_1.1s_ease-in-out_infinite] rounded-full bg-[#1d4ed8]" />
        </div>
      </div>
    )
  }

  if (meQuery.isError) {
    authStorage.clear()
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
