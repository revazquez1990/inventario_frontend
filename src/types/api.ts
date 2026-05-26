export type UserRole = 'admin' | 'almacenero'
export type UserStatus = 'active' | 'inactive' | 'deleted'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  status: UserStatus
}

export interface AuthResponse {
  token: string
  refresh_token: string
  user: User
}

export interface Paginated<T> {
  data: T[]
  meta: {
    total: number
    page: number
    per_page: number
    last_page: number
  }
}

export type MovementType = 'entrada' | 'salida' | 'venta' | 'ajuste' | 'anulacion'
export type MovementStatus = 'activo' | 'anulado'
export type AdjustmentSubtype = 'merma' | 'rotura' | 'conteo_fisico'
