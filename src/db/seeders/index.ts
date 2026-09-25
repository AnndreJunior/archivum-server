import { db } from '@src/db'
import { seedAuthors } from './authors.seeder'
import { seedBooks } from './books.seeder'
import { seedCopies } from './copies.seeder'
import { type SeedEntity } from './helpers'
import { seedLoans } from './loans.seeder'
import { seedStudents } from './students.seeder'

export { SEED_ENTITIES, seedId } from './helpers'
export type { SeedEntity, SeedTransaction } from './helpers'

export type SeedSummary = {
  authors: number
  books: number
  copies: number
  students: number
  loans: number
}

export type SeedOptions = {
  /** Bibliotecário (caso especial, criado fora do seed) usado nos empréstimos */
  librarianId?: string
  /** Restringe o seed a algumas entidades, respeitando a ordem de dependência */
  only?: readonly SeedEntity[]
}

/**
 * Cadastra os dados de desenvolvimento dentro de uma única transação: se
 * qualquer entidade falhar, nada é gravado. Os ids determinísticos e o
 * 'onConflictDoNothing' tornam o processo seguro para rodar mais de uma vez.
 */
export async function runSeeders(options: SeedOptions = {}): Promise<SeedSummary> {
  const { librarianId, only } = options
  const shouldSeed = (entity: SeedEntity) => !only || only.includes(entity)

  const summary: SeedSummary = {
    authors: 0,
    books: 0,
    copies: 0,
    students: 0,
    loans: 0,
  }

  await db.transaction(async (tx) => {
    if (shouldSeed('authors')) {
      summary.authors = await seedAuthors(tx)
    }

    if (shouldSeed('books')) {
      summary.books = await seedBooks(tx)
    }

    if (shouldSeed('copies')) {
      summary.copies = await seedCopies(tx)
    }

    if (shouldSeed('students')) {
      summary.students = await seedStudents(tx)
    }

    if (shouldSeed('loans') && librarianId) {
      summary.loans = await seedLoans(tx, { librarianId })
    }
  })

  return summary
}
