import { env } from '@src/config/env'
import { db } from '@src/db'
import { librarians } from '@src/db/schemas'
import {
  InvalidCredentialsError,
  TwoFactorSetupRequiredError,
} from '@src/errors/auth-errors'
import { LoginRequestDto } from '@src/schemas/auth'
import { verifyPassword } from '@src/utils/password'
import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'

/**
 * Quando o login é bem-sucedido, um token para é retornado para concluir a autenticação de dois fatores.
 */
export async function login({
  email,
  password,
}: LoginRequestDto): Promise<{ token: string }> {
  const [librarian] = await db
    .select()
    .from(librarians)
    .where(eq(librarians.email, email))

  if (!librarian) {
    throw new InvalidCredentialsError()
  }

  const validPassword = await verifyPassword(password, librarian.passwordHash)
  if (!validPassword) {
    throw new InvalidCredentialsError()
  }

  const basePayload = {
    sub: librarian.id,
    email: librarian.email,
  }

  if (!librarian.is2faEnabled) {
    const setupToken = jwt.sign(
      { ...basePayload, scope: 'setup-2fa' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '5m' },
    )

    throw new TwoFactorSetupRequiredError(setupToken)
  }

  const token = jwt.sign({ ...basePayload, scope: '2fa' }, env.JWT_ACCESS_SECRET, {
    expiresIn: '5m',
  })

  return { token }
}
