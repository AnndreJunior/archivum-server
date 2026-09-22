import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/**/*.ts'],
  clean: true,
  dts: false,
  sourcemap: true,
  format: 'esm',
})
