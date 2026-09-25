import { copies } from '@src/db/schemas'
import { BOOKS } from './books.seeder'
import { seedId, type SeedTransaction } from './helpers'

const COPIES_PER_BOOK = 5

/** Datas de aquisição variadas, uma por exemplar dentro de cada lote */
const ACQUISITION_DATES = [
  '2024-02-05',
  '2024-02-19',
  '2024-03-04',
  '2024-03-18',
  '2024-04-01',
]

/**
 * Cinco exemplares por obra, com código de tombamento sequencial no padrão
 * 'LIV-0001'. Todos nascem disponíveis: o seeder de empréstimos marca como
 * 'EMPRESTADO' somente os que ficarem em um empréstimo em aberto.
 */
export const COPIES = Object.values(BOOKS).flatMap((book, bookIndex) =>
  ACQUISITION_DATES.map((acquisitionDate, copyIndex) => {
    const sequential = bookIndex * COPIES_PER_BOOK + copyIndex + 1

    return {
      id: seedId('copy', sequential),
      bookId: book.id,
      code: `LIV-${String(sequential).padStart(4, '0')}`,
      acquisitionDate,
      status: 'DISPONIVEL' as const,
    }
  }),
) satisfies (typeof copies.$inferInsert)[]

/** Busca um exemplar do seed pelo código de tombamento */
export function findCopy(code: string): (typeof COPIES)[number] {
  const copy = COPIES.find((item) => item.code === code)

  if (!copy) {
    throw new Error(`A cópia '${code}' não existe nos dados de seed`)
  }

  return copy
}

export async function seedCopies(tx: SeedTransaction): Promise<number> {
  await tx.insert(copies).values(COPIES).onConflictDoNothing()

  return COPIES.length
}
