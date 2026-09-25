import { cpSync, existsSync } from 'node:fs'
import { defineConfig } from 'tsup'

export default defineConfig({
  // Os seeders são código apenas de desenvolvimento, então ficam fora do build
  entry: ['src/**/*.ts', '!src/db/seed.ts', '!src/db/seeders/**'],
  clean: true,
  dts: false,
  sourcemap: true,
  format: 'esm',
  // Os templates de e-mail não são código, então o tsup não os copia sozinho:
  // sem eles a pasta 'dist/views/mails' ficaria vazia e o envio quebraria. O
  // existsSync evita falhar enquanto nenhuma template foi criada ainda.
  onSuccess: async () => {
    if (existsSync('src/views')) {
      cpSync('src/views', 'dist/views', { recursive: true })
    }
  },
})
