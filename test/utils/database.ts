// O env de teste precisa ser aplicado antes de qualquer import de '@src'
import { testEnv } from './env'
import { sql } from 'drizzle-orm'
import { env } from '@src/config/env'
import { db } from '@src/db'
import { TEST_DATABASE_NAME } from './stack'

const TABLES_QUERY = sql`
  select table_name
    from information_schema.tables
   where table_schema = 'public'
     and table_type = 'BASE TABLE'
`

/**
 * Garante que os testes estão apontando para o banco do container: melhor
 * falhar do que truncar o banco de desenvolvimento por engano.
 */
export function assertTestDatabase(): void {
  const { DATABASE_URL } = env
  const databaseName = new URL(DATABASE_URL).pathname.replace('/', '')

  if (DATABASE_URL !== testEnv.databaseUrl || databaseName !== TEST_DATABASE_NAME) {
    throw new Error(
      `Os testes apontam para '${DATABASE_URL}', mas o esperado é o banco` +
        ` '${TEST_DATABASE_NAME}' do container (${testEnv.databaseUrl}).`,
    )
  }
}

/** Limpa todas as tabelas do schema 'public', reiniciando as sequences */
export async function truncateDatabase(): Promise<void> {
  assertTestDatabase()

  const { rows } = await db.execute<{ table_name: string }>(TABLES_QUERY)
  const tables = rows.map(({ table_name }) => sql.identifier(table_name))

  if (tables.length === 0) {
    return
  }

  await db.execute(
    sql`truncate table ${sql.join(tables, sql`, `)} restart identity cascade`,
  )
}

/** Fecha o pool de conexões aberto por este arquivo de teste */
export async function closeDatabase(): Promise<void> {
  await db.$client.end()
}
