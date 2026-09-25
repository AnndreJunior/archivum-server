import { bookAuthors, books } from '@src/db/schemas'
import { AUTHORS } from './authors.seeder'
import { seedId, type SeedTransaction } from './helpers'

/** Obras do acervo, indexadas por uma chave legível para as cópias referenciarem */
export const BOOKS = {
  domCasmurro: {
    id: seedId('book', 1),
    title: 'Dom Casmurro',
    isbn: '9788535910663',
    publisher: 'Editora Garnier',
    publicationYear: 1899,
    edition: 1,
    pageCount: 256,
    synopsis: 'Bentinho relembra a juventude e a desconfiança sobre Capitu.',
  },
  oCortico: {
    id: seedId('book', 2),
    title: 'O Cortiço',
    isbn: '9788508044111',
    publisher: 'Livraria Garnier',
    publicationYear: 1890,
    edition: 1,
    pageCount: 304,
    synopsis: 'Retrato naturalista da vida coletiva em um cortiço carioca.',
  },
  capitaesDaAreia: {
    id: seedId('book', 3),
    title: 'Capitães da Areia',
    isbn: '9788535914849',
    publisher: 'Companhia das Letras',
    publicationYear: 1937,
    edition: 1,
    pageCount: 280,
    synopsis: 'Meninos de rua de Salvador sobrevivem entre furtos e afetos.',
  },
  vidasSecas: {
    id: seedId('book', 4),
    // Edição antiga sem ISBN, como previsto no schema
    isbn: null,
    title: 'Vidas Secas',
    publisher: 'José Olympio',
    publicationYear: 1938,
    edition: 1,
    pageCount: 176,
    synopsis: 'A família de Fabiano cruza o sertão fugindo da seca.',
  },
  aHoraDaEstrela: {
    id: seedId('book', 5),
    title: 'A Hora da Estrela',
    isbn: '9788532530277',
    publisher: 'Rocco',
    publicationYear: 1977,
    edition: 1,
    pageCount: 96,
    synopsis: 'Macabéa, nordestina pobre no Rio, tem sua história narrada.',
  },
} satisfies Record<string, typeof books.$inferInsert>

/** Vínculo entre cada obra e seu autor (um autor por livro no seed) */
const BOOK_AUTHORS = [
  { bookId: BOOKS.domCasmurro.id, authorId: AUTHORS.machadoDeAssis.id },
  { bookId: BOOKS.oCortico.id, authorId: AUTHORS.aluisioAzevedo.id },
  { bookId: BOOKS.capitaesDaAreia.id, authorId: AUTHORS.jorgeAmado.id },
  { bookId: BOOKS.vidasSecas.id, authorId: AUTHORS.gracilianoRamos.id },
  { bookId: BOOKS.aHoraDaEstrela.id, authorId: AUTHORS.clariceLispector.id },
]

export async function seedBooks(tx: SeedTransaction): Promise<number> {
  const rows = Object.values(BOOKS)

  await tx.insert(books).values(rows).onConflictDoNothing()
  await tx.insert(bookAuthors).values(BOOK_AUTHORS).onConflictDoNothing()

  return rows.length
}
