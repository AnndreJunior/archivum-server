import bcrypt from 'bcrypt'

/**
 * Custo do bcrypt (2^12 iterações). Valores maiores deixam o hash mais lento e
 * mais resistente a ataques de força bruta.
 */
const SALT_ROUNDS = 12

/**
 * Gera o hash de uma senha com o bcrypt. O sal aleatório já vem embutido no
 * próprio hash (formato '$2b$<custo>$<sal><hash>'), então a mesma senha gera
 * hashes diferentes a cada chamada.
 *
 * ATENÇÃO: o bcrypt considera apenas os primeiros 72 bytes da senha.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Confere se a senha corresponde a um hash gerado por 'hashPassword'. Hashes
 * corrompidos ou em outro formato são tratados como senha inválida.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch {
    return false
  }
}
