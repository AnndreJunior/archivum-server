import type { db } from '@src/db'

/** Entidades que possuem seeder, na ordem em que precisam ser executadas */
export const SEED_ENTITIES = [
  'authors',
  'books',
  'copies',
  'students',
  'loans',
] as const

export type SeedEntity = (typeof SEED_ENTITIES)[number]

/**
 * Transação do drizzle recebida pelos seeders. Passar a transação (em vez do
 * 'db') garante que uma falha no meio do processo não deixe dados parciais.
 */
export type SeedTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Prefixo de cada entidade no UUID de seed. O formato imita um UUID v4, então
 * o Postgres aceita os valores na coluna 'uuid'.
 */
const SEED_ID_PREFIXES = {
  author: '10000000',
  book: '20000000',
  copy: '30000000',
  student: '40000000',
  loan: '50000000',
} as const

/**
 * Gera um UUID determinístico para os dados de seed. Como os ids são sempre os
 * mesmos, os seeders podem usar 'onConflictDoNothing' e rodar quantas vezes
 * forem necessárias sem duplicar (nem apagar) registros.
 */
export function seedId(kind: keyof typeof SEED_ID_PREFIXES, index: number): string {
  const prefix = SEED_ID_PREFIXES[kind]
  const suffix = String(index).padStart(12, '0')

  return `${prefix}-0000-4000-8000-${suffix}`
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

/** Data relativa a agora, para que prazos do seed nunca nascam no passado */
export function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * MILLISECONDS_PER_DAY)
}
