import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mergeMissingSeeds,
  persistSnapshotIfChanged,
  readStoredRecord,
  readSyncBase,
  removeUndefinedFields,
  syncBaseKey,
  updateSyncBasePart,
  type StorageLike,
} from '../src/lib/lifeosPersistence';

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  writes = 0;

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.writes += 1;
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

test('stored records reject malformed JSON and non-object roots', () => {
  assert.deepEqual(readStoredRecord('{bad json'), {});
  assert.deepEqual(readStoredRecord('[]'), {});
  assert.deepEqual(readStoredRecord('null'), {});
  assert.deepEqual(readStoredRecord('{"tasks":[]}'), { tasks: [] });
});

test('sync bases are isolated per user and partial updates are merged', () => {
  const storage = new MemoryStorage();
  updateSyncBasePart('user-a', 'tasks', [{ id: 'task-1' }], storage);
  updateSyncBasePart('user-a', 'books', [{ id: 'book-1' }], storage);
  updateSyncBasePart('user-b', 'tasks', [{ id: 'task-2' }], storage);

  assert.deepEqual(readSyncBase('user-a', storage), {
    tasks: [{ id: 'task-1' }],
    books: [{ id: 'book-1' }],
  });
  assert.deepEqual(readSyncBase('user-b', storage), { tasks: [{ id: 'task-2' }] });
  assert.notEqual(syncBaseKey('user-a'), syncBaseKey('user-b'));
});

test('undefined values are removed recursively without removing valid falsey values', () => {
  assert.deepEqual(
    removeUndefinedFields({
      id: 'x',
      zero: 0,
      enabled: false,
      empty: '',
      missing: undefined,
      nested: { keep: 'yes', remove: undefined },
      list: [{ keep: 1, remove: undefined }],
    }),
    {
      id: 'x',
      zero: 0,
      enabled: false,
      empty: '',
      nested: { keep: 'yes' },
      list: [{ keep: 1 }],
    },
  );
});

test('curated seeds only append ids that are not already stored', () => {
  const current = [{ id: 'a', value: 1 }];
  const seeds = [{ id: 'a', value: 99 }, { id: 'b', value: 2 }];
  assert.deepEqual(mergeMissingSeeds(current, seeds), [
    { id: 'a', value: 1 },
    { id: 'b', value: 2 },
  ]);
});

test('snapshot persistence skips identical serialized state', () => {
  const storage = new MemoryStorage();
  const state = { tasks: [{ id: 'a' }] };
  const first = persistSnapshotIfChanged(state, null, storage);
  const second = persistSnapshotIfChanged(state, first, storage);

  assert.equal(first, second);
  assert.equal(storage.writes, 1);
});
