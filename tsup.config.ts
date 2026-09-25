import { defineConfig } from 'tsup'

export default defineConfig({
  // Os seeders são código apenas de desenvolvimento, então ficam fora do build
  entry: ['src/**/*.ts', '!src/db/seed.ts', '!src/db/seeders/**'],
  clean: true,
  dts: false,
  sourcemap: true,
  format: 'esm',
})
