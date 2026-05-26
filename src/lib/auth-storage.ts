const TOKEN_KEY = 'inventario.token'
const REFRESH_KEY = 'inventario.refresh_token'

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY)
  },
  hasSession(): boolean {
    return Boolean(localStorage.getItem(TOKEN_KEY) && localStorage.getItem(REFRESH_KEY))
  },
  set(token: string, refreshToken: string) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(REFRESH_KEY, refreshToken)
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}
