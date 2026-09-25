import { buildApp } from './app'
import { env } from './config/env'
import { db } from './db'
import { ensureInitialLibrarian } from './utils/librarian'
import { logger } from './utils/logger'

async function start(): Promise<void> {
  // O bibliotecário inicial precisa existir antes de a aplicação atender
  await ensureInitialLibrarian()

  buildApp().listen(env.PORT, () => logger.info('Server running'))
}

start().catch(async (error: unknown) => {
  logger.fatal(error, 'Não foi possível iniciar o servidor')
  process.exitCode = 1

  // Encerra o pool para o processo não ficar preso depois da falha no startup
  await db.$client.end()
})
