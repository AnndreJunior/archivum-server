import { env } from '@src/config/env'
import { sign, verify, type JwtPayload } from 'jsonwebtoken'

export type TokenType = 'access' | 'refresh'

const SECRETS: Record<TokenType, string> = {
  access: env.JWT_ACCESS_SECRET,
  refresh: env.JWT_REFRESH_SECRET,
}

export interface TwoFactorJwtPayload extends JwtPayload {
  sub: string
  email: string
  scope: '2fa' | 'setup-2fa'
}

export function generateAccessToken(payload: object) {
  return sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  })
}

export function generateRefreshToken(payload: object) {
  return sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  })
}

export function generateSetup2faToken(payload: object) {
  return sign({ ...payload, scope: 'setup-2fa' }, env.JWT_ACCESS_SECRET, {
    expiresIn: '5m',
  })
}

export function generate2faToken(payload: object) {
  return sign({ ...payload, scope: '2fa' }, env.JWT_ACCESS_SECRET, {
    expiresIn: '5m',
  })
}

export function verifyToken<T extends JwtPayload = JwtPayload>(
  token: string,
  type: TokenType = 'access',
): T {
  const secret = SECRETS[type]
  return verify(token, secret) as T
}

export function verify2faToken(
  token: string,
  expectedScope: '2fa' | 'setup-2fa' = '2fa',
): TwoFactorJwtPayload {
  const payload = verifyToken<TwoFactorJwtPayload>(token, 'access')

  if (payload.scope !== expectedScope || !payload.sub) {
    throw new Error('Invalid 2FA token scope or payload')
  }

  return payload
}
