import { runMigrations, startTestStack, stopTestStack } from './containers'

/**
 * Roda uma única vez por execução: o globalSetup da config raiz não é herdado
 * pelos projetos, então este arquivo não roda de novo para cada perfil
 */
export async function setup(): Promise<void> {
  const stack = await startTestStack()

  await runMigrations(stack.databaseUrl)
}

/** Roda depois que todos os arquivos de teste terminaram */
export async function teardown(): Promise<void> {
  await stopTestStack()
}
