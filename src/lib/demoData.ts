import type { Book, BookNote, Budget, Debt, FinancialAccount, HealthLog, HealthProfile } from '../types';

export const FINANCE_DEMO_IDS = new Set([
  'acc_1', 'acc_2', 'acc_3',
  'bud_1', 'bud_2', 'bud_3', 'bud_4',
  'debt_1', 'debt_2', 'debt_3',
]);

export const DEMO_BOOK_IDS = new Set(['book_1']);
export const DEMO_BOOK_NOTE_IDS = new Set(['note_1']);
export const DEMO_HEALTH_LOG_IDS = new Set(['hlog_1']);

export const isDemoFinanceId = (id: string) => FINANCE_DEMO_IDS.has(id);
export const isDemoBook = (book: Book) => DEMO_BOOK_IDS.has(book.id);
export const isDemoBookNote = (note: BookNote) => DEMO_BOOK_NOTE_IDS.has(note.id);
export const isDemoHealthLog = (log: HealthLog) => DEMO_HEALTH_LOG_IDS.has(log.id);

export const isDemoHealthProfile = (profile: HealthProfile) =>
  profile.emergencyContact?.phone === '+56 9 1234 5678' ||
  profile.notes === 'Ficha médica limpia e inicializada hoy. Lista para monitoreo de constantes vitales.';

export const getDemoReadiness = (input: {
  accounts: FinancialAccount[];
  budgets: Budget[];
  debts: Debt[];
  healthProfile: HealthProfile;
  healthLogs: HealthLog[];
  books: Book[];
  bookNotes: BookNote[];
}) => {
  const financeCount = [
    ...input.accounts.map((item) => item.id),
    ...input.budgets.map((item) => item.id),
    ...input.debts.map((item) => item.id),
  ].filter(isDemoFinanceId).length;

  const healthCount =
    Number(input.healthLogs.some(isDemoHealthLog)) +
    Number(isDemoHealthProfile(input.healthProfile));

  const libraryCount =
    Number(input.books.some(isDemoBook)) +
    Number(input.bookNotes.some(isDemoBookNote));

  return {
    financeCount,
    healthCount,
    libraryCount,
    total: financeCount + healthCount + libraryCount,
  };
};
