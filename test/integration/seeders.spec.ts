import { count, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from '@src/db'
import { runSeeders } from '@src/db/seeders'
import { authors, books, copies, librarians, loans, students } from '@src/db/schemas'

/** Executa um 'select count(*)' e devolve apenas o total */
async function countOf(query: Promise<{ total: number }[]>): Promise<number> {
  const [row] = await query

  return row?.total ?? 0
}

const totals = async (): Promise<Record<string, number>> => ({
  authors: await countOf(db.select({ total: count() }).from(authors)),
  books: await countOf(db.select({ total: count() }).from(books)),
  copies: await countOf(db.select({ total: count() }).from(copies)),
  students: await countOf(db.select({ total: count() }).from(students)),
  loans: await countOf(db.select({ total: count() }).from(loans)),
})

/** O bibliotecário é um caso especial e não tem seeder: é criado fora dele */
async function createLibrarian(): Promise<string> {
  const rows = await db
    .insert(librarians)
    .values({
      registrationNumber: 'BIB-0001',
      email: 'bibliotecario@archivum.test',
      passwordHash: 'hash-de-teste',
      name: 'Bibliotecário de Teste',
      hireDate: '2024-01-15',
    })
    .returning({ id: librarians.id })

  const librarian = rows[0]

  if (!librarian) {
    throw new Error('Não foi possível criar o bibliotecário de teste')
  }

  return librarian.id
}

describe('seeders', () => {
  it('cadastra autores, livros, cópias e alunos', async () => {
    await expect(runSeeders()).resolves.toEqual({
      authors: 5,
      books: 5,
      copies: 25,
      students: 10,
      loans: 0,
    })

    await expect(totals()).resolves.toEqual({
      authors: 5,
      books: 5,
      copies: 25,
      students: 10,
      loans: 0,
    })
  })

  it('pula os empréstimos quando não existe bibliotecário', async () => {
    const summary = await runSeeders()

    expect(summary.loans).toBe(0)
    await expect(countOf(db.select({ total: count() }).from(loans))).resolves.toBe(0)
  })

  it('cadastra os 3 empréstimos quando existe bibliotecário', async () => {
    const librarianId = await createLibrarian()

    const summary = await runSeeders({ librarianId })

    expect(summary.loans).toBe(3)

    const borrowed = await countOf(
      db
        .select({ total: count() })
        .from(copies)
        .where(eq(copies.status, 'EMPRESTADO')),
    )

    // As duas cópias dos empréstimos em aberto ficam emprestadas
    expect(borrowed).toBe(2)
  })

  it('é idempotente ao rodar mais de uma vez', async () => {
    const librarianId = await createLibrarian()

    await runSeeders({ librarianId })
    await runSeeders({ librarianId })

    await expect(totals()).resolves.toEqual({
      authors: 5,
      books: 5,
      copies: 25,
      students: 10,
      loans: 3,
    })
  })
})
