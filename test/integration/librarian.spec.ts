import { count, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { env } from '@src/config/env'
import { db } from '@src/db'
import { librarians } from '@src/db/schemas'
import { ensureInitialLibrarian } from '@src/utils/librarian'
import { verifyPassword } from '@src/utils/password'

/** Busca o bibliotecário do startup, falhando se ele não tiver sido criado */
async function requireInitialLibrarian() {
  const rows = await db
    .select()
    .from(librarians)
    .where(eq(librarians.email, env.LIBRARIAN_EMAIL))

  const librarian = rows[0]

  if (!librarian) {
    throw new Error('Bibliotecário inicial não foi criado')
  }

  return librarian
}

async function totalLibrarians(): Promise<number> {
  const [row] = await db.select({ total: count() }).from(librarians)

  return row?.total ?? 0
}

describe('ensureInitialLibrarian', () => {
  it('cria o bibliotecário inicial com os dados do ambiente', async () => {
    await ensureInitialLibrarian()

    const librarian = await requireInitialLibrarian()

    expect(librarian.registrationNumber).toBe(env.LIBRARIAN_REGISTRATION)
    expect(librarian.email).toBe(env.LIBRARIAN_EMAIL)
    expect(librarian.active).toBe(true)
    expect(librarian.firstLogin).toBe(true)
    expect(librarian.require2fa).toBe(true)
    expect(librarian.is2faEnabled).toBe(false)
    // A senha configurada nunca é gravada em texto puro
    expect(librarian.passwordHash).not.toBe(env.LIBRARIAN_PASSWORD)
    // E o hash gravado corresponde a ela
    await expect(
      verifyPassword(env.LIBRARIAN_PASSWORD, librarian.passwordHash),
    ).resolves.toBe(true)
  })

  it('não duplica o bibliotecário quando roda mais de uma vez', async () => {
    await ensureInitialLibrarian()
    await ensureInitialLibrarian()

    await expect(totalLibrarians()).resolves.toBe(1)
  })

  it('considera existente um bibliotecário com a mesma matrícula', async () => {
    await db.insert(librarians).values({
      registrationNumber: env.LIBRARIAN_REGISTRATION,
      email: 'outro-bibliotecario@archivum.test',
      passwordHash: 'hash-nao-utilizado',
      name: 'Bibliotecário Existente',
      hireDate: '2020-01-01',
    })

    await ensureInitialLibrarian()

    await expect(totalLibrarians()).resolves.toBe(1)

    const [librarian] = await db
      .select({ email: librarians.email })
      .from(librarians)
      .where(eq(librarians.registrationNumber, env.LIBRARIAN_REGISTRATION))

    expect(librarian?.email).toBe('outro-bibliotecario@archivum.test')
  })
})
