import { eq, or } from 'drizzle-orm'
import { env } from '@src/config/env'
import { db } from '@src/db'
import { librarians } from '@src/db/schemas'
import { logger } from '@src/utils/logger'
import { hashPassword } from '@src/utils/password'

/** Nome dado ao bibliotecário do startup (as LIBRARIAN_* não o definem) */
const INITIAL_LIBRARIAN_NAME = 'Bibliotecário'

/**
 * Garante que existe um bibliotecário com a matrícula, o e-mail e a senha
 * configurados em LIBRARIAN_REGISTRATION, LIBRARIAN_EMAIL e LIBRARIAN_PASSWORD,
 * antes de a aplicação começar a atender.
 *
 * Matrícula e e-mail são únicos e ambos identificam o bibliotecário, então um
 * registro com qualquer um dos dois já é considerado existente. Quando a
 * criação não é possível, o erro é propagado para impedir o startup.
 */
export async function ensureInitialLibrarian(): Promise<void> {
  const registrationNumber = env.LIBRARIAN_REGISTRATION
  const email = env.LIBRARIAN_EMAIL

  // Sem o bibliotecário inicial a aplicação não sobe: o erro precisa estourar
  try {
    const [existing] = await db
      .select({ id: librarians.id })
      .from(librarians)
      .where(
        or(
          eq(librarians.registrationNumber, registrationNumber),
          eq(librarians.email, email),
        ),
      )
      .limit(1)

    if (existing) {
      logger.info({ registrationNumber }, 'Bibliotecário inicial já existe')
      return
    }

    await db.insert(librarians).values({
      registrationNumber,
      email,
      name: INITIAL_LIBRARIAN_NAME,
      passwordHash: await hashPassword(env.LIBRARIAN_PASSWORD),
      hireDate: new Date().toISOString().slice(0, 10),
    })

    logger.info({ registrationNumber }, 'Bibliotecário inicial criado')
  } catch (error) {
    throw new Error(
      `Não foi possível garantir o bibliotecário inicial '${registrationNumber}'`,
      { cause: error },
    )
  }
}
