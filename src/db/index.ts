import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '@src/config/env'
import { logger } from '@src/utils/logger'

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
  logger.error(err, 'Erro inesperado em um cliente ocioso do banco de dados')
})

export const db = drizzle({
  client: pool,
  logger:
    env.NODE_ENV === 'development'
      ? {
          logQuery(query, params) {
            logger.debug({ query, params }, 'Query executada')
          },
        }
      : false,
})
