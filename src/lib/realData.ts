import type { Book, FinancialAccount, HealthLog, HealthProfile } from '../types';
import { isDemoAccount, isDemoBook, isDemoHealthLog, isDemoHealthProfile } from './demoData';

export const getRealAccounts = (accounts: FinancialAccount[]) => accounts.filter((account) => !isDemoAccount(account));

export const getRealBooks = (books: Book[]) => books.filter((book) => !isDemoBook(book));

export const getRealReadingBooks = (books: Book[]) => getRealBooks(books).filter((book) => book.status === 'reading');

export const getRealHealthLogs = (logs: HealthLog[]) => logs.filter((log) => !isDemoHealthLog(log));

export const getLatestRealHealthLog = (logs: HealthLog[]) =>
  [...getRealHealthLogs(logs)].sort((a, b) => `${b.date} ${b.time || ''}`.localeCompare(`${a.date} ${a.time || ''}`))[0] || null;

export const getRealHealthProfile = (profile: HealthProfile): HealthProfile | null =>
  isDemoHealthProfile(profile) ? null : profile;

export const hasRealHealthData = (profile: HealthProfile, logs: HealthLog[]) =>
  Boolean(getRealHealthProfile(profile) || getLatestRealHealthLog(logs));
