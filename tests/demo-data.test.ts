import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getDemoReadiness,
  isDemoBook,
  isDemoFinanceId,
  isDemoHealthLog,
  isDemoHealthProfile,
} from '../src/lib/demoData.ts';
import {
  initialAccounts,
  initialBooks,
  initialBookNotes,
  initialBudgets,
  initialDebts,
  initialHealthLogs,
  initialHealthProfile,
} from '../src/data/seedData.ts';

test('known personal setup seeds are detected deterministically', () => {
  const readiness = getDemoReadiness({
    accounts: initialAccounts,
    budgets: initialBudgets,
    debts: initialDebts,
    healthProfile: initialHealthProfile,
    healthLogs: initialHealthLogs,
    books: initialBooks,
    bookNotes: initialBookNotes,
  });

  assert.equal(readiness.financeCount, 10);
  assert.equal(readiness.healthCount, 2);
  assert.equal(readiness.libraryCount, 2);
  assert.equal(readiness.total, 14);
});

test('user-created records are not classified as demo from content alone', () => {
  assert.equal(isDemoFinanceId('acc_real_1'), false);
  assert.equal(isDemoBook({ ...initialBooks[0], id: 'book_real_1' }), false);
  assert.equal(isDemoHealthLog({ ...initialHealthLogs[0], id: 'hlog_real_1' }), false);
  assert.equal(isDemoHealthProfile({
    ...initialHealthProfile,
    notes: 'Perfil personal',
    emergencyContact: { ...initialHealthProfile.emergencyContact!, phone: '+56 9 9999 9999' },
  }), false);
});

test('known seed markers remain detectable until replaced', () => {
  assert.equal(isDemoFinanceId('acc_1'), true);
  assert.equal(isDemoBook(initialBooks.find((book) => book.id === 'book_1')!), true);
  assert.equal(isDemoHealthLog(initialHealthLogs.find((log) => log.id === 'hlog_1')!), true);
  assert.equal(isDemoHealthProfile(initialHealthProfile), true);
});
