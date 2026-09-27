import { describe, it, expect, beforeEach } from 'vitest'
import { ensureInitialLibrarian } from '@src/utils/librarian'
import { api } from '@test/utils'
import { env } from '@src/config/env'
import { StatusCodes } from 'http-status-codes'
import { db } from '@src/db'
import { librarians } from '@src/db/schemas'
import { eq } from 'drizzle-orm'

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await ensureInitialLibrarian()
  })

  it('responde 200 com um token para concluir autenticação de dois fatores', async () => {
    await db
      .update(librarians)
      .set({
        is2faEnabled: true,
      })
      .where(eq(librarians.email, env.LIBRARIAN_EMAIL))

    const response = await api().post('/auth/login').send({
      email: env.LIBRARIAN_EMAIL,
      password: env.LIBRARIAN_PASSWORD,
    })

    expect(response.status).toBe(StatusCodes.OK)
    expect(response.body).toHaveProperty('token2fa')
    expect(response.body).toHaveProperty('require2fa')
    expect(response.body.require2fa).toBe(true)
    expect(typeof response.body.token2fa).toBe('string')
  })

  it('responde 400 se o payload for inválido', async () => {
    const response = await api().post('/auth/login').send({
      email: 'email-invalido',
    })

    expect(response.status).toBe(StatusCodes.BAD_REQUEST)
    expect(response.body).toMatchObject({
      statusCode: StatusCodes.BAD_REQUEST,
      code: 'VALIDATION',
      message: 'Um ou mais campos estão inválidos.',
      instance: '/auth/login',
    })
    expect(response.body.details).toHaveProperty('email')
    expect(response.body.details).toHaveProperty('password')
  })

  it('responde 401 se as credenciais estiverem erradas', async () => {
    const response = await api().post('/auth/login').send({
      email: env.LIBRARIAN_EMAIL,
      password: 'wrong-password',
    })

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED)
    expect(response.body).toMatchObject({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'E-mail ou senha inválidos.',
      instance: '/auth/login',
    })
  })

  it('response 403 e token de setup se 2FA não estiver habilitado', async () => {
    const response = await api().post('/auth/login').send({
      email: env.LIBRARIAN_EMAIL,
      password: env.LIBRARIAN_PASSWORD,
    })

    expect(response.status).toBe(StatusCodes.FORBIDDEN)
    expect(response.body).toMatchObject({
      statusCode: StatusCodes.FORBIDDEN,
      message: 'Autenticação de dois fatores não habilitada.',
      instance: '/auth/login',
    })
    expect(response.body.details).toHaveProperty('token')
  })
})
