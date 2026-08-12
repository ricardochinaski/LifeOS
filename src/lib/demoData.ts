import type { Book, BookNote, Budget, Debt, FinancialAccount, HealthLog, HealthProfile } from '../types';

const accountSeeds: Record<string, Pick<FinancialAccount, 'name' | 'type' | 'balance' | 'currency'>> = {
  acc_1: { name: 'Cuenta RUT / Débito', type: 'debit', balance: 1500000, currency: 'CLP' },
  acc_2: { name: 'Efectivo Personal', type: 'cash', balance: 50000, currency: 'CLP' },
  acc_3: { name: 'Fondo de Ahorro / Inversión', type: 'savings', balance: 5000000, currency: 'CLP' },
};

const budgetSeeds: Record<string, Pick<Budget, 'category' | 'monthlyLimit' | 'areaId'>> = {
  bud_1: { category: 'Alimentación & Supermercado', monthlyLimit: 400000, areaId: 'area_home' },
  bud_2: { category: 'Tecnología & Herramientas', monthlyLimit: 150000, areaId: 'area_work' },
  bud_3: { category: 'Salud & Deporte', monthlyLimit: 120000, areaId: 'area_health' },
  bud_4: { category: 'Ocio & Entretenimiento', monthlyLimit: 150000, areaId: 'area_home' },
};

const debtSeeds: Record<string, Pick<Debt, 'name' | 'creditor' | 'totalAmount' | 'remainingAmount' | 'monthlyPayment'>> = {
  debt_1: { name: 'TV Samsung 65"', creditor: 'Abcdin', totalAmount: 890000, remainingAmount: 520000, monthlyPayment: 37000 },
  debt_2: { name: 'Tarjeta de Crédito BCI', creditor: 'Banco BCI', totalAmount: 2400000, remainingAmount: 1850000, monthlyPayment: 120000 },
  debt_3: { name: 'Préstamo Personal', creditor: 'Banco Estado', totalAmount: 5000000, remainingAmount: 3200000, monthlyPayment: 175000 },
};

export const isDemoAccount = (account: FinancialAccount) => {
  const seed = accountSeeds[account.id];
  return Boolean(seed && account.name === seed.name && account.type === seed.type && account.balance === seed.balance && account.currency === seed.currency);
};

export const isDemoBudget = (budget: Budget) => {
  const seed = budgetSeeds[budget.id];
  return Boolean(seed && budget.category === seed.category && budget.monthlyLimit === seed.monthlyLimit && budget.areaId === seed.areaId);
};

export const isDemoDebt = (debt: Debt) => {
  const seed = debtSeeds[debt.id];
  return Boolean(seed && debt.name === seed.name && debt.creditor === seed.creditor && debt.totalAmount === seed.totalAmount && debt.remainingAmount === seed.remainingAmount && debt.monthlyPayment === seed.monthlyPayment);
};

export const isDemoBook = (book: Book) =>
  book.id === 'book_1' &&
  book.title === 'Hábitos Atómicos' &&
  book.author === 'James Clear' &&
  book.totalPages === 320 &&
  book.currentPage === 0 &&
  book.status === 'reading';

export const isDemoBookNote = (note: BookNote) =>
  note.id === 'note_1' &&
  note.bookId === 'book_1' &&
  note.title === 'Sistemas sobre Metas';

export const isDemoHealthLog = (log: HealthLog) =>
  log.id === 'hlog_1' &&
  log.spO2Pct === 98 &&
  log.heartRateBpm === 65 &&
  log.sleepHours === 8 &&
  log.weightKg === 80 &&
  log.notes === 'Primer registro del día. Estado general óptimo.';

export const isDemoHealthProfile = (profile: HealthProfile) =>
  profile.emergencyContact?.phone === '+56 9 1234 5678' &&
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
  const financeCount =
    input.accounts.filter(isDemoAccount).length +
    input.budgets.filter(isDemoBudget).length +
    input.debts.filter(isDemoDebt).length;

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
