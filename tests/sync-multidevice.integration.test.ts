import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applySyncDeltaToRecord,
  diffStoredCollections,
  normalizeStoredCollection,
  SYNC_COLLECTIONS,
} from '../src/lib/syncEngine';

const emptySnapshot = (): Record<string, unknown> =>
  Object.fromEntries(SYNC_COLLECTIONS.map((collection) => [collection, []]));

const cloneSnapshot = (snapshot: Record<string, unknown>): Record<string, unknown> =>
  structuredClone(snapshot);

const ids = (snapshot: Record<string, unknown>, collection: string) =>
  normalizeStoredCollection(snapshot[collection]).map((item) => item.id).sort();

test('two devices converge when they edit independent entities while offline', () => {
  const cloud: Record<string, unknown> = {
    ...emptySnapshot(),
    tasks: [
      { id: 'task-a', title: 'A', status: 'todo' },
      { id: 'task-b', title: 'B', status: 'todo' },
    ],
    readingSessions: [],
  };

  const deviceABase = cloneSnapshot(cloud);
  const deviceBBase = cloneSnapshot(cloud);

  const deviceA = cloneSnapshot(deviceABase);
  deviceA.tasks = [
    { id: 'task-a', title: 'A editada en Android', status: 'in_progress' },
    { id: 'task-b', title: 'B', status: 'todo' },
  ];
  deviceA.readingSessions = [
    { id: 'session-a', bookId: 'book-a', userId: 'user', date: '2026-08-09' },
  ];

  const afterA = applySyncDeltaToRecord(cloud, diffStoredCollections(deviceABase, deviceA));

  const deviceB = cloneSnapshot(deviceBBase);
  deviceB.tasks = [{ id: 'task-a', title: 'A', status: 'todo' }];
  deviceB.readingGroups = [
    { id: 'group-b', name: 'Grupo B', bookId: 'book-a' },
  ];

  const afterB = applySyncDeltaToRecord(afterA, diffStoredCollections(deviceBBase, deviceB));

  assert.deepEqual(ids(afterB, 'tasks'), ['task-a']);
  assert.deepEqual(ids(afterB, 'readingSessions'), ['session-a']);
  assert.deepEqual(ids(afterB, 'readingGroups'), ['group-b']);

  const taskA = normalizeStoredCollection(afterB.tasks).find((item) => item.id === 'task-a');
  assert.deepEqual(taskA, {
    id: 'task-a',
    title: 'A editada en Android',
    status: 'in_progress',
  });
});

test('offline deletion and unrelated cloud additions survive the same reconciliation', () => {
  const base: Record<string, unknown> = {
    ...emptySnapshot(),
    bookNotes: [
      { id: 'note-1', title: 'Eliminar' },
      { id: 'note-2', title: 'Conservar' },
    ],
  };

  const deviceOffline = cloneSnapshot(base);
  deviceOffline.bookNotes = [{ id: 'note-2', title: 'Conservar' }];

  const cloudAdvanced = cloneSnapshot(base);
  cloudAdvanced.bookNotes = [
    ...normalizeStoredCollection(cloudAdvanced.bookNotes),
    { id: 'note-cloud', title: 'Creada en web' },
  ];

  const reconciled = applySyncDeltaToRecord(
    cloudAdvanced,
    diffStoredCollections(base, deviceOffline),
  );

  assert.deepEqual(ids(reconciled, 'bookNotes'), ['note-2', 'note-cloud']);
});

test('same-entity conflict has deterministic last-replayed-device semantics', () => {
  const base: Record<string, unknown> = {
    ...emptySnapshot(),
    tasks: [{ id: 'task-1', title: 'Original', status: 'todo' }],
  };

  const web = cloneSnapshot(base);
  web.tasks = [{ id: 'task-1', title: 'Edición web', status: 'todo' }];
  const android = cloneSnapshot(base);
  android.tasks = [{ id: 'task-1', title: 'Edición Android', status: 'todo' }];

  const afterWeb = applySyncDeltaToRecord(base, diffStoredCollections(base, web));
  const afterAndroid = applySyncDeltaToRecord(
    afterWeb,
    diffStoredCollections(base, android),
  );

  assert.deepEqual(normalizeStoredCollection(afterAndroid.tasks), [
    { id: 'task-1', title: 'Edición Android', status: 'todo' },
  ]);
});
