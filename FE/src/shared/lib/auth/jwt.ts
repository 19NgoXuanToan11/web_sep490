export type JwtClaims = {
  sub?: string
  email?: string
  role?: 'Admin' | 'Manager' | 'Staff'
  exp?: number
  [k: string]: any
}

export function decodeJwt(token: string): JwtClaims | null {
  try {
    const [, payload] = token.split('.')
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch {
    return null
  }
}

export function isJwtExpired(token: string): boolean {
  const claims = decodeJwt(token)
  if (!claims?.exp) return false
  const now = Math.floor(Date.now() / 1000)
  return claims.exp < now
}
