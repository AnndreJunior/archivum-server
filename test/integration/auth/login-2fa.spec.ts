import { describe, it, expect, beforeEach } from 'vitest'
import * as otp from 'otplib'
import { ensureInitialLibrarian } from '@src/utils/librarian'
import { db } from '@src/db'
import { librarians } from '@src/db/schemas'
import { generate2faToken, verifyToken } from '@src/utils/jwt'
import { eq } from 'drizzle-orm'
import { login2fa } from '@src/services/auth.service'
import { StatusCodes } from 'http-status-codes'

describe('login 2fa service', () => {
  beforeEach(async () => {
    await ensureInitialLibrarian()
  })

  it('retorna um access token e um refresh token se o código de acesso e o token forem válidos', async () => {
    const [librarian] = await db.select().from(librarians).limit(1)

    const totpSecret = otp.generateSecret()
    const code = await otp.generate({ secret: totpSecret })
    const token = generate2faToken({ sub: librarian.id, email: librarian.email })
    await db
      .update(librarians)
      .set({
        is2faEnabled: true,
        firstLogin: false,
        totpSecret,
      })
      .where(eq(librarians.id, librarian.id))

    const { accessToken, refreshToken } = await login2fa({ token, code })

    for (const token of [accessToken, refreshToken]) {
      expect(token).toEqual(expect.any(String))
    }

    const accessTokenPayload = verifyToken(accessToken, 'access')
    const refreshTokenPayload = verifyToken(refreshToken, 'refresh')

    expect(accessTokenPayload.exp).toEqual(expect.any(Number))
    expect(accessTokenPayload.type).toBe('access')
    expect(refreshTokenPayload.exp).toEqual(expect.any(Number))
    expect(refreshTokenPayload.type).toBe('refresh')

    // Garante que o accessToken NÃO PODE ser verificado como refreshToken e vice-versa
    expect(() => verifyToken(accessToken, 'refresh')).toThrow()
    expect(() => verifyToken(refreshToken, 'access')).toThrow()
  })

  it('lança InvalidTokenError se o token for inválido', async () => {
    await expect(
      login2fa({ token: 'invalid-token', code: '000000' }),
    ).rejects.toMatchObject({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Token inválido ou expirado.',
    })
  })

  it('lança InvalidCredentialsError se o usuário não for encontrado após validação do token', async () => {
    const [librarian] = await db.select().from(librarians).limit(1)

    const totpSecret = otp.generateSecret()
    const code = await otp.generate({ secret: totpSecret })
    const token = generate2faToken({ sub: librarian.id, email: librarian.email })
    await db.delete(librarians).where(eq(librarians.id, librarian.id))

    await expect(login2fa({ token, code })).rejects.toMatchObject({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'E-mail ou senha inválidos.',
    })
  })

  it('lança TwoFactorSetupRequiredError se 2fa não estiver habilitado', async () => {
    const [librarian] = await db.select().from(librarians).limit(1)

    const totpSecret = otp.generateSecret()
    const code = await otp.generate({ secret: totpSecret })
    const token = generate2faToken({ sub: librarian.id, email: librarian.email })

    await expect(login2fa({ token, code })).rejects.toMatchObject({
      statusCode: StatusCodes.FORBIDDEN,
      message: 'Autenticação de dois fatores não habilitada.',
      details: { token: expect.any(String) },
    })
  })

  it('lança TwoFactorSetupRequiredError se o código totp não estiver salvo no banco', async () => {
    const [librarian] = await db.select().from(librarians).limit(1)

    const totpSecret = otp.generateSecret()
    const code = await otp.generate({ secret: totpSecret })
    const token = generate2faToken({ sub: librarian.id, email: librarian.email })
    await db
      .update(librarians)
      .set({
        firstLogin: false,
        totpSecret,
      })
      .where(eq(librarians.registrationNumber, librarian.registrationNumber))

    await expect(login2fa({ token, code })).rejects.toMatchObject({
      statusCode: StatusCodes.FORBIDDEN,
      message: 'Autenticação de dois fatores não habilitada.',
      details: { token: expect.any(String) },
    })
  })

  it('lança InvalidTwoFactorCodeError se o código otp informado for inválido', async () => {
    const [librarian] = await db.select().from(librarians).limit(1)

    const totpSecret = otp.generateSecret()
    const token = generate2faToken({ sub: librarian.id, email: librarian.email })
    await db
      .update(librarians)
      .set({
        is2faEnabled: true,
        firstLogin: false,
        totpSecret,
      })
      .where(eq(librarians.registrationNumber, librarian.registrationNumber))

    await expect(login2fa({ token, code: '123456' })).rejects.toMatchObject({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Código de verificação inválido.',
    })
  })
})
