import { describe, expect, it } from 'vitest'
import { db } from '@src/db'
import { authors } from '@src/db/schemas'
import { getMessages, testEnv } from '@test/utils'

describe('infraestrutura de testes', () => {
  it('aponta para o banco do container', () => {
    expect(testEnv.databaseUrl).toContain('archivum_test')
  })

  it('aplica as migrations do drizzle', async () => {
    await expect(db.select().from(authors)).resolves.toEqual([])
  })

  it('persiste dados no banco', async () => {
    await db.insert(authors).values({ name: 'Machado de Assis' })

    const rows = await db.select().from(authors)

    expect(rows).toHaveLength(1)
    expect(rows[0]?.name).toBe('Machado de Assis')
  })

  it('limpa o banco antes de cada teste', async () => {
    await expect(db.select().from(authors)).resolves.toEqual([])
  })

  it('disponibiliza a API do smtp4dev com a caixa de entrada vazia', async () => {
    await expect(getMessages()).resolves.toEqual([])
  })
})
