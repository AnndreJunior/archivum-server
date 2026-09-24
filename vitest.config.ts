import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    // O vitest não lê os paths do tsconfig.json, então os aliases são repetidos aqui
    alias: {
      '@src': resolve(projectRoot, 'src'),
      '@test': resolve(projectRoot, 'test'),
    },
  },
  test: {
    // Sobe os containers (postgres e smtp4dev) e aplica as migrations uma única
    // vez por execução: o globalSetup da config raiz não é herdado pelos
    // projetos, justamente para não rodar de novo em cada perfil
    globalSetup: ['./test/utils/global-setup.ts'],
    // Executa antes de cada arquivo de teste: aplica o env de teste (antes de
    // qualquer import de '@src') e limpa banco e SMTP a cada teste
    setupFiles: ['./test/utils/setup.ts'],
    // Os perfis compartilham o mesmo banco, então os arquivos rodam em série
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    teardownTimeout: 30_000,
    projects: [
      {
        test: {
          name: 'integration',
          include: ['test/integration/**/*.spec.ts'],
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['test/e2e/**/*.spec.ts'],
        },
      },
    ],
  },
})
