import { env } from '@src/config/env'
import { db } from '@src/db'
import { librarians } from '@src/db/schemas'
import { login } from '@src/services/auth.service'
import { ensureInitialLibrarian } from '@src/utils/librarian'
import { eq } from 'drizzle-orm'
import { StatusCodes } from 'http-status-codes'
import { describe, it, expect, beforeEach } from 'vitest'
import * as jwt from 'jsonwebtoken'

describe('Auth service', () => {
  beforeEach(async () => {
    await ensureInitialLibrarian()
  })

  it('Autentica o bibliotecário com email e senha válidos', async () => {
    await db
      .update(librarians)
      .set({
        is2faEnabled: true,
      })
      .where(eq(librarians.email, env.LIBRARIAN_EMAIL))

    const { accessToken, refreshToken } = await login({
      email: env.LIBRARIAN_EMAIL,
      password: env.LIBRARIAN_PASSWORD,
    })

    const accessPayload = jwt.verify(
      accessToken,
      env.JWT_ACCESS_SECRET,
    ) as jwt.JwtPayload

    const refreshPayload = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET,
    ) as jwt.JwtPayload

    for (const payload of [accessPayload, refreshPayload]) {
      expect(payload).toMatchObject({ email: env.LIBRARIAN_EMAIL })
      // Verifica existência do id do usuário no token
      expect(payload.sub).toEqual(expect.any(String))
      // Verifica se há tempo de expiração no token
      expect(payload.exp).toEqual(expect.any(Number))
    }

    expect(accessPayload.type).toBe('access')
    expect(refreshPayload.type).toBe('refresh')
    // Nenhum dos tokens pode ser válido com o segredo do outro (os segredos não se misturam)
    expect(() => jwt.verify(accessToken, env.JWT_REFRESH_SECRET)).toThrow()
    expect(() => jwt.verify(refreshToken, env.JWT_ACCESS_SECRET)).toThrow()
  })

  it('Lança um erro de acesso não autorizado se o email for incorreto', async () => {
    await expect(
      login({
        email: 'invalido@email.com',
        password: env.LIBRARIAN_PASSWORD,
      }),
    ).rejects.toMatchObject({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'E-mail ou senha inválidos',
    })
  })

  it('Lança um erro de acesso não autorizado se a senha for incorreta', async () => {
    await expect(
      login({
        email: env.LIBRARIAN_EMAIL,
        password: 'senha-invalida123',
      }),
    ).rejects.toMatchObject({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'E-mail ou senha inválidos',
    })
  })

  it('Lança um erro de acesso proibido se a autenticação de dois fatores não estiver habilitada', async () => {
    await expect(
      login({
        email: env.LIBRARIAN_EMAIL,
        password: env.LIBRARIAN_PASSWORD,
      }),
    ).rejects.toMatchObject({
      statusCode: StatusCodes.FORBIDDEN,
      message: 'Autenticação de dois fatores não habilitada.',
      details: { token: expect.any(String) },
    })
  })
})
