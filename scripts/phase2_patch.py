from pathlib import Path

path = Path('src/context/LifeOSContext.tsx')
text = path.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    text = text.replace(old, new, 1)


replace_once(
    "  FinancialGoal, RecurringTransaction, SyncState, SyncCollection,\n",
    "  FinancialGoal, RecurringTransaction, SyncState,\n",
    'remove obsolete SyncCollection import',
)

replace_once(
    "import { scheduleTaskNotifications } from '../utils/notifications';\n",
    "import { scheduleTaskNotifications } from '../utils/notifications';\n"
    "import { addDaysToDateOnly, addMonthsToDateOnly, todayLocalDate } from '../lib/dateOnly';\n"
    "import {\n"
    "  diffStoredCollections, getLocalOnlyEntities, isSyncCollectionName, mergeRemoteWithLocalOnly,\n"
    "  normalizeStoredCollection, SYNC_COLLECTIONS, SYNC_STATE_BY_COLLECTION, syncValuesEqual,\n"
    "  type SyncCollectionName, type SyncDataset,\n"
    "} from '../lib/syncEngine';\n",
    'add phase 2 imports',
)

replace_once(
    "const STORAGE_KEY = 'lifeos_local_v1';\nconst CURATED_CONTENT_KEY = 'lifeos_curated_content_2026_07_29';\n",
    "const STORAGE_KEY = 'lifeos_local_v1';\n"
    "const CURATED_CONTENT_KEY = 'lifeos_curated_content_2026_07_29';\n"
    "const SYNC_BASE_KEY_PREFIX = 'lifeos_sync_base_v2_';\n\n"
    "const isPlainRecord = (value: unknown): value is Record<string, unknown> =>\n"
    "  Boolean(value) && typeof value === 'object' && !Array.isArray(value);\n\n"
    "const readStoredRecord = (raw: string | null): Record<string, unknown> => {\n"
    "  if (!raw) return {};\n"
    "  try {\n"
    "    const parsed: unknown = JSON.parse(raw);\n"
    "    return isPlainRecord(parsed) ? parsed : {};\n"
    "  } catch {\n"
    "    return {};\n"
    "  }\n"
    "};\n\n"
    "const syncBaseKey = (uid: string) => `${SYNC_BASE_KEY_PREFIX}${uid}`;\n"
    "const readSyncBase = (uid: string): Record<string, unknown> | null => {\n"
    "  const raw = localStorage.getItem(syncBaseKey(uid));\n"
    "  if (!raw) return null;\n"
    "  return readStoredRecord(raw);\n"
    "};\n\n"
    "const updateSyncBasePart = (uid: string, key: string, value: unknown) => {\n"
    "  const base = readSyncBase(uid) || {};\n"
    "  localStorage.setItem(syncBaseKey(uid), JSON.stringify({ ...base, [key]: value }));\n"
    "};\n",
    'add sync base storage helpers',
)

old_collections = "const COLLECTIONS = ['tasks', 'habits', 'habitLogs', 'accounts', 'budgets', 'debts', 'transactions', 'financialGoals', 'recurringTransactions', 'books', 'readingLogs', 'bookNotes', 'readingGroups', 'readingSessions', 'projects', 'healthLogs', 'workoutLogs'] as const;"
replace_once(old_collections, 'const COLLECTIONS = SYNC_COLLECTIONS;', 'centralize collection registry')

replace_once(
    "  const [appSettings, setAppSettings] = useState<AppCustomSettings>(initialAppSettings);\n",
    "  const [appSettings, setAppSettings] = useState<AppCustomSettings>(initialAppSettings);\n"
    "  const [localHydrated, setLocalHydrated] = useState(false);\n",
    'add local hydration state',
)

replace_once(
    "  const initialLoadDone = useRef(false);\n\n  // Firestore snapshot setters — maps collection name to its state setter\n",
    "  const initialLoadDone = useRef(false);\n"
    "  const lastPersistedSnapshot = useRef<string | null>(null);\n\n"
    "  // Firestore snapshot setters — maps collection name to its state setter\n",
    'track persisted snapshot',
)

old_setter_map = """  const setterMap: Record<string, (data: any) => void> = {
    tasks: setTasks, habits: setHabits, habitLogs: setHabitLogs,
    accounts: setAccounts, budgets: setBudgets, debts: setDebts,
    transactions: setTransactions, financialGoals: setFinancialGoals, recurringTransactions: setRecurringTransactions, books: setBooks,
    readingLogs: setReadingLogs, bookNotes: setBookNotes,
    projects: setProjects, healthLogs: setHealthLogs, workoutLogs: setWorkoutLogs,
  };
"""
new_setter_map = """  const setterMap: Record<SyncCollectionName, (data: any[]) => void> = {
    tasks: setTasks, habits: setHabits, habitLogs: setHabitLogs,
    accounts: setAccounts, budgets: setBudgets, debts: setDebts,
    transactions: setTransactions, financialGoals: setFinancialGoals, recurringTransactions: setRecurringTransactions,
    books: setBooks, readingLogs: setReadingLogs, bookNotes: setBookNotes,
    readingGroups: setReadingGroups, readingSessions: setReadingSessions,
    projects: setProjects, healthLogs: setHealthLogs, workoutLogs: setWorkoutLogs,
  };
"""
replace_once(old_setter_map, new_setter_map, 'complete snapshot setter map')

replace_once(
    "      const saved = localStorage.getItem(STORAGE_KEY);\n",
    "      const saved = localStorage.getItem(STORAGE_KEY);\n      lastPersistedSnapshot.current = saved;\n",
    'capture hydrated snapshot',
)

replace_once(
    "    initialLoadDone.current = true;\n  }, []);\n",
    "    initialLoadDone.current = true;\n    setLocalHydrated(true);\n  }, []);\n",
    'finish local hydration',
)

replace_once(
    "    if (lifeOSData.healthProfile) {\n      writes.push(setDoc(doc(db, 'users', uid, 'config', 'healthProfile'), removeUndefinedFields(lifeOSData.healthProfile)));\n    }\n    await Promise.all(writes);\n",
    "    if (lifeOSData.healthProfile) {\n      writes.push(setDoc(doc(db, 'users', uid, 'config', 'healthProfile'), removeUndefinedFields(lifeOSData.healthProfile)));\n    }\n"
    "    if (lifeOSData.appSettings) {\n      writes.push(setDoc(doc(db, 'users', uid, 'config', 'appSettings'), removeUndefinedFields(lifeOSData.appSettings)));\n    }\n"
    "    await Promise.all(writes);\n",
    'migrate legacy app settings',
)

start = text.index('  const loadFromSubcollections = async ')
end = text.index('  const setupSnapshotListeners = (uid: string) => {', start)
new_loader = """  const loadFromSubcollections = async (
    uid: string,
    firstDeviceLocalSnapshot: Record<string, unknown> = {},
  ): Promise<boolean> => {
    const counts: Record<string, number> = {};
    const promises = COLLECTIONS.map(async (colName) => {
      try {
        const snapshot = await getDocs(col(uid, colName));
        const remoteData = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        const localData = normalizeStoredCollection(firstDeviceLocalSnapshot[colName]);
        const localOnly = getLocalOnlyEntities(remoteData, localData);

        if (localOnly.length > 0) {
          await Promise.all(
            localOnly.map(item => setDoc(docRef(uid, colName, item.id), removeUndefinedFields(item))),
          );
        }

        const mergedData = mergeRemoteWithLocalOnly(remoteData, localData);
        setterMap[colName](mergedData);
        updateSyncBasePart(uid, colName, mergedData);
        counts[colName] = mergedData.length;
      } catch (e) {
        console.error(`Error loading ${colName}:`, e);
        counts[colName] = -1;
      }
    });

    const loadConfig = async (
      docName: 'shift' | 'healthProfile' | 'appSettings',
      localKey: 'shiftConfig' | 'healthProfile' | 'appSettings',
      apply: (value: any) => void,
    ) => {
      try {
        const ref = doc(db, 'users', uid, 'config', docName);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const value = snap.data();
          apply(value);
          updateSyncBasePart(uid, localKey, value);
          return;
        }

        const localValue = firstDeviceLocalSnapshot[localKey];
        if (isPlainRecord(localValue)) {
          await setDoc(ref, removeUndefinedFields(localValue));
          apply(localValue);
          updateSyncBasePart(uid, localKey, localValue);
        }
      } catch (e) {
        console.error(`Error loading ${docName} config:`, e);
      }
    };

    await Promise.all([
      ...promises,
      loadConfig('shift', 'shiftConfig', value => setShiftConfig(value as ShiftConfig)),
      loadConfig('healthProfile', 'healthProfile', value => setHealthProfile(value as HealthProfile)),
      loadConfig('appSettings', 'appSettings', value => setAppSettings(prev => ({ ...prev, ...value }))),
    ]);

    const loaded = Object.entries(counts).filter(([, c]) => c > 0).length;
    if (loaded > 0) {
      const summary = Object.entries(counts)
        .filter(([, c]) => c > 0)
        .map(([k, c]) => `${k}:${c}`)
        .join(', ');
      showToast(`Datos cargados desde la nube (${summary})`);
    }
    return loaded > 0;
  };

  const replayOfflineChanges = async (
    uid: string,
    cloudBase: Record<string, unknown>,
    currentLocal: Record<string, unknown>,
  ) => {
    const delta = diffStoredCollections(cloudBase, currentLocal);
    const writes: Promise<void>[] = [];

    for (const colName of COLLECTIONS) {
      for (const item of delta[colName].upserts) {
        writes.push(setDoc(docRef(uid, colName, item.id), removeUndefinedFields(item)));
      }
      for (const id of delta[colName].deletes) {
        writes.push(deleteDoc(docRef(uid, colName, id)));
      }
    }

    const configMappings = [
      { cloudDoc: 'shift', localKey: 'shiftConfig' },
      { cloudDoc: 'healthProfile', localKey: 'healthProfile' },
      { cloudDoc: 'appSettings', localKey: 'appSettings' },
    ] as const;

    for (const { cloudDoc, localKey } of configMappings) {
      const before = cloudBase[localKey];
      const after = currentLocal[localKey];
      if (isPlainRecord(after) && !syncValuesEqual(before, after)) {
        writes.push(setDoc(doc(db, 'users', uid, 'config', cloudDoc), removeUndefinedFields(after)));
      }
    }

    if (writes.length > 0) {
      await Promise.all(writes);
      showToast(`Cambios offline sincronizados (${writes.length})`);
    }
  };

"""
text = text[:start] + new_loader + text[end:]

# Snapshot listeners also refresh the last known cloud base.
replace_once(
    "          const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));\n          setterMap[colName](data);\n",
    "          const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));\n"
    "          setterMap[colName](data);\n"
    "          updateSyncBasePart(uid, colName, data);\n",
    'update collection sync base from snapshots',
)

replace_once(
    "    const unsubHealth = onSnapshot(\n      doc(db, 'users', uid, 'config', 'healthProfile'),\n      (snap) => { if (snap.exists()) setHealthProfile(snap.data() as HealthProfile); },\n      (err) => console.error('Error in healthProfile listener:', err)\n    );\n    unsubscribers.current.push(unsubHealth);\n",
    "    const unsubHealth = onSnapshot(\n"
    "      doc(db, 'users', uid, 'config', 'healthProfile'),\n"
    "      (snap) => {\n"
    "        if (snap.exists()) {\n"
    "          const value = snap.data() as HealthProfile;\n"
    "          setHealthProfile(value);\n"
    "          updateSyncBasePart(uid, 'healthProfile', value);\n"
    "        }\n"
    "      },\n"
    "      (err) => console.error('Error in healthProfile listener:', err)\n"
    "    );\n"
    "    unsubscribers.current.push(unsubHealth);\n"
    "    const unsubSettings = onSnapshot(\n"
    "      doc(db, 'users', uid, 'config', 'appSettings'),\n"
    "      (snap) => {\n"
    "        if (snap.exists()) {\n"
    "          const value = snap.data();\n"
    "          setAppSettings(prev => ({ ...prev, ...value }));\n"
    "          updateSyncBasePart(uid, 'appSettings', value);\n"
    "        }\n"
    "      },\n"
    "      (err) => console.error('Error in appSettings listener:', err)\n"
    "    );\n"
    "    unsubscribers.current.push(unsubSettings);\n",
    'add realtime app settings listener',
)

replace_once(
    "      (snap) => { if (snap.exists()) setShiftConfig(snap.data() as ShiftConfig); },\n",
    "      (snap) => {\n"
    "        if (snap.exists()) {\n"
    "          const value = snap.data() as ShiftConfig;\n"
    "          setShiftConfig(value);\n"
    "          updateSyncBasePart(uid, 'shiftConfig', value);\n"
    "        }\n"
    "      },\n",
    'track shift config sync base',
)

old_write_map = """    const collectionState: Partial<Record<string, SyncCollection>> = {
      tasks: 'tasks', habits: 'habits', habitLogs: 'habitLogs', projects: 'projects',
      accounts: 'finances', budgets: 'finances', debts: 'finances', transactions: 'finances', financialGoals: 'finances', recurringTransactions: 'finances',
      books: 'library', readingLogs: 'library', bookNotes: 'library', healthLogs: 'health', workoutLogs: 'health',
    };
    const stateKey = collectionState[sub];
"""
replace_once(
    old_write_map,
    "    const stateKey = isSyncCollectionName(sub) ? SYNC_STATE_BY_COLLECTION[sub] : undefined;\n",
    'use central sync-state registry',
)

# Replace auth reconciliation block so an old device never blindly overwrites existing cloud docs.
auth_start = text.index('          // 1. Check for legacy lifeOSData migration')
auth_end = text.index('          // 4. Set up real-time listeners\n          setupSnapshotListeners(user.uid);', auth_start)
new_auth = """          const localSnapshot = readStoredRecord(localStorage.getItem(STORAGE_KEY));
          const cloudBase = readSyncBase(user.uid);

          // 1. Check for legacy lifeOSData migration
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          const legacy = userDoc.exists() && userDoc.data().lifeOSData;
          if (legacy) {
            await migrateLegacyData(user.uid, userDoc.data().lifeOSData);
            await setDoc(userDocRef, { lifeOSData: deleteField() }, { merge: true });
          }

          // 2. If this device has a cloud base, replay only changes made since that base.
          //    On first connection, cloud wins id conflicts and local-only ids are preserved.
          if (cloudBase) {
            await replayOfflineChanges(user.uid, cloudBase, localSnapshot);
          }
          await loadFromSubcollections(user.uid, cloudBase ? {} : localSnapshot);
          await ensureCuratedContentInCloud(user.uid);

"""
text = text[:auth_start] + new_auth + text[auth_end:]
text = text.replace('          // 4. Set up real-time listeners\n', '          // 3. Set up real-time listeners\n', 1)

# Do not let the first mount overwrite hydrated localStorage with seed state.
local_save_start = text.index('  // --- Sync to LocalStorage (every state change, regardless of auth) ---')
local_save_end = text.index('  const signInWithGoogle = async () => {', local_save_start)
new_local_save = """  // --- Sync to LocalStorage after hydration ---
  useEffect(() => {
    if (!localHydrated) return;
    try {
      const dataToSave = {
        tasks, habits, habitLogs, accounts, budgets, debts, transactions, financialGoals, recurringTransactions,
        books, readingLogs, bookNotes, readingGroups, readingSessions, projects,
        shiftConfig, healthProfile, healthLogs, workoutLogs, appSettings,
      };
      const serialized = JSON.stringify(dataToSave);
      if (serialized !== lastPersistedSnapshot.current) {
        localStorage.setItem(STORAGE_KEY, serialized);
        lastPersistedSnapshot.current = serialized;
      }
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }, [localHydrated, tasks, habits, habitLogs, accounts, budgets, debts, transactions, financialGoals, recurringTransactions, books, readingLogs, bookNotes, readingGroups, readingSessions, projects, shiftConfig, healthProfile, healthLogs, workoutLogs, appSettings]);

"""
text = text[:local_save_start] + new_local_save + text[local_save_end:]

# Manual sync is generic and compile-time complete for every registered collection.
sync_start = text.index('  const syncToCloud = async () => {')
sync_end = text.index('  // Derived shift info', sync_start)
new_sync = """  const syncToCloud = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      const uid = currentUser.uid;
      const dataByCollection: SyncDataset = {
        tasks, habits, habitLogs, accounts, budgets, debts, transactions, financialGoals, recurringTransactions,
        books, readingLogs, bookNotes, readingGroups, readingSessions, projects, healthLogs, workoutLogs,
      };
      const allWrites: Promise<void>[] = [];

      for (const colName of COLLECTIONS) {
        for (const item of dataByCollection[colName]) {
          allWrites.push(writeToFirestore(uid, colName, item.id, item));
        }
      }

      allWrites.push(setDoc(doc(db, 'users', uid, 'config', 'shift'), removeUndefinedFields(shiftConfig)));
      allWrites.push(setDoc(doc(db, 'users', uid, 'config', 'healthProfile'), removeUndefinedFields(healthProfile)));
      allWrites.push(setDoc(doc(db, 'users', uid, 'config', 'appSettings'), removeUndefinedFields(appSettings)));
      await Promise.all(allWrites);
      setSyncState(Object.fromEntries(Object.keys(DEFAULT_SYNC_STATE).map(key => [key, 'synced'])) as SyncState);
      setLastSyncedAt(new Date().toISOString());
      showToast('Sincronizado con Google Cloud Firestore ✓');
    } catch (error) {
      console.error('Error manual syncing to cloud:', error);
    } finally {
      setIsSyncing(false);
    }
  };

"""
text = text[:sync_start] + new_sync + text[sync_end:]

# Calendar-day values must use device-local date, not UTC date.
text = text.replace("new Date().toISOString().split('T')[0]", 'todayLocalDate()')

# Recurrence uses date-only arithmetic, including month-end clamping.
rec_start = text.index('  const createNextRecurringTask = (completedTask: Task): Task | null => {')
rec_end = text.index('  // --- Task Operations ---', rec_start)
new_rec = """  const createNextRecurringTask = (completedTask: Task): Task | null => {
    if (!completedTask.recurrence) return null;
    const baseDue = completedTask.dueDate || todayLocalDate();
    const interval = completedTask.recurrence.interval || 1;
    let nextDue = baseDue;

    switch (completedTask.recurrence.type) {
      case 'daily':
        nextDue = addDaysToDateOnly(baseDue, interval);
        break;
      case 'weekly':
        nextDue = addDaysToDateOnly(baseDue, 7 * interval);
        break;
      case 'monthly':
        nextDue = addMonthsToDateOnly(baseDue, interval);
        break;
    }

    const newTask: Task = {
      ...completedTask,
      id: `task_${Date.now()}`,
      status: 'todo',
      createdAt: todayLocalDate(),
      dueDate: nextDue,
      completedAt: undefined,
      completedCount: (completedTask.completedCount || 0) + 1,
    };
    delete newTask.recurrence;
    if (completedTask.recurrence.endsAfter && (completedTask.completedCount || 0) + 1 >= completedTask.recurrence.endsAfter) {
      return null;
    }
    newTask.recurrence = completedTask.recurrence;
    return newTask;
  };

"""
text = text[:rec_start] + new_rec + text[rec_end:]

# Habit streaks use date-only cursors and are DST/timezone safe.
streak_start = text.index('  const recalcStreak = (habitId: string, allLogs: HabitLog[])')
streak_end = text.index('  const logHabit = (habitId: string,', streak_start)
new_streak = """  const recalcStreak = (habitId: string, allLogs: HabitLog[]): { streak: number; bestStreak: number } => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return { streak: 0, bestStreak: 0 };
    const logs = allLogs.filter(l => l.habitId === habitId).map(l => l.date).sort();
    const logSet = new Set(logs);
    const bestStreak = habit.bestStreak || 0;
    const today = todayLocalDate();

    let currentStreak = 0;
    let allowSkip = true;
    let cursor = addDaysToDateOnly(today, -1);

    while (true) {
      if (logSet.has(cursor)) {
        currentStreak++;
        allowSkip = true;
        cursor = addDaysToDateOnly(cursor, -1);
      } else if (allowSkip) {
        allowSkip = false;
        cursor = addDaysToDateOnly(cursor, -1);
      } else {
        break;
      }
    }

    if (logSet.has(today)) currentStreak++;
    return { streak: currentStreak, bestStreak: Math.max(bestStreak, currentStreak) };
  };

"""
text = text[:streak_start] + new_streak + text[streak_end:]
text = text.replace(
    "const logHabit = (habitId: string, dateStr = todayLocalDate(), value = 1, notes = '') => {",
    "const logHabit = (habitId: string, dateStr = todayLocalDate(), value = 1, notes = '') => {",
    1,
)

# Implement the ReadingGroup/ReadingSession API that was declared but absent from the provider.
health_marker = '  // Health Actions\n'
if text.count(health_marker) != 1:
    raise SystemExit('health marker not unique')
reading_actions = """  // Reading session and group actions
  const startReadingSession = (bookId: string, groupId?: string, notes?: string) => {
    const now = new Date();
    const session: ReadingSession = {
      id: `reading_session_${Date.now()}`,
      bookId,
      groupId,
      userId: currentUser?.uid || 'local',
      date: todayLocalDate(),
      startTime: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
      pagesRead: 0,
      duration: 0,
      notes,
      createdAt: now.toISOString(),
    };
    setReadingSessions(prev => [session, ...prev]);
    if (currentUser) writeToFirestore(currentUser.uid, 'readingSessions', session.id, session);
    showToast('Sesión de lectura iniciada.');
  };

  const endReadingSession = (sessionId: string) => {
    const now = new Date();
    setReadingSessions(prev => prev.map(session => {
      if (session.id !== sessionId) return session;
      const startedAt = new Date(`${session.date}T${session.startTime}:00`);
      const duration = Number.isNaN(startedAt.getTime())
        ? session.duration
        : Math.max(session.duration, Math.round((now.getTime() - startedAt.getTime()) / 60_000));
      const updated: ReadingSession = {
        ...session,
        endTime: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
        duration,
      };
      if (currentUser) writeToFirestore(currentUser.uid, 'readingSessions', sessionId, updated);
      return updated;
    }));
    showToast('Sesión de lectura finalizada.');
  };

  const updateReadingSession = (sessionId: string, updates: Partial<ReadingSession>) => {
    setReadingSessions(prev => prev.map(session => {
      if (session.id !== sessionId) return session;
      const updated = { ...session, ...updates, id: session.id };
      if (currentUser) writeToFirestore(currentUser.uid, 'readingSessions', sessionId, updated);
      return updated;
    }));
  };

  const createReadingGroup = (group: Omit<ReadingGroup, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) => {
    const now = new Date().toISOString();
    const created: ReadingGroup = {
      ...group,
      id: `reading_group_${Date.now()}`,
      ownerId: group.ownerId || currentUser?.uid || 'local',
      memberIds: Array.from(new Set(group.memberIds || [])),
      membersCount: new Set(group.memberIds || []).size,
      progress: 0,
      createdAt: now,
      updatedAt: now,
    };
    setReadingGroups(prev => [created, ...prev]);
    if (currentUser) writeToFirestore(currentUser.uid, 'readingGroups', created.id, created);
    showToast(`Grupo de lectura "${created.name}" creado.`);
  };

  const updateReadingGroup = (group: ReadingGroup) => {
    const updated = { ...group, updatedAt: new Date().toISOString() };
    setReadingGroups(prev => prev.map(item => item.id === group.id ? updated : item));
    if (currentUser) writeToFirestore(currentUser.uid, 'readingGroups', group.id, updated);
  };

  const deleteReadingGroup = (groupId: string) => {
    setReadingGroups(prev => prev.filter(group => group.id !== groupId));
    if (currentUser) deleteFromFirestore(currentUser.uid, 'readingGroups', groupId);
    showToast('Grupo de lectura eliminado.');
  };

  const updateReadingGroupProgress = (groupId: string, progress: number, currentPage: number) => {
    setReadingGroups(prev => prev.map(group => {
      if (group.id !== groupId) return group;
      const updated: ReadingGroup = {
        ...group,
        progress: Math.max(0, Math.min(100, progress)),
        currentPage: Math.max(0, currentPage),
        updatedAt: new Date().toISOString(),
      };
      if (currentUser) writeToFirestore(currentUser.uid, 'readingGroups', groupId, updated);
      return updated;
    }));
  };

  const addReadingGroupMember = (groupId: string, memberId: string) => {
    if (!memberId) return;
    setReadingGroups(prev => prev.map(group => {
      if (group.id !== groupId) return group;
      const memberIds = Array.from(new Set([...group.memberIds, memberId]));
      const updated = { ...group, memberIds, membersCount: memberIds.length, updatedAt: new Date().toISOString() };
      if (currentUser) writeToFirestore(currentUser.uid, 'readingGroups', groupId, updated);
      return updated;
    }));
  };

  const removeReadingGroupMember = (groupId: string, memberId: string) => {
    setReadingGroups(prev => prev.map(group => {
      if (group.id !== groupId) return group;
      const memberIds = group.memberIds.filter(id => id !== memberId);
      const updated = { ...group, memberIds, membersCount: memberIds.length, updatedAt: new Date().toISOString() };
      if (currentUser) writeToFirestore(currentUser.uid, 'readingGroups', groupId, updated);
      return updated;
    }));
  };

"""
text = text.replace(health_marker, reading_actions + health_marker, 1)

# Expose the state/actions that were already declared in LifeOSContextType.
replace_once(
    "        books, readingLogs, bookNotes, healthProfile, healthLogs, workoutLogs,\n",
    "        books, readingLogs, bookNotes, readingGroups, readingSessions, healthProfile, healthLogs, workoutLogs,\n",
    'expose reading sync state',
)
replace_once(
    "        addBook, updateBookProgress, updateBookStatus, addBookNote,\n        addWorkoutLog, deleteWorkoutLog,\n",
    "        addBook, updateBookProgress, updateBookStatus, addBookNote,\n"
    "        startReadingSession, endReadingSession, updateReadingSession,\n"
    "        createReadingGroup, updateReadingGroup, deleteReadingGroup, updateReadingGroupProgress,\n"
    "        addReadingGroupMember, removeReadingGroupMember,\n"
    "        addWorkoutLog, deleteWorkoutLog,\n",
    'expose reading sync actions',
)

# The Context file must no longer derive date-only values from UTC.
if ".toISOString().split('T')[0]" in text:
    raise SystemExit("UTC date-only conversion remains in LifeOSContext.tsx")

path.write_text(text)

# Remove this one-shot patcher and workflow from the final branch commit.
Path('scripts/phase2_patch.py').unlink(missing_ok=True)
Path('.github/workflows/phase2-apply.yml').unlink(missing_ok=True)
