import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers'
import {
  projectRoot,
  removeTestStack,
  TEST_DATABASE_NAME,
  type TestStack,
  writeTestStack,
} from './stack'

const execFileAsync = promisify(execFile)

// As mesmas imagens do docker-compose.yaml, mas efêmeras e em portas aleatórias,
// para não conflitar com os containers de desenvolvimento
const DATABASE_IMAGE = 'postgres:18'
const SMTP_IMAGE = 'rnwood/smtp4dev:v3'

const DATABASE_USER = 'admin'
const DATABASE_PASSWORD = 'admin'

const SMTP_PORT = 25
const SMTP_API_PORT = 80

const STARTUP_TIMEOUT = 90_000

type RunningStack = {
  database: StartedPostgreSqlContainer
  smtp: StartedTestContainer
}

let runningStack: RunningStack | undefined

/** Sobe os containers uma única vez por execução e publica as portas em disco */
export async function startTestStack(): Promise<TestStack> {
  if (runningStack) {
    return describeStack(runningStack)
  }

  const database = await new PostgreSqlContainer(DATABASE_IMAGE)
    .withDatabase(TEST_DATABASE_NAME)
    .withUsername(DATABASE_USER)
    .withPassword(DATABASE_PASSWORD)
    .withStartupTimeout(STARTUP_TIMEOUT)
    .start()

  const smtp = await new GenericContainer(SMTP_IMAGE)
    .withExposedPorts(SMTP_PORT, SMTP_API_PORT)
    .withWaitStrategy(
      Wait.forAll([
        Wait.forListeningPorts(),
        Wait.forHttp('/api/Server', SMTP_API_PORT).withStartupTimeout(
          STARTUP_TIMEOUT,
        ),
      ]),
    )
    .withStartupTimeout(STARTUP_TIMEOUT)
    .start()

  runningStack = { database, smtp }

  const stack = describeStack(runningStack)
  writeTestStack(stack)

  return stack
}

/** Derruba os containers criados por esta execução */
export async function stopTestStack(): Promise<void> {
  const stack = runningStack
  runningStack = undefined

  removeTestStack()

  if (!stack) {
    return
  }

  await Promise.all([
    stack.database.stop({ remove: true, removeVolumes: true }),
    stack.smtp.stop({ remove: true, removeVolumes: true }),
  ])
}

/** Aplica as migrations do drizzle-kit no banco do container */
export async function runMigrations(databaseUrl: string): Promise<void> {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

  try {
    await execFileAsync(npm, ['run', 'migration:apply'], {
      cwd: projectRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
    })
  } catch (error) {
    const { stdout, stderr } = error as { stdout?: string; stderr?: string }

    throw new Error(
      `Falha ao aplicar as migrations do drizzle:\n${stdout ?? ''}${stderr ?? ''}`,
      { cause: error },
    )
  }
}

function describeStack({ database, smtp }: RunningStack): TestStack {
  return {
    databaseUrl: database.getConnectionUri(),
    smtp: {
      host: smtp.getHost(),
      port: smtp.getMappedPort(SMTP_PORT),
      apiUrl: `http://${smtp.getHost()}:${smtp.getMappedPort(SMTP_API_PORT)}`,
    },
  }
}
