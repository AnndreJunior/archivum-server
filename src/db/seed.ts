import { and, asc, eq, isNull } from 'drizzle-orm'
import { env } from '@src/config/env'
import { db } from '@src/db'
import { librarians } from '@src/db/schemas'
import { SEED_ENTITIES, runSeeders, type SeedEntity } from './seeders'
import { logger } from '@src/utils/logger'

const ONLY_FLAG = '--only='

/** Lê o '--only=authors,books' da linha de comando, validando as entidades */
function parseOnlyFlag(): SeedEntity[] | undefined {
  const flag = process.argv.slice(2).find((arg) => arg.startsWith(ONLY_FLAG))

  if (!flag) {
    return undefined
  }

  const values = flag
    .slice(ONLY_FLAG.length)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  const invalid = values.filter(
    (value) => !SEED_ENTITIES.includes(value as SeedEntity),
  )

  if (invalid.length > 0) {
    throw new Error(
      `Entidades inválidas em '${ONLY_FLAG}': ${invalid.join(', ')}.` +
        ` Use: ${SEED_ENTITIES.join(', ')}`,
    )
  }

  return values as SeedEntity[]
}

/**
 * Busca o bibliotecário usado nos empréstimos. Ele é um caso especial e não
 * possui seeder: se ainda não existir, os empréstimos ficam de fora.
 */
async function findLibrarianId(): Promise<string | undefined> {
  const [librarian] = await db
    .select({ id: librarians.id })
    .from(librarians)
    .where(and(eq(librarians.active, true), isNull(librarians.deletedAt)))
    .orderBy(asc(librarians.createdAt))
    .limit(1)

  return librarian?.id
}

async function main(): Promise<void> {
  if (env.NODE_ENV === 'production') {
    throw new Error('O seed contém dados fictícios e não roda em produção')
  }

  const only = parseOnlyFlag()
  const willSeedLoans = !only || only.includes('loans')
  const librarianId = willSeedLoans ? await findLibrarianId() : undefined

  if (willSeedLoans && !librarianId) {
    logger.warn(
      'Nenhum bibliotecário ativo encontrado: os empréstimos (agendamentos)' +
        ' serão pulados. Crie o bibliotecário (caso especial) e rode de novo.',
    )
  }

  const summary = await runSeeders({ librarianId, only })

  logger.info(
    summary,
    `Seed concluído (${SEED_ENTITIES.length} entidades, ${only ? only.join(', ') : 'todas'})`,
  )
}

main()
  .catch((error: unknown) => {
    logger.error(error, 'Falha ao executar o seed')
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$client.end()
  })
