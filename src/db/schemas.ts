import { relations, sql } from 'drizzle-orm'
import {
  check,
  index,
  pgEnum,
  pgTable as table,
  primaryKey as compositePrimaryKey,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

const primaryKey = () => uuid('id').primaryKey().defaultRandom()
const timestamps = () => ({
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const educationLevelEnum = pgEnum('education_level', ['FUNDAMENTAL', 'MEDIO'])

export const copyStatusEnum = pgEnum('copy_status', [
  'DISPONIVEL',
  'EMPRESTADO',
  'PERDIDO',
  'MANUTENCAO',
  'DESCARTADO',
])

export const loanStatusEnum = pgEnum('loan_status', [
  'EMPRESTADO',
  'DEVOLVIDO',
  'PERDIDO',
])

export const librarians = table('librarians', (t) => ({
  id: primaryKey(),
  registrationNumber: t.text('registration_number').notNull().unique(),
  email: t.text().notNull().unique(),
  passwordHash: t.text('password_hash').notNull(),
  name: t.text().notNull(),
  hireDate: t.date('hire_date').notNull(),
  active: t.boolean().notNull().default(true),
  topSecret: t.text('totp_secret'),
  firstLogin: t.boolean('first_login').notNull().default(true),
  require2fa: t.boolean('require_2fa').notNull().default(true),
  is2faEnabled: t.boolean('is_2fa_enabled').notNull().default(false),
  backupCodes: t.text('backup_codes').array(),
  ...timestamps(),
}))

export const students = table('students', (t) => ({
  id: primaryKey(),
  registrationNumber: t.text('registration_number').notNull().unique(),
  email: t.text().notNull().unique(),
  name: t.text().notNull(),
  educationLevel: educationLevelEnum('education_level').notNull(),
  grade: t.integer().notNull(),
  section: t.text().notNull(),
  enrollmentYear: t.integer('enrollment_year').notNull(),
  graduationYear: t.integer('graduation_year').notNull(),
  active: t.boolean().notNull().default(true),
  ...timestamps(),
}))

export const authors = table('authors', (t) => ({
  id: primaryKey(),
  name: t.text().notNull(),
  nationality: t.text(),
  birthDate: t.date('birth_date'),
  ...timestamps(),
}))

export const books = table(
  'books',
  (t) => ({
    id: primaryKey(),
    title: t.text().notNull(),
    subtitle: t.text(),
    // Nem toda obra do acervo (edições antigas) possui ISBN
    isbn: t.text().unique(),
    publisher: t.text(),
    publicationYear: t.integer('publication_year'),
    edition: t.integer(),
    pageCount: t.integer('page_count'),
    synopsis: t.text(),
    ...timestamps(),
  }),
  (t) => [index('books_title_idx').on(t.title)],
)

export const bookAuthors = table(
  'book_authors',
  (t) => ({
    bookId: t
      .uuid('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    authorId: t
      .uuid('author_id')
      .notNull()
      .references(() => authors.id, { onDelete: 'cascade' }),
  }),
  (t) => [
    compositePrimaryKey({
      name: 'book_authors_pkey',
      columns: [t.bookId, t.authorId],
    }),
    index('book_authors_author_id_idx').on(t.authorId),
  ],
)

export const copies = table(
  'copies',
  (t) => ({
    id: primaryKey(),
    bookId: uuid('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'restrict' }),
    // Código de tombamento do exemplar (ex.: LIV-0001)
    code: t.text().notNull().unique(),
    acquisitionDate: t.date('acquisition_date'),
    status: copyStatusEnum('status').notNull().default('DISPONIVEL'),
    notes: t.text(),
    ...timestamps(),
  }),
  (t) => [
    index('copies_book_id_idx').on(t.bookId),
    index('copies_status_idx').on(t.status),
  ],
)

export const loans = table(
  'loans',
  (t) => ({
    id: primaryKey(),
    copyId: uuid('copy_id')
      .notNull()
      .references(() => copies.id, { onDelete: 'restrict' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'restrict' }),
    // Bibliotecário que criou (entregou) o empréstimo
    librarianId: uuid('librarian_id')
      .notNull()
      .references(() => librarians.id, { onDelete: 'restrict' }),
    // Bibliotecário que recebeu a cópia de volta
    returnedByLibrarianId: uuid('returned_by_librarian_id').references(
      () => librarians.id,
      { onDelete: 'restrict' },
    ),
    status: loanStatusEnum('status').notNull().default('EMPRESTADO'),
    loanedAt: timestamp('loaned_at', { withTimezone: true }).notNull().defaultNow(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    returnedAt: timestamp('returned_at', { withTimezone: true }),
    // Fim do bloqueio gerado pelo atraso: returned_at + (returned_at - due_date)
    blockUntil: timestamp('block_until', { withTimezone: true }),
    notes: t.text(),
    ...timestamps(),
  }),
  (t) => [
    // Uma cópia só pode estar em um empréstimo em aberto por vez
    uniqueIndex('loans_active_copy_idx')
      .on(t.copyId)
      .where(sql`status = 'EMPRESTADO'`),
    index('loans_student_id_idx').on(t.studentId),
    index('loans_copy_id_idx').on(t.copyId),
    index('loans_due_date_idx').on(t.dueDate),
    check('loans_dates_check', sql`returned_at is null or returned_at >= loaned_at`),
    check('loans_due_date_check', sql`due_date >= loaned_at`),
  ],
)

export const librariansRelations = relations(librarians, ({ many }) => ({
  createdLoans: many(loans, { relationName: 'loan_created_by' }),
  receivedLoans: many(loans, { relationName: 'loan_received_by' }),
}))

export const studentsRelations = relations(students, ({ many }) => ({
  loans: many(loans),
}))

export const authorsRelations = relations(authors, ({ many }) => ({
  bookAuthors: many(bookAuthors),
}))

export const booksRelations = relations(books, ({ many }) => ({
  bookAuthors: many(bookAuthors),
  copies: many(copies),
}))

export const bookAuthorsRelations = relations(bookAuthors, ({ one }) => ({
  book: one(books, {
    fields: [bookAuthors.bookId],
    references: [books.id],
  }),
  author: one(authors, {
    fields: [bookAuthors.authorId],
    references: [authors.id],
  }),
}))

export const copiesRelations = relations(copies, ({ one, many }) => ({
  book: one(books, {
    fields: [copies.bookId],
    references: [books.id],
  }),
  loans: many(loans),
}))

export const loansRelations = relations(loans, ({ one }) => ({
  copy: one(copies, {
    fields: [loans.copyId],
    references: [copies.id],
  }),
  student: one(students, {
    fields: [loans.studentId],
    references: [students.id],
  }),
  librarian: one(librarians, {
    fields: [loans.librarianId],
    references: [librarians.id],
    relationName: 'loan_created_by',
  }),
  returnedByLibrarian: one(librarians, {
    fields: [loans.returnedByLibrarianId],
    references: [librarians.id],
    relationName: 'loan_received_by',
  }),
}))
