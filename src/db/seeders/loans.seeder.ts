import { inArray } from 'drizzle-orm'
import { copies, loans } from '@src/db/schemas'
import { findCopy } from './copies.seeder'
import { daysFromNow, seedId, type SeedTransaction } from './helpers'
import { STUDENTS } from './students.seeder'

type LoanSeed = {
  id: string
  copyCode: string
  studentKey: keyof typeof STUDENTS
  status: 'EMPRESTADO' | 'DEVOLVIDO' | 'PERDIDO'
  loanedAt: Date
  dueDate: Date
  returnedAt?: Date
  blockUntil?: Date
  notes?: string
}

/**
 * Três empréstimos: dois em aberto (dentro do prazo) e um devolvido com atraso,
 * exercitando o bloqueio calculado sobre o atraso (`blockUntil`).
 */
export const LOANS: LoanSeed[] = [
  {
    id: seedId('loan', 1),
    copyCode: 'LIV-0001',
    studentKey: 'anaBeatrizFerreira',
    status: 'EMPRESTADO',
    loanedAt: daysFromNow(-12),
    dueDate: daysFromNow(2),
    notes: 'Empréstimo em andamento',
  },
  {
    id: seedId('loan', 2),
    copyCode: 'LIV-0007',
    studentKey: 'gabrielaSantosPereira',
    status: 'EMPRESTADO',
    loanedAt: daysFromNow(-5),
    dueDate: daysFromNow(9),
    notes: 'Empréstimo em andamento',
  },
  {
    id: seedId('loan', 3),
    copyCode: 'LIV-0013',
    studentKey: 'henriqueCostaRibeiro',
    status: 'DEVOLVIDO',
    loanedAt: daysFromNow(-40),
    dueDate: daysFromNow(-26),
    returnedAt: daysFromNow(-25),
    // Devolvido 1 dia atrasado: bloqueio de 1 dia contado sobre o atraso
    blockUntil: daysFromNow(-24),
    notes: 'Devolvido com um dia de atraso',
  },
]

export async function seedLoans(
  tx: SeedTransaction,
  { librarianId }: { librarianId: string },
): Promise<number> {
  const rows = LOANS.map((loan) => ({
    id: loan.id,
    copyId: findCopy(loan.copyCode).id,
    studentId: STUDENTS[loan.studentKey].id,
    librarianId,
    returnedByLibrarianId: loan.returnedAt ? librarianId : null,
    status: loan.status,
    loanedAt: loan.loanedAt,
    dueDate: loan.dueDate,
    returnedAt: loan.returnedAt ?? null,
    blockUntil: loan.blockUntil ?? null,
    notes: loan.notes,
  }))

  await tx.insert(loans).values(rows).onConflictDoNothing()

  const borrowedCopyCodes = LOANS.filter((loan) => loan.status === 'EMPRESTADO').map(
    (loan) => loan.copyCode,
  )

  if (borrowedCopyCodes.length > 0) {
    await tx
      .update(copies)
      .set({ status: 'EMPRESTADO' })
      .where(inArray(copies.code, borrowedCopyCodes))
  }

  return rows.length
}
