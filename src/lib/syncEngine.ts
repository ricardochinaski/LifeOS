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
}

export type SyncDataset = Record<SyncCollectionName, readonly SyncEntity[]>;

export interface SyncCollectionDelta {
  upserts: SyncEntity[];
  deletes: string[];
}

export type SyncDelta = Record<SyncCollectionName, SyncCollectionDelta>;

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

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function parseSyncBase(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainRecord(parsed) || Object.keys(parsed).length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isSyncCollectionName(value: string): value is SyncCollectionName {
  return (SYNC_COLLECTIONS as readonly string[]).includes(value);
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

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

export function syncValuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(canonicalize(a)) === JSON.stringify(canonicalize(b));
}

/**
 * Computes changes made to the local device since its last known cloud snapshot.
 * These deltas can be replayed after signing back in, including deletions.
 */
export function diffStoredCollections(
  cloudBase: Record<string, unknown>,
  currentLocal: Record<string, unknown>,
): SyncDelta {
  return Object.fromEntries(
    SYNC_COLLECTIONS.map((collection) => {
      const before = normalizeStoredCollection(cloudBase[collection]);
      const after = normalizeStoredCollection(currentLocal[collection]);
      const beforeById = new Map(before.map((item) => [item.id, item]));
      const afterIds = new Set(after.map((item) => item.id));

      const upserts = after.filter((item) => {
        const previous = beforeById.get(item.id);
        return !previous || !syncValuesEqual(previous, item);
      });
      const deletes = before.filter((item) => !afterIds.has(item.id)).map((item) => item.id);

      return [collection, { upserts, deletes }];
    }),
  ) as SyncDelta;
}

export function hasSyncDelta(delta: SyncDelta): boolean {
  return SYNC_COLLECTIONS.some(
    (collection) => delta[collection].upserts.length > 0 || delta[collection].deletes.length > 0,
  );
}

/**
 * Applies a device delta to a cloud-like snapshot in memory.
 * This mirrors the upsert/delete semantics used by replayOfflineChanges and is
 * intentionally side-effect free so multi-device reconciliation can be tested
 * without Firebase credentials.
 */
export function applySyncDeltaToRecord(
  current: Record<string, unknown>,
  delta: SyncDelta,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...current };

  for (const collection of SYNC_COLLECTIONS) {
    const byId = new Map(
      normalizeStoredCollection(current[collection]).map((item) => [item.id, item]),
    );

    for (const id of delta[collection].deletes) byId.delete(id);
    for (const item of delta[collection].upserts) byId.set(item.id, item);

    next[collection] = Array.from(byId.values());
  }

  return next;
}
