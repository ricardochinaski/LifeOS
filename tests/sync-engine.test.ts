import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getLocalOnlyEntities,
  mergeRemoteWithLocalOnly,
  normalizeStoredCollection,
  SYNC_COLLECTIONS,
  SYNC_STATE_BY_COLLECTION,
} from '../src/lib/syncEngine.ts';

test('every sync collection has a sync-state mapping including reading groups and sessions', () => {
  assert.equal(Object.keys(SYNC_STATE_BY_COLLECTION).length, SYNC_COLLECTIONS.length);
  for (const collection of SYNC_COLLECTIONS) {
    assert.ok(SYNC_STATE_BY_COLLECTION[collection]);
  }
  assert.equal(SYNC_STATE_BY_COLLECTION.readingGroups, 'library');
  assert.equal(SYNC_STATE_BY_COLLECTION.readingSessions, 'library');
});

test('first-device reconciliation preserves cloud versions and uploads only local-only ids', () => {
  const remote = [
    { id: 'shared', value: 'cloud' },
    { id: 'cloud-only', value: 1 },
  ];
  const local = [
    { id: 'shared', value: 'stale-local' },
    { id: 'local-only', value: 2 },
  ];

  assert.deepEqual(mergeRemoteWithLocalOnly(remote, local), [
    { id: 'shared', value: 'cloud' },
    { id: 'cloud-only', value: 1 },
    { id: 'local-only', value: 2 },
  ]);
  assert.deepEqual(getLocalOnlyEntities(remote, local), [{ id: 'local-only', value: 2 }]);
});

test('stored collections ignore malformed values instead of feeding them into Firestore', () => {
  assert.deepEqual(normalizeStoredCollection(null), []);
  assert.deepEqual(
    normalizeStoredCollection([{ id: 'ok', value: 1 }, null, {}, { id: '' }, { id: 22 }]),
    [{ id: 'ok', value: 1 }],
  );
});
