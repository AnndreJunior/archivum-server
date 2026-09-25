import { authors } from '@src/db/schemas'
import { seedId, type SeedTransaction } from './helpers'

/**
 * Autores do acervo, indexados por uma chave legível para que os livros possam
 * referenciá-los sem depender da ordem de inserção.
 */
export const AUTHORS = {
  machadoDeAssis: {
    id: seedId('author', 1),
    name: 'Machado de Assis',
    nationality: 'Brasileiro',
    birthDate: '1839-06-21',
  },
  aluisioAzevedo: {
    id: seedId('author', 2),
    name: 'Aluísio Azevedo',
    nationality: 'Brasileiro',
    birthDate: '1857-04-14',
  },
  jorgeAmado: {
    id: seedId('author', 3),
    name: 'Jorge Amado',
    nationality: 'Brasileiro',
    birthDate: '1912-08-10',
  },
  gracilianoRamos: {
    id: seedId('author', 4),
    name: 'Graciliano Ramos',
    nationality: 'Brasileiro',
    birthDate: '1892-10-27',
  },
  clariceLispector: {
    id: seedId('author', 5),
    name: 'Clarice Lispector',
    nationality: 'Brasileira',
    birthDate: '1920-12-10',
  },
} satisfies Record<string, typeof authors.$inferInsert>

export async function seedAuthors(tx: SeedTransaction): Promise<number> {
  const rows = Object.values(AUTHORS)

  await tx.insert(authors).values(rows).onConflictDoNothing()

  return rows.length
}
