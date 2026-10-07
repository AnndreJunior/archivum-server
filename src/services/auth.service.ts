import { db } from '@src/db'
import { librarians } from '@src/db/schemas'
import {
  InvalidCredentialsError,
  InvalidTokenError,
  InvalidTwoFactorCodeError,
  TwoFactorSetupRequiredError,
} from '@src/errors/auth-errors'
import { Login2faRequestDto, LoginRequestDto } from '@src/schemas/auth'
import { verifyPassword } from '@src/utils/password'
import { eq } from 'drizzle-orm'
import {
  generate2faToken,
  generateAccessToken,
  generateRefreshToken,
  generateSetup2faToken,
  verify2faToken,
} from '@src/utils/jwt'
import * as otp from 'otplib'

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

  const payload = {
    sub: librarian.id,
    email: librarian.email,
  }

  if (!librarian.is2faEnabled) {
    const setupToken = generateSetup2faToken(payload)
    throw new TwoFactorSetupRequiredError(setupToken)
  }

  const token = generate2faToken(payload)
  return { token }
}

export async function login2fa({ code, token }: Login2faRequestDto): Promise<{
  accessToken: string
  refreshToken: string
}> {
  let librarianId: string

  try {
    const twoFactorTokenPayload = verify2faToken(token, '2fa')
    librarianId = twoFactorTokenPayload.sub
  } catch {
    throw new InvalidTokenError()
  }

  const [librarian] = await db
    .select()
    .from(librarians)
    .where(eq(librarians.id, librarianId))

  if (!librarian) {
    throw new InvalidCredentialsError()
  }

  const tokenPayload = {
    sub: librarian.id,
    email: librarian.email,
  }

  if (!librarian.is2faEnabled || !librarian.totpSecret) {
    const setupToken = generateSetup2faToken(tokenPayload)
    throw new TwoFactorSetupRequiredError(setupToken)
  }

  const twoFactorResult = await otp.verify({
    secret: librarian.totpSecret,
    token: code,
  })
  if (!twoFactorResult.valid) {
    throw new InvalidTwoFactorCodeError()
  }

  const accessToken = generateAccessToken(tokenPayload)
  const refreshToken = generateRefreshToken(tokenPayload)

  return {
    accessToken,
    refreshToken,
  }
}
