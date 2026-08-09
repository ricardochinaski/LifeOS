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

const ids = (snapshot: Record<string, unknown>, collection: string) =>
  normalizeStoredCollection(snapshot[collection]).map((item) => item.id).sort();

test('two devices converge when they edit independent entities while offline', () => {
  const cloud = {
    ...emptySnapshot(),
    tasks: [
      { id: 'task-a', title: 'A', status: 'todo' },
      { id: 'task-b', title: 'B', status: 'todo' },
    ],
    readingSessions: [],
  };

  const deviceABase = structuredClone(cloud);
  const deviceBBase = structuredClone(cloud);

  const deviceA = structuredClone(deviceABase);
  deviceA.tasks = [
    { id: 'task-a', title: 'A editada en Android', status: 'in_progress' },
    { id: 'task-b', title: 'B', status: 'todo' },
  ];
  deviceA.readingSessions = [
    { id: 'session-a', bookId: 'book-a', userId: 'user', date: '2026-08-09' },
  ];

  const afterA = applySyncDeltaToRecord(cloud, diffStoredCollections(deviceABase, deviceA));

  const deviceB = structuredClone(deviceBBase);
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
  const base = {
    ...emptySnapshot(),
    bookNotes: [
      { id: 'note-1', title: 'Eliminar' },
      { id: 'note-2', title: 'Conservar' },
    ],
  };

  const deviceOffline = structuredClone(base);
  deviceOffline.bookNotes = [{ id: 'note-2', title: 'Conservar' }];

  const cloudAdvanced = structuredClone(base);
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
  const base = {
    ...emptySnapshot(),
    tasks: [{ id: 'task-1', title: 'Original', status: 'todo' }],
  };

  const web = structuredClone(base);
  web.tasks = [{ id: 'task-1', title: 'Edición web', status: 'todo' }];
  const android = structuredClone(base);
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
