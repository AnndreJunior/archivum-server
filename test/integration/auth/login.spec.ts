import { env } from '@src/config/env'
import { db } from '@src/db'
import { librarians } from '@src/db/schemas'
import { login } from '@src/services/auth.service'
import { ensureInitialLibrarian } from '@src/utils/librarian'
import { eq } from 'drizzle-orm'
import { StatusCodes } from 'http-status-codes'
import { describe, it, expect, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'

describe('login service', () => {
  beforeEach(async () => {
    await ensureInitialLibrarian()
  })

  it('retorna um token para ser usado na autenticação de dois fatores', async () => {
    await db
      .update(librarians)
      .set({
        is2faEnabled: true,
      })
      .where(eq(librarians.email, env.LIBRARIAN_EMAIL))

    const { token } = await login({
      email: env.LIBRARIAN_EMAIL,
      password: env.LIBRARIAN_PASSWORD,
    })

    const tokenPayload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload

    expect(tokenPayload).toMatchObject({ email: env.LIBRARIAN_EMAIL })
    // Verifica existência do id do usuário no token
    expect(tokenPayload.sub).toEqual(expect.any(String))
    // Verifica se há tempo de expiração no token
    expect(tokenPayload.exp).toEqual(expect.any(Number))
    expect(tokenPayload.scope).toBe('2fa')
  })

  it('lança um erro de acesso não autorizado se o email for incorreto', async () => {
    await expect(
      login({
        email: 'invalido@email.com',
        password: env.LIBRARIAN_PASSWORD,
      }),
    ).rejects.toMatchObject({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'E-mail ou senha inválidos.',
    })
  })

  it('lança um erro de acesso não autorizado se a senha for incorreta', async () => {
    await expect(
      login({
        email: env.LIBRARIAN_EMAIL,
        password: 'senha-invalida123',
      }),
    ).rejects.toMatchObject({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'E-mail ou senha inválidos.',
    })
  })

  it('lança um erro de acesso proibido se a autenticação de dois fatores não estiver habilitada', async () => {
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
