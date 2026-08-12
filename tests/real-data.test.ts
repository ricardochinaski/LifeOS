import assert from 'node:assert/strict';
import test from 'node:test';
import {
  initialAccounts,
  initialBooks,
  initialHealthLogs,
  initialHealthProfile,
} from '../src/data/seedData.ts';
import {
  getLatestRealHealthLog,
  getRealAccounts,
  getRealBooks,
  getRealHealthProfile,
  getRealReadingBooks,
} from '../src/lib/realData.ts';

test('real-data selectors exclude intact financial seeds', () => {
  assert.equal(getRealAccounts(initialAccounts).length, 0);
});

test('editing an account seed makes it real immediately', () => {
  const edited = { ...initialAccounts[0], balance: initialAccounts[0].balance + 1 };
  assert.equal(getRealAccounts([edited]).length, 1);
  assert.equal(getRealAccounts([edited])[0].id, edited.id);
});

test('demo health profile and health log are unavailable as real context', () => {
  assert.equal(getRealHealthProfile(initialHealthProfile), null);
  assert.equal(getLatestRealHealthLog(initialHealthLogs), null);
});

test('edited health data becomes available without inventing missing biometrics', () => {
  const editedLog = { ...initialHealthLogs[0], notes: 'Registro personal' };
  const latest = getLatestRealHealthLog([editedLog]);
  assert.equal(latest?.id, editedLog.id);
  assert.equal(latest?.spO2Pct, editedLog.spO2Pct);
});

test('demo reading seed is excluded while edited or user books remain available', () => {
  const demoBook = initialBooks.find((book) => book.id === 'book_1');
  assert.ok(demoBook);
  assert.equal(getRealBooks([demoBook!]).length, 0);
  assert.equal(getRealReadingBooks([demoBook!]).length, 0);

  const editedBook = { ...demoBook!, currentPage: 1 };
  assert.equal(getRealReadingBooks([editedBook]).length, 1);
});
