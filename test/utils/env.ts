import { resolve } from 'node:path'
import { config } from 'dotenv'
import { projectRoot, readTestStack } from './stack'

const ENV_FILE = resolve(projectRoot, '.env.test')

export type TestEnv = {
  databaseUrl: string
  smtp: {
    host: string
    port: string
    apiUrl: string
  }
}

/**
 * Carrega o '.env.test' e sobrescreve o que é dinâmico: a URL do banco e as
 * portas do SMTP apontam para os containers criados no globalSetup.
 *
 * ATENÇÃO: este módulo precisa ser o primeiro import de qualquer util que
 * importe '@src/*', porque 'src/config/env.ts' valida 'process.env' no momento
 * em que é avaliado.
 */
function loadTestEnv(): TestEnv {
  // O 'dotenv/config' do src/config/env.ts imprime a mensagem de injeção; o
  // DOTENV_QUIET silencia esse log, que só polui a saída dos testes
  process.env.DOTENV_QUIET = 'true'

  config({ path: ENV_FILE, quiet: true })

  const stack = readTestStack()

  process.env.DATABASE_URL = stack.databaseUrl
  process.env.SMTP_HOST = stack.smtp.host
  process.env.SMTP_PORT = String(stack.smtp.port)
  process.env.SMTP_API_URL = stack.smtp.apiUrl

  return {
    databaseUrl: stack.databaseUrl,
    smtp: {
      host: stack.smtp.host,
      port: String(stack.smtp.port),
      apiUrl: stack.smtp.apiUrl,
    },
  }
}

export const testEnv = loadTestEnv()
