import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Raiz do projeto (este arquivo fica em 'test/utils') */
export const projectRoot = fileURLToPath(new URL('../../', import.meta.url))

/** Banco usado pelos testes, nunca o banco de desenvolvimento */
export const TEST_DATABASE_NAME = 'archivum_test'

/**
 * Os containers são criados no globalSetup (processo principal) enquanto os
 * testes rodam em workers, então as informações dinâmicas (portas aleatórias)
 * são compartilhadas por um arquivo de estado.
 */
export const STACK_STATE_FILE = resolve(
  projectRoot,
  'node_modules/.tmp/test-stack.json',
)

export type TestStack = {
  databaseUrl: string
  smtp: {
    host: string
    port: number
    apiUrl: string
  }
}

export function writeTestStack(stack: TestStack): void {
  mkdirSync(dirname(STACK_STATE_FILE), { recursive: true })
  writeFileSync(STACK_STATE_FILE, JSON.stringify(stack, null, 2))
}

export function readTestStack(): TestStack {
  try {
    return JSON.parse(readFileSync(STACK_STATE_FILE, 'utf8')) as TestStack
  } catch (error) {
    throw new Error(
      `Não foi possível ler os containers de teste em '${STACK_STATE_FILE}'.` +
        ' Rode os testes pelo vitest para que o globalSetup crie os containers.',
      { cause: error },
    )
  }
}

export function removeTestStack(): void {
  rmSync(STACK_STATE_FILE, { force: true })
}
