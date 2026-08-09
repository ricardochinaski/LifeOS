import type { SyncCollection } from '../types';

export const SYNC_COLLECTIONS = [
  'tasks',
  'habits',
  'habitLogs',
  'accounts',
  'budgets',
  'debts',
  'transactions',
  'financialGoals',
  'recurringTransactions',
  'books',
  'readingLogs',
  'bookNotes',
  'readingGroups',
  'readingSessions',
  'projects',
  'healthLogs',
  'workoutLogs',
] as const;

export type SyncCollectionName = (typeof SYNC_COLLECTIONS)[number];

export interface SyncEntity {
  id: string;
  [key: string]: unknown;
}

export type SyncDataset = Record<SyncCollectionName, readonly SyncEntity[]>;

export const SYNC_STATE_BY_COLLECTION: Record<SyncCollectionName, SyncCollection> = {
  tasks: 'tasks',
  habits: 'habits',
  habitLogs: 'habitLogs',
  accounts: 'finances',
  budgets: 'finances',
  debts: 'finances',
  transactions: 'finances',
  financialGoals: 'finances',
  recurringTransactions: 'finances',
  books: 'library',
  readingLogs: 'library',
  bookNotes: 'library',
  readingGroups: 'library',
  readingSessions: 'library',
  projects: 'projects',
  healthLogs: 'health',
  workoutLogs: 'health',
};

export function isSyncCollectionName(value: string): value is SyncCollectionName {
  return (SYNC_COLLECTIONS as readonly string[]).includes(value);
}

/**
 * First-device reconciliation policy:
 * - cloud wins when the same id exists on both sides;
 * - local-only ids are preserved and can be uploaded without replacing cloud data.
 */
export function mergeRemoteWithLocalOnly<T extends SyncEntity>(remote: readonly T[], local: readonly T[]): T[] {
  const merged = new Map<string, T>();
  for (const item of remote) merged.set(item.id, item);
  for (const item of local) {
    if (!merged.has(item.id)) merged.set(item.id, item);
  }
  return Array.from(merged.values());
}

export function getLocalOnlyEntities<T extends SyncEntity>(remote: readonly T[], local: readonly T[]): T[] {
  const remoteIds = new Set(remote.map((item) => item.id));
  return local.filter((item) => !remoteIds.has(item.id));
}

export function normalizeStoredCollection(value: unknown): SyncEntity[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is SyncEntity =>
      Boolean(item) &&
      typeof item === 'object' &&
      typeof (item as { id?: unknown }).id === 'string' &&
      (item as { id: string }).id.length > 0,
  );
}
