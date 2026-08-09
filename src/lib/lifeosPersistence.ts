import { parseSyncBase } from './syncEngine';

export const STORAGE_KEY = 'lifeos_local_v1';
export const CURATED_CONTENT_KEY = 'lifeos_curated_content_2026_07_29';
export const SYNC_BASE_KEY_PREFIX = 'lifeos_sync_base_v2_';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

const resolveStorage = (): StorageLike => {
  const storage = (globalThis as { localStorage?: StorageLike }).localStorage;
  if (!storage) throw new Error('localStorage is not available in this environment');
  return storage;
};

export const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const readStoredRecord = (raw: string | null): Record<string, unknown> => {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return isPlainRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const syncBaseKey = (uid: string) => `${SYNC_BASE_KEY_PREFIX}${uid}`;

export const readSyncBase = (
  uid: string,
  storage: StorageLike = resolveStorage(),
): Record<string, unknown> | null => parseSyncBase(storage.getItem(syncBaseKey(uid)));

export const updateSyncBasePart = (
  uid: string,
  key: string,
  value: unknown,
  storage: StorageLike = resolveStorage(),
): void => {
  const base = readSyncBase(uid, storage) || {};
  storage.setItem(syncBaseKey(uid), JSON.stringify({ ...base, [key]: value }));
};

export const removeUndefinedFields = (value: any): any => {
  if (Array.isArray(value)) return value.map(removeUndefinedFields);
  if (value instanceof Date) return value;

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, removeUndefinedFields(entryValue)]),
    );
  }

  return value;
};

export const mergeMissingSeeds = <T extends { id: string }>(
  current: T[] | undefined,
  seeds: T[],
): T[] => {
  const base = Array.isArray(current) ? current : [];
  const existing = new Set(base.map((item) => item.id));
  return [...base, ...seeds.filter((item) => !existing.has(item.id))];
};

export const persistSnapshotIfChanged = (
  value: unknown,
  previousSerialized: string | null,
  storage: StorageLike = resolveStorage(),
  key = STORAGE_KEY,
): string => {
  const serialized = JSON.stringify(value);
  if (serialized !== previousSerialized) storage.setItem(key, serialized);
  return serialized;
};
