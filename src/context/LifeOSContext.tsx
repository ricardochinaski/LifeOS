import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import {
  AreaCategory, Project, Task, Habit, HabitLog,
  FinancialAccount, Transaction, Budget, Debt, Book, ReadingLog, BookNote,
  TabType, QuickCaptureParsed, Priority, TaskStatus, ShiftConfig, ShiftInfo, ShiftType,
  HealthProfile, HealthLog, ReadingGroup, ReadingSession, AppCustomSettings,
  FinancialGoal, RecurringTransaction, SyncState,
  WorkoutLog, WorkoutType
} from '../types';
import {
  initialAreas, initialProjects, initialTasks, initialHabits,
  initialHabitLogs, initialAccounts, initialBudgets,
  initialTransactions, initialDebts, initialBooks, initialReadingLogs, initialBookNotes,
  initialHealthProfile, initialHealthLogs, initialAppSettings
} from '../data/seedData';
import { DEFAULT_SHIFT_CONFIG, calculateShiftInfo, getAnchorDateForDay } from '../utils/shiftUtils';
import { updateWidgetData } from '../lib/widgetBridge';
import {
  auth, db, signInWithPopup, signInWithCredential, GoogleAuthProvider, signOut, onAuthStateChanged,
  doc, setDoc, getDoc, getDocs, onSnapshot, collection, query, orderBy, updateDoc, deleteDoc, deleteField, User
} from '../lib/firebase';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { isNative } from '../lib/native';
import { scheduleTaskNotifications } from '../utils/notifications';
import { addDaysToDateOnly, addMonthsToDateOnly, todayLocalDate } from '../lib/dateOnly';
import {
  diffStoredCollections, getLocalOnlyEntities, isSyncCollectionName, mergeRemoteWithLocalOnly,
  normalizeStoredCollection, SYNC_COLLECTIONS, SYNC_STATE_BY_COLLECTION, syncValuesEqual,
  type SyncCollectionName, type SyncDataset,
} from '../lib/syncEngine';
import {
  CURATED_CONTENT_KEY, STORAGE_KEY, isPlainRecord, mergeMissingSeeds, persistSnapshotIfChanged,
  readStoredRecord, readSyncBase, removeUndefinedFields, updateSyncBasePart,
} from '../lib/lifeosPersistence';

interface LifeOSContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Google Auth & Cloud Sync
  currentUser: User | null;
  isSyncing: boolean;
  syncState: SyncState;
  lastSyncedAt: string | null;
  isSigningIn: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  syncToCloud: () => Promise<void>;
  
  // Shift 14x14 State & Actions
  shiftConfig: ShiftConfig;
  shiftInfo: ShiftInfo;
  isShiftCalibrationOpen: boolean;
  openShiftCalibration: () => void;
  closeShiftCalibration: () => void;
  calibrateShift: (dayInPhase: number, phase: ShiftType, restDays?: number, workDays?: number) => void;
  updateShiftConfig: (configPartial: Partial<ShiftConfig>) => void;

  // Data State
  areas: AreaCategory[];
  projects: Project[];
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  accounts: FinancialAccount[];
  budgets: Budget[];
  debts: Debt[];
  transactions: Transaction[];
  financialGoals: FinancialGoal[];
  recurringTransactions: RecurringTransaction[];
  books: Book[];
  readingLogs: ReadingLog[];
  bookNotes: BookNote[];
  readingGroups: ReadingGroup[];
  readingSessions: ReadingSession[];
  healthProfile: HealthProfile;
  healthLogs: HealthLog[];
  workoutLogs: WorkoutLog[];

  // Health Actions
  updateHealthProfile: (partial: Partial<HealthProfile>) => void;
  addHealthLog: (log: Omit<HealthLog, 'id'>) => void;
  deleteHealthLog: (id: string) => void;
  addWorkoutLog: (log: Omit<WorkoutLog, 'id'>) => void;
  deleteWorkoutLog: (id: string) => void;

  // Quick Capture & UI
  isQuickCaptureOpen: boolean;
  openQuickCapture: () => void;
  closeQuickCapture: () => void;
  isAICopilotOpen: boolean;
  openAICopilot: () => void;
  closeAICopilot: () => void;
  isVoiceModalOpen: boolean;
  openVoiceModal: () => void;
  closeVoiceModal: () => void;
  parseQuickCapture: (text: string) => QuickCaptureParsed;
  executeQuickCapture: (text: string) => { success: boolean; message: string };

  // Task & Project Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  toggleTaskStatus: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  updateTask: (task: Task) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  toggleProjectMilestone: (projectId: string, milestoneId: string) => void;

  // Habit Actions
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'bestStreak'>) => void;
  updateHabit: (habit: Habit) => void;
  logHabit: (habitId: string, dateStr?: string, value?: number, notes?: string) => void;
  updateHabitLog: (logId: string, updates: Partial<HabitLog>) => void;
  deleteHabit: (habitId: string) => void;

  // Finance Actions
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (txId: string) => void;
  addAccount: (acc: Omit<FinancialAccount, 'id'>) => void;
  updateAccount: (acc: FinancialAccount) => void;
  deleteAccount: (accId: string) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (budgetId: string) => void;
  addDebt: (debt: Omit<Debt, 'id'>) => void;
  updateDebt: (debt: Debt) => void;
  deleteDebt: (debtId: string) => void;
  payDebt: (debtId: string, amount: number, accountId: string) => void;
  addFinancialGoal: (goal: Omit<FinancialGoal, 'id' | 'createdAt'>) => void;
  updateFinancialGoal: (goal: FinancialGoal) => void;
  deleteFinancialGoal: (goalId: string) => void;
  addRecurringTransaction: (item: Omit<RecurringTransaction, 'id'>) => void;
  updateRecurringTransaction: (item: RecurringTransaction) => void;
  deleteRecurringTransaction: (id: string) => void;

  // Book Actions
  addBook: (book: Omit<Book, 'id' | 'createdAt'>) => void;
  updateBookProgress: (bookId: string, newPage: number, notes?: string) => void;
  updateBookStatus: (bookId: string, status: Book['status']) => void;
  addBookNote: (note: Omit<BookNote, 'id' | 'createdAt'>) => void;
  startReadingSession: (bookId: string, groupId?: string, notes?: string) => void;
  endReadingSession: (sessionId: string) => void;
  updateReadingSession: (sessionId: string, updates: Partial<ReadingSession>) => void;

  // Reading Group Actions
  createReadingGroup: (group: Omit<ReadingGroup, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) => void;
  updateReadingGroup: (group: ReadingGroup) => void;
  deleteReadingGroup: (groupId: string) => void;
  updateReadingGroupProgress: (groupId: string, progress: number, currentPage: number) => void;
  addReadingGroupMember: (groupId: string, memberId: string) => void;
  removeReadingGroupMember: (groupId: string, memberId: string) => void;

  // Export / Reset
  exportDataJSON: () => void;
  importDataJSON: (data: Record<string, unknown>, mode: 'merge' | 'replace') => void;
  resetToDefaults: (skipConfirm?: boolean) => void;
  
  // Toast notifications
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Integration Modals
  isCalendarModalOpen: boolean;
  openCalendarModal: () => void;
  closeCalendarModal: () => void;
  isNotificationsModalOpen: boolean;
  openNotificationsModal: () => void;
  closeNotificationsModal: () => void;
  isFitModalOpen: boolean;
  openFitModal: () => void;
  closeFitModal: () => void;

  // App Settings
  appSettings: AppCustomSettings;
  updateAppSettings: (partial: Partial<AppCustomSettings>) => void;
}

const LifeOSContext = createContext<LifeOSContextType | undefined>(undefined);

// Firestore subcollection helpers
const col = (uid: string, sub: string) => collection(db, 'users', uid, sub);
const docRef = (uid: string, sub: string, id: string) => doc(db, 'users', uid, sub, id);

// List of collection names to migrate/load
const COLLECTIONS = SYNC_COLLECTIONS;
const DEFAULT_SYNC_STATE: SyncState = { tasks: 'idle', habits: 'idle', habitLogs: 'idle', finances: 'idle', library: 'idle', health: 'idle', projects: 'idle', settings: 'idle' };

const curatedTasks = initialTasks.filter((task) => task.id.startsWith('task_home_') || task.id.startsWith('task_personal_') || task.id.startsWith('task_finance_subscription_'));
const curatedHabits = initialHabits.filter((habit) => habit.id.startsWith('habit_core_'));
const curatedBooks = initialBooks.filter((book) => book.id.startsWith('book_core_'));

export const LifeOSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('lifeos_dark_mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState<boolean>(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState<boolean>(false);
  const [isShiftCalibrationOpen, setIsShiftCalibrationOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState<boolean>(false);
  const [isFitModalOpen, setIsFitModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const openQuickCapture = () => setIsQuickCaptureOpen(true);
  const closeQuickCapture = () => setIsQuickCaptureOpen(false);
  const openAICopilot = () => setIsAICopilotOpen(true);
  const closeAICopilot = () => setIsAICopilotOpen(false);
  const openVoiceModal = () => setIsVoiceModalOpen(true);
  const closeVoiceModal = () => setIsVoiceModalOpen(false);
  const openCalendarModal = () => setIsCalendarModalOpen(true);
  const closeCalendarModal = () => setIsCalendarModalOpen(false);
  const openNotificationsModal = () => setIsNotificationsModalOpen(true);
  const closeNotificationsModal = () => setIsNotificationsModalOpen(false);
  const openFitModal = () => setIsFitModalOpen(true);
  const closeFitModal = () => setIsFitModalOpen(false);

  // Shift 14x14 configuration
  const [shiftConfig, setShiftConfig] = useState<ShiftConfig>(DEFAULT_SHIFT_CONFIG);

  // Core collections initialized from LocalStorage or seedData
  const [areas, setAreas] = useState<AreaCategory[]>(initialAreas);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>(initialHabitLogs);
  const [accounts, setAccounts] = useState<FinancialAccount[]>(initialAccounts);
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [debts, setDebts] = useState<Debt[]>(initialDebts);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [readingLogs, setReadingLogs] = useState<ReadingLog[]>(initialReadingLogs);
  const [bookNotes, setBookNotes] = useState<BookNote[]>(initialBookNotes);
  const [readingGroups, setReadingGroups] = useState<ReadingGroup[]>([]);
  const [readingSessions, setReadingSessions] = useState<ReadingSession[]>([]);
  const [healthProfile, setHealthProfile] = useState<HealthProfile>(initialHealthProfile);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>(initialHealthLogs);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [appSettings, setAppSettings] = useState<AppCustomSettings>(initialAppSettings);
  const [localHydrated, setLocalHydrated] = useState(false);

  // Auth & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncState, setSyncState] = useState<SyncState>(DEFAULT_SYNC_STATE);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // Track snapshot listeners so we can teardown on logout
  const unsubscribers = useRef<(() => void)[]>([]);
  const teardownListeners = () => {
    unsubscribers.current.forEach(u => u());
    unsubscribers.current = [];
  };

  // Track if we are in the initial auth load to avoid saving stale localStorage
  const initialLoadDone = useRef(false);
  const lastPersistedSnapshot = useRef<string | null>(null);

  // Firestore snapshot setters — maps collection name to its state setter
  const setterMap: Record<SyncCollectionName, (data: any[]) => void> = {
    tasks: setTasks, habits: setHabits, habitLogs: setHabitLogs,
    accounts: setAccounts, budgets: setBudgets, debts: setDebts,
    transactions: setTransactions, financialGoals: setFinancialGoals, recurringTransactions: setRecurringTransactions,
    books: setBooks, readingLogs: setReadingLogs, bookNotes: setBookNotes,
    readingGroups: setReadingGroups, readingSessions: setReadingSessions,
    projects: setProjects, healthLogs: setHealthLogs, workoutLogs: setWorkoutLogs,
  };

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      lastPersistedSnapshot.current = saved;
      if (saved) {
        const parsed = JSON.parse(saved);
        const shouldAddCuratedContent = localStorage.getItem(CURATED_CONTENT_KEY) !== 'done';
        if (parsed.tasks) setTasks(shouldAddCuratedContent ? mergeMissingSeeds(parsed.tasks, curatedTasks) : parsed.tasks);
        if (parsed.habits) setHabits(shouldAddCuratedContent ? mergeMissingSeeds(parsed.habits, curatedHabits) : parsed.habits);
        if (parsed.habitLogs) setHabitLogs(parsed.habitLogs);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.budgets) setBudgets(parsed.budgets);
        if (parsed.debts) setDebts(parsed.debts);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.financialGoals) setFinancialGoals(parsed.financialGoals);
        if (parsed.recurringTransactions) setRecurringTransactions(parsed.recurringTransactions);
        if (parsed.books) setBooks(shouldAddCuratedContent ? mergeMissingSeeds(parsed.books, curatedBooks) : parsed.books);
        if (parsed.readingLogs) setReadingLogs(parsed.readingLogs);
        if (parsed.bookNotes) setBookNotes(parsed.bookNotes);
        if (parsed.projects) setProjects(parsed.projects);
        if (parsed.readingGroups) setReadingGroups(parsed.readingGroups);
        if (parsed.readingSessions) setReadingSessions(parsed.readingSessions);
        if (parsed.shiftConfig) setShiftConfig(parsed.shiftConfig);
        if (parsed.healthProfile) setHealthProfile(parsed.healthProfile);
        if (parsed.healthLogs) setHealthLogs(parsed.healthLogs);
        if (parsed.workoutLogs) setWorkoutLogs(parsed.workoutLogs);
        if (parsed.appSettings) setAppSettings(parsed.appSettings);
        if (shouldAddCuratedContent) localStorage.setItem(CURATED_CONTENT_KEY, 'done');
      } else {
        localStorage.setItem(CURATED_CONTENT_KEY, 'done');
      }
    } catch (e) {
      console.error('Error reading localStorage for LifeOS:', e);
    }
    initialLoadDone.current = true;
    setLocalHydrated(true);
  }, []);

  // --- Firestore helpers ---

  const migrateLegacyData = async (uid: string, lifeOSData: any) => {
    const writes: Promise<void>[] = [];
    for (const colName of COLLECTIONS) {
      const items = lifeOSData[colName];
      if (items && Array.isArray(items)) {
        for (const item of items) {
          if (item.id) {
            writes.push(setDoc(docRef(uid, colName, item.id), removeUndefinedFields(item)).catch(e =>
              console.error(`Error migrating ${colName}/${item.id}:`, e)
            ));
          }
        }
      }
    }
    // Single config docs
    if (lifeOSData.shiftConfig) {
      writes.push(setDoc(doc(db, 'users', uid, 'config', 'shift'), removeUndefinedFields(lifeOSData.shiftConfig)));
    }
    if (lifeOSData.healthProfile) {
      writes.push(setDoc(doc(db, 'users', uid, 'config', 'healthProfile'), removeUndefinedFields(lifeOSData.healthProfile)));
    }
    if (lifeOSData.appSettings) {
      writes.push(setDoc(doc(db, 'users', uid, 'config', 'appSettings'), removeUndefinedFields(lifeOSData.appSettings)));
    }
    await Promise.all(writes);
  };

  const ensureCuratedContentInCloud = async (uid: string) => {
    const markerRef = doc(db, 'users', uid, 'config', CURATED_CONTENT_KEY);
    const marker = await getDoc(markerRef);
    if (marker.exists()) return;

    const seedCollections = [
      { name: 'tasks', seeds: curatedTasks, setter: setTasks },
      { name: 'habits', seeds: curatedHabits, setter: setHabits },
      { name: 'books', seeds: curatedBooks, setter: setBooks },
    ] as const;

    const writes: Promise<void>[] = [];
    for (const seedCollection of seedCollections) {
      const snapshot = await getDocs(col(uid, seedCollection.name));
      const existingIds = new Set(snapshot.docs.map((item) => item.id));
      const missingSeeds = seedCollection.seeds.filter((item) => !existingIds.has(item.id));
      if (missingSeeds.length > 0) {
        seedCollection.setter((current: any[]) => mergeMissingSeeds(current, missingSeeds as any));
        for (const seed of missingSeeds) {
          writes.push(setDoc(docRef(uid, seedCollection.name, seed.id), removeUndefinedFields(seed)));
        }
      }
    }

    writes.push(setDoc(markerRef, { version: CURATED_CONTENT_KEY, appliedAt: new Date().toISOString() }, { merge: true }));
    await Promise.all(writes);
  };

  const loadFromSubcollections = async (
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
        if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
          updateSyncBasePart(uid, colName, mergedData);
        }
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
          if (!snap.metadata.fromCache && !snap.metadata.hasPendingWrites) {
            updateSyncBasePart(uid, localKey, value);
          }
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

  const setupSnapshotListeners = (uid: string) => {
    teardownListeners();
    for (const colName of COLLECTIONS) {
      const unsub = onSnapshot(
        col(uid, colName),
        (snapshot) => {
          const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
          setterMap[colName](data);
          if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
            updateSyncBasePart(uid, colName, data);
          }
        },
        (err) => console.error(`Error in ${colName} listener:`, err)
      );
      unsubscribers.current.push(unsub);
    }
    // Listeners for single config docs
    const unsubShift = onSnapshot(
      doc(db, 'users', uid, 'config', 'shift'),
      (snap) => {
        if (snap.exists()) {
          const value = snap.data() as ShiftConfig;
          setShiftConfig(value);
          if (!snap.metadata.fromCache && !snap.metadata.hasPendingWrites) updateSyncBasePart(uid, 'shiftConfig', value);
        }
      },
      (err) => console.error('Error in shiftConfig listener:', err)
    );
    unsubscribers.current.push(unsubShift);
    const unsubHealth = onSnapshot(
      doc(db, 'users', uid, 'config', 'healthProfile'),
      (snap) => {
        if (snap.exists()) {
          const value = snap.data() as HealthProfile;
          setHealthProfile(value);
          if (!snap.metadata.fromCache && !snap.metadata.hasPendingWrites) updateSyncBasePart(uid, 'healthProfile', value);
        }
      },
      (err) => console.error('Error in healthProfile listener:', err)
    );
    unsubscribers.current.push(unsubHealth);
    const unsubSettings = onSnapshot(
      doc(db, 'users', uid, 'config', 'appSettings'),
      (snap) => {
        if (snap.exists()) {
          const value = snap.data();
          setAppSettings(prev => ({ ...prev, ...value }));
          if (!snap.metadata.fromCache && !snap.metadata.hasPendingWrites) updateSyncBasePart(uid, 'appSettings', value);
        }
      },
      (err) => console.error('Error in appSettings listener:', err)
    );
    unsubscribers.current.push(unsubSettings);
  };

  // Write helper: updates local state AND writes to Firestore
  const writeToFirestore = async (uid: string, sub: string, id: string, data: any, throwOnError = false) => {
    const stateKey = isSyncCollectionName(sub) ? SYNC_STATE_BY_COLLECTION[sub] : undefined;
    if (stateKey) setSyncState(prev => ({ ...prev, [stateKey]: 'syncing' }));
    try {
      await setDoc(docRef(uid, sub, id), removeUndefinedFields(data));
      if (stateKey) setSyncState(prev => ({ ...prev, [stateKey]: 'synced' }));
      setLastSyncedAt(new Date().toISOString());
    } catch (e) {
      console.error(`Error writing ${sub}/${id} to Firestore:`, e);
      if (stateKey) setSyncState(prev => ({ ...prev, [stateKey]: 'error' }));
      showToast(`No se pudo sincronizar ${sub}. Revisa la consola.`);
      if (throwOnError) throw e;
    }
  };

  const deleteFromFirestore = async (uid: string, sub: string, id: string) => {
    try {
      await deleteDoc(docRef(uid, sub, id));
    } catch (e) {
      console.error(`Error deleting ${sub}/${id} from Firestore:`, e);
    }
  };

  // --- Auth Listener ---

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsSyncing(true);
        try {
          const localSnapshot = readStoredRecord(localStorage.getItem(STORAGE_KEY));
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

          // 3. Set up real-time listeners
          setupSnapshotListeners(user.uid);
        } catch (error) {
          console.error('Error loading Firestore data:', error);
        } finally {
          setIsSyncing(false);
        }
      } else {
        teardownListeners();
      }
    });
    return () => { unsubscribe(); teardownListeners(); };
  }, []);

  // --- Sync to LocalStorage after hydration ---
  useEffect(() => {
    if (!localHydrated) return;
    try {
      const dataToSave = {
        tasks, habits, habitLogs, accounts, budgets, debts, transactions, financialGoals, recurringTransactions,
        books, readingLogs, bookNotes, readingGroups, readingSessions, projects,
        shiftConfig, healthProfile, healthLogs, workoutLogs, appSettings,
      };
      lastPersistedSnapshot.current = persistSnapshotIfChanged(
        dataToSave,
        lastPersistedSnapshot.current,
      );
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }, [localHydrated, tasks, habits, habitLogs, accounts, budgets, debts, transactions, financialGoals, recurringTransactions, books, readingLogs, bookNotes, readingGroups, readingSessions, projects, shiftConfig, healthProfile, healthLogs, workoutLogs, appSettings]);

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    try {
      if (isNative()) {
        const result = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
        const idToken = result.credential?.idToken;
        if (!idToken) throw new Error('No idToken');
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      } else {
        await signInWithPopup(auth, new GoogleAuthProvider());
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      const msg = `Sign-In error: ${error?.message || error || ''}`;
      showToast(msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const logout = async () => {
    setIsSigningIn(true);
    try {
      if (isNative()) await FirebaseAuthentication.signOut();
      await signOut(auth);
      showToast('Sesion de Google cerrada.');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const syncToCloud = async () => {
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
          allWrites.push(writeToFirestore(uid, colName, item.id, item, true));
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

  // Derived shift info
  const shiftInfo = calculateShiftInfo(shiftConfig);

  const openShiftCalibration = () => setIsShiftCalibrationOpen(true);
  const closeShiftCalibration = () => setIsShiftCalibrationOpen(false);

  const calibrateShift = (dayInPhase: number, phase: ShiftType, restDays = 14, workDays = 14) => {
    const todayStr = todayLocalDate();
    const newAnchorDate = getAnchorDateForDay(dayInPhase, phase, todayStr);
    setShiftConfig((prev) => ({
      ...prev,
      restDays, workDays,
      currentPhase: phase,
      currentDayInPhase: dayInPhase,
      anchorDate: newAnchorDate,
    }));
    if (currentUser) {
      setDoc(doc(db, 'users', currentUser.uid, 'config', 'shift'), removeUndefinedFields({
        restDays, workDays, currentPhase: phase, currentDayInPhase: dayInPhase, anchorDate: newAnchorDate
      }), { merge: true }).catch(e => console.error('Error saving shift config:', e));
    }
    showToast(`Turno calibrado: Día ${dayInPhase} de ${dayInPhase > restDays ? workDays : restDays} (${phase === 'rest' ? 'Descanso' : 'Faena Minera'})`);
  };

  const updateShiftConfig = (configPartial: Partial<ShiftConfig>) => {
    setShiftConfig((prev) => {
      const next = { ...prev, ...configPartial };
      if (currentUser) {
        setSyncState(state => ({ ...state, settings: 'syncing' }));
        setDoc(doc(db, 'users', currentUser.uid, 'config', 'shift'), removeUndefinedFields(next))
          .then(() => {
            setSyncState(state => ({ ...state, settings: 'synced' }));
            setLastSyncedAt(new Date().toISOString());
          })
          .catch(() => setSyncState(state => ({ ...state, settings: 'error' })));
      }
      return next;
    });
  };

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('lifeos_dark_mode', String(darkMode));
  }, [darkMode]);

  // Update Android widget
  useEffect(() => {
    const status = shiftInfo.phase === 'rest' ? 'Descanso 🏠' : 'Faena ⛏️';
    const day = `Día ${shiftInfo.dayInPhase} de ${shiftInfo.totalPhaseDays}`;
    updateWidgetData(status, day, shiftInfo.phase === 'rest');
  }, [shiftInfo]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const checkBudgetAlert = (newTx: Transaction, currentBudgets: Budget[], currentTxs: Transaction[]) => {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    for (const budget of currentBudgets) {
      const spent = currentTxs
        .filter(t => t.type === 'expense' && t.category === budget.category && t.date?.startsWith(monthStr))
        .reduce((sum, t) => sum + t.amount, 0);
      const pct = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;
      if (pct >= 100) {
        showToast(`ALERTA: Presupuesto "${budget.category}" excedido! $${spent.toLocaleString()} / $${budget.monthlyLimit.toLocaleString()}`);
      } else if (pct >= 80) {
        showToast(`Aviso: Presupuesto "${budget.category}" al ${Math.round(pct)}%. $${spent.toLocaleString()} usado de $${budget.monthlyLimit.toLocaleString()}`);
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B']
      });
    } catch (e) { /* fallback */ }
  };

  // Quick Capture Parser
  const parseQuickCapture = (text: string): QuickCaptureParsed => {
    const trimmed = text.trim();
    let priority: Priority = 'p4';
    let type: 'task' | 'habit' | 'transaction' | 'reading' = 'task';
    let dueDate = todayLocalDate();
    let areaId: string | undefined = undefined;
    let amount: number | undefined = undefined;
    let pages: number | undefined = undefined;

    if (/\bp1\b/i.test(trimmed)) priority = 'p1';
    else if (/\bp2\b/i.test(trimmed)) priority = 'p2';
    else if (/\bp3\b/i.test(trimmed)) priority = 'p3';

    if (/#salud|#health/i.test(trimmed)) areaId = 'area_health';
    else if (/#trabajo|#work/i.test(trimmed)) areaId = 'area_work';
    else if (/#finanzas|#finance/i.test(trimmed)) areaId = 'area_finance';
    else if (/#desarrollo|#aprender|#learning/i.test(trimmed)) areaId = 'area_learning';
    else if (/#hogar|#home/i.test(trimmed)) areaId = 'area_home';

    const amountMatch = trimmed.match(/(\$|USD\s*)?(\d+(\.\d{1,2})?)(\$)?/i);
    if (trimmed.includes('$') || /\b(gasto|compra|pago)\b/i.test(trimmed)) {
      if (amountMatch && amountMatch[2]) {
        type = 'transaction';
        amount = parseFloat(amountMatch[2]);
      }
    }

    const pagesMatch = trimmed.match(/\b(leer|pág|pag|páginas)\s*(\d+)/i);
    if (pagesMatch) {
      type = 'reading';
      pages = parseInt(pagesMatch[2], 10);
    }

    if (/\b(hábito|habito|diario|todos los días)\b/i.test(trimmed)) {
      type = 'habit';
    }

    const cleanTitle = trimmed
      .replace(/#\w+/g, '')
      .replace(/\bp[1-4]\b/gi, '')
      .trim();

    return {
      title: cleanTitle || text, type, priority, areaId, dueDate, amount, pages,
    };
  };

  const executeQuickCapture = (text: string) => {
    const parsed = parseQuickCapture(text);
    if (!parsed.title) return { success: false, message: 'Ingresa una descripción válida.' };

    const todayStr = todayLocalDate();

    if (parsed.type === 'transaction' && parsed.amount) {
      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        accountId: accounts[0]?.id || 'acc_1',
        type: 'expense',
        amount: parsed.amount,
        category: 'Gasto Rápido',
        areaId: parsed.areaId || 'area_finance',
        description: parsed.title,
        date: todayStr,
      };
      addTransaction(newTx);
      showToast(`Gasto de $${parsed.amount} registrado en Finanzas.`);
      return { success: true, message: `Transacción agregada en Finanzas ($${parsed.amount})` };
    }

    if (parsed.type === 'reading' && parsed.pages) {
      const activeBook = books.find(b => b.status === 'reading') || books[0];
      if (activeBook) {
        updateBookProgress(activeBook.id, activeBook.currentPage + parsed.pages, `Registro rápido NLP: ${parsed.title}`);
        showToast(`+${parsed.pages} páginas registradas en "${activeBook.title}".`);
        return { success: true, message: `Progreso registrado en libro "${activeBook.title}"` };
      }
    }

    if (parsed.type === 'habit') {
      addHabit({
        title: parsed.title,
        areaId: parsed.areaId || 'area_health',
        color: '#10B981',
        icon: 'Sparkles',
        frequency: 'daily',
        targetValue: 1,
        unit: 'veces',
      });
      showToast(`Nuevo hábito "${parsed.title}" creado.`);
      return { success: true, message: `Hábito "${parsed.title}" registrado.` };
    }

    // Default: Task
    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: parsed.title,
      status: 'todo',
      priority: parsed.priority || 'p3',
      dueDate: parsed.dueDate,
      areaId: parsed.areaId || 'area_work',
      subtasks: [],
      createdAt: todayStr,
    };
    addTask(newTask);
    showToast(`Tarea "${parsed.title}" agregada a tus pendientes.`);
    return { success: true, message: `Tarea "${parsed.title}" agregada (${parsed.priority?.toUpperCase()})` };
  };

  // --- Recurrence Helper ---
  const createNextRecurringTask = (completedTask: Task): Task | null => {
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

  // --- Task Operations ---
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      createdAt: todayLocalDate(),
    };
    setTasks((prev) => [newTask, ...prev]);
    if (currentUser) writeToFirestore(currentUser.uid, 'tasks', newTask.id, newTask);
    if (newTask.notifyAt) scheduleTaskNotifications([newTask]);
  };

  const toggleTaskStatus = (taskId: string) => {
    let nextTask: Task | null = null;
    setTasks((prev) =>
      prev.flatMap((task) => {
        if (task.id === taskId) {
          const isCompleting = task.status !== 'completed';
          if (isCompleting) triggerConfetti();
          const updated = {
            ...task,
            status: isCompleting ? 'completed' : 'todo',
            completedAt: isCompleting ? todayLocalDate() : undefined,
            completedCount: isCompleting ? (task.completedCount || 0) + 1 : task.completedCount,
          };
          if (currentUser) writeToFirestore(currentUser.uid, 'tasks', taskId, updated);
          if (isCompleting) {
            nextTask = createNextRecurringTask(updated);
          }
          return nextTask ? [updated, nextTask] : [updated];
        }
        return [task];
      })
    );
    if (nextTask && currentUser) {
      writeToFirestore(currentUser.uid, 'tasks', nextTask.id, nextTask);
      showToast('Tarea completada. Próxima ocurrencia creada.');
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (currentUser) deleteFromFirestore(currentUser.uid, 'tasks', taskId);
    showToast('Tarea eliminada.');
  };

  const updateTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    if (currentUser) writeToFirestore(currentUser.uid, 'tasks', updatedTask.id, updatedTask);
    showToast('Tarea actualizada.');
    if (updatedTask.notifyAt) scheduleTaskNotifications([updatedTask]);
  };

  const addProject = (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProj: Project = {
      ...projectData,
      id: `proj_${Date.now()}`,
      createdAt: todayLocalDate(),
      progress: projectData.progress ?? 0,
      category: projectData.category || 'personal',
      status: projectData.status || 'in_progress',
      milestones: projectData.milestones || [],
    };
    setProjects((prev) => [...prev, newProj]);
    if (currentUser) writeToFirestore(currentUser.uid, 'projects', newProj.id, newProj);
    showToast(`Proyecto "${newProj.name}" creado.`);
  };

  const updateProject = (updatedProj: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
    if (currentUser) writeToFirestore(currentUser.uid, 'projects', updatedProj.id, updatedProj);
    showToast(`Proyecto "${updatedProj.name}" actualizado.`);
  };

  const deleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (currentUser) deleteFromFirestore(currentUser.uid, 'projects', projectId);
    showToast('Proyecto eliminado.');
  };

  const toggleProjectMilestone = (projectId: string, milestoneId: string) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === projectId && proj.milestones) {
          const updatedMilestones = proj.milestones.map((m) =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          );
          const completedCount = updatedMilestones.filter((m) => m.completed).length;
          const totalCount = updatedMilestones.length;
          const calcProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : proj.progress || 0;

          if (calcProgress === 100 && proj.progress !== 100) triggerConfetti();

          const updated = {
            ...proj,
            milestones: updatedMilestones,
            progress: calcProgress,
            status: calcProgress === 100 ? 'completed' : proj.status,
          };
          if (currentUser) writeToFirestore(currentUser.uid, 'projects', projectId, updated);
          return updated;
        }
        return proj;
      })
    );
  };

  // --- Habit Operations ---
  const addHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'bestStreak'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: `habit_${Date.now()}`,
      streak: 0,
      bestStreak: 0,
      createdAt: todayLocalDate(),
    };
    setHabits((prev) => [newHabit, ...prev]);
    if (currentUser) writeToFirestore(currentUser.uid, 'habits', newHabit.id, newHabit);
    showToast(`Hábito "${newHabit.title}" creado.`);
  };

  const updateHabit = (updated: Habit) => {
    setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
    if (currentUser) writeToFirestore(currentUser.uid, 'habits', updated.id, updated);
    showToast(`Hábito "${updated.title}" actualizado.`);
  };

  const recalcStreak = (habitId: string, allLogs: HabitLog[]): { streak: number; bestStreak: number } => {
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

  const logHabit = (habitId: string, dateStr = todayLocalDate(), value = 1, notes = '') => {
    const existingLog = habitLogs.find((l) => l.habitId === habitId && l.date === dateStr);

    if (existingLog) {
      setHabitLogs((prev) => prev.filter((l) => l.id !== existingLog.id));
      if (currentUser) deleteFromFirestore(currentUser.uid, 'habitLogs', existingLog.id);
      const remainingLogs = habitLogs.filter(l => l.id !== existingLog.id);
      const { streak, bestStreak } = recalcStreak(habitId, remainingLogs);
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id === habitId) {
            const updated = { ...h, streak, bestStreak };
            if (currentUser) writeToFirestore(currentUser.uid, 'habits', habitId, updated);
            return updated;
          }
          return h;
        })
      );
      showToast('Registro de hábito removido.');
    } else {
      const newLog: HabitLog = {
        id: `hl_${habitId}_${dateStr}`,
        habitId, date: dateStr, value, completed: true, notes: notes || undefined,
      };
      setHabitLogs((prev) => [newLog, ...prev]);
      if (currentUser) writeToFirestore(currentUser.uid, 'habitLogs', newLog.id, newLog);
      triggerConfetti();
      const allLogs = [...habitLogs, newLog];
      const { streak, bestStreak } = recalcStreak(habitId, allLogs);
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id === habitId) {
            const updated = { ...h, streak, bestStreak };
            if (currentUser) writeToFirestore(currentUser.uid, 'habits', habitId, updated);
            return updated;
          }
          return h;
        })
      );
      showToast('¡Hábito registrado con éxito! 🎉');
    }
  };

  const updateHabitLog = (logId: string, updates: Partial<HabitLog>) => {
    setHabitLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, ...updates } : l)));
    if (currentUser) {
      const log = habitLogs.find(l => l.id === logId);
      if (log) writeToFirestore(currentUser.uid, 'habitLogs', logId, { ...log, ...updates });
    }
  };

  const deleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setHabitLogs((prev) => prev.filter((l) => l.habitId !== habitId));
    if (currentUser) {
      deleteFromFirestore(currentUser.uid, 'habits', habitId);
      habitLogs.filter(l => l.habitId === habitId).forEach(l => deleteFromFirestore(currentUser.uid, 'habitLogs', l.id));
    }
    showToast('Hábito eliminado.');
  };

  // --- Financial Operations ---
  const addTransaction = (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData, id: `tx_${Date.now()}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === newTx.accountId) {
          const delta = newTx.type === 'expense' || newTx.type === 'transfer' ? -newTx.amount : newTx.amount;
          return { ...acc, balance: acc.balance + delta };
        }
        if (newTx.transferToAccountId && acc.id === newTx.transferToAccountId) {
          return { ...acc, balance: acc.balance + newTx.amount };
        }
        return acc;
      })
    );
    if (currentUser) {
      writeToFirestore(currentUser.uid, 'transactions', newTx.id, newTx);
      const acc = accounts.find(a => a.id === newTx.accountId);
      if (acc) {
        const delta = newTx.type === 'expense' || newTx.type === 'transfer' ? -newTx.amount : newTx.amount;
        writeToFirestore(currentUser.uid, 'accounts', acc.id, { ...acc, balance: acc.balance + delta });
      }
      if (newTx.transferToAccountId) {
        const destAcc = accounts.find(a => a.id === newTx.transferToAccountId);
        if (destAcc) {
          writeToFirestore(currentUser.uid, 'accounts', destAcc.id, { ...destAcc, balance: destAcc.balance + newTx.amount });
        }
      }
    }
    if (newTx.type === 'expense') checkBudgetAlert(newTx, budgets, transactions);
    showToast('Transacción agregada.');
  };

  const updateTransaction = (updatedTx: Transaction) => {
    const oldTx = transactions.find((t) => t.id === updatedTx.id);
    if (oldTx && currentUser) {
      setAccounts((prev) =>
        prev.map((acc) => {
          let balance = acc.balance;
          if (acc.id === oldTx.accountId) balance += oldTx.type === 'expense' ? oldTx.amount : -oldTx.amount;
          if (acc.id === updatedTx.accountId) balance += updatedTx.type === 'expense' ? -updatedTx.amount : updatedTx.amount;
          return { ...acc, balance };
        })
      );
    }
    setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
    if (currentUser) writeToFirestore(currentUser.uid, 'transactions', updatedTx.id, updatedTx);
    showToast('Transacción actualizada.');
  };

  const deleteTransaction = (txId: string) => {
    const target = transactions.find((t) => t.id === txId);
    if (target) {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === target.accountId) {
            const reverseDelta = target.type === 'expense' || target.type === 'transfer' ? target.amount : -target.amount;
            return { ...acc, balance: acc.balance + reverseDelta };
          }
          if (target.transferToAccountId && acc.id === target.transferToAccountId) {
            return { ...acc, balance: acc.balance - target.amount };
          }
          return acc;
        })
      );
      if (currentUser) {
        deleteFromFirestore(currentUser.uid, 'transactions', txId);
        const acc = accounts.find(a => a.id === target.accountId);
        if (acc) {
          const reverseDelta = target.type === 'expense' || target.type === 'transfer' ? target.amount : -target.amount;
          writeToFirestore(currentUser.uid, 'accounts', acc.id, { ...acc, balance: acc.balance + reverseDelta });
        }
        if (target.transferToAccountId) {
          const destAcc = accounts.find(a => a.id === target.transferToAccountId);
          if (destAcc) {
            writeToFirestore(currentUser.uid, 'accounts', destAcc.id, { ...destAcc, balance: destAcc.balance - target.amount });
          }
        }
      }
    }
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
    showToast('Transacción eliminada.');
  };

  const addAccount = (accData: Omit<FinancialAccount, 'id'>) => {
    const newAcc: FinancialAccount = { ...accData, id: `acc_${Date.now()}` };
    setAccounts((prev) => [...prev, newAcc]);
    if (currentUser) writeToFirestore(currentUser.uid, 'accounts', newAcc.id, newAcc);
    showToast(`Cuenta "${newAcc.name}" agregada.`);
  };

  const updateAccount = (updatedAcc: FinancialAccount) => {
    setAccounts((prev) => prev.map((a) => (a.id === updatedAcc.id ? updatedAcc : a)));
    if (currentUser) writeToFirestore(currentUser.uid, 'accounts', updatedAcc.id, updatedAcc);
    showToast(`Cuenta "${updatedAcc.name}" actualizada.`);
  };

  const deleteAccount = (accId: string) => {
    const target = accounts.find((a) => a.id === accId);
    setAccounts((prev) => prev.filter((a) => a.id !== accId));
    if (currentUser) deleteFromFirestore(currentUser.uid, 'accounts', accId);
    showToast(`Cuenta "${target?.name || ''}" eliminada.`);
  };

  const addBudget = (budgetData: Omit<Budget, 'id'>) => {
    const newBudget: Budget = { ...budgetData, id: `bud_${Date.now()}` };
    setBudgets((prev) => [...prev, newBudget]);
    if (currentUser) writeToFirestore(currentUser.uid, 'budgets', newBudget.id, newBudget);
    showToast(`Presupuesto para "${newBudget.category}" configurado.`);
  };

  const updateBudget = (updatedBudget: Budget) => {
    setBudgets((prev) => prev.map((b) => (b.id === updatedBudget.id ? updatedBudget : b)));
    if (currentUser) writeToFirestore(currentUser.uid, 'budgets', updatedBudget.id, updatedBudget);
    showToast(`Presupuesto para "${updatedBudget.category}" actualizado.`);
  };

  const deleteBudget = (budgetId: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
    if (currentUser) deleteFromFirestore(currentUser.uid, 'budgets', budgetId);
    showToast('Presupuesto eliminado.');
  };

  // --- Debt Operations ---
  const addDebt = (debtData: Omit<Debt, 'id'>) => {
    const newDebt: Debt = { ...debtData, id: `debt_${Date.now()}` };
    setDebts((prev) => [...prev, newDebt]);
    if (currentUser) writeToFirestore(currentUser.uid, 'debts', newDebt.id, newDebt);
    showToast(`Deuda "${newDebt.name}" registrada.`);
  };

  const updateDebt = (updatedDebt: Debt) => {
    setDebts((prev) => prev.map((d) => (d.id === updatedDebt.id ? updatedDebt : d)));
    if (currentUser) writeToFirestore(currentUser.uid, 'debts', updatedDebt.id, updatedDebt);
    showToast(`Deuda "${updatedDebt.name}" actualizada.`);
  };

  const deleteDebt = (debtId: string) => {
    const target = debts.find((d) => d.id === debtId);
    setDebts((prev) => prev.filter((d) => d.id !== debtId));
    if (currentUser) deleteFromFirestore(currentUser.uid, 'debts', debtId);
    showToast(`Deuda "${target?.name || ''}" eliminada.`);
  };

  const payDebt = (debtId: string, amount: number, accountId: string) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;
    const newRemaining = Math.max(0, debt.remainingAmount - amount);
    const newPaid = (debt.paidInstallments ?? 0) + 1;
    const updatedDebt = { ...debt, remainingAmount: newRemaining, paidInstallments: newPaid };
    setDebts((prev) => prev.map((d) => (d.id === debtId ? updatedDebt : d)));
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      accountId,
      type: 'expense',
      amount,
      category: 'Deudas & Cuotas',
      description: `Pago cuota: ${debt.name} (${debt.creditor})`,
      date: todayLocalDate(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId) return { ...acc, balance: acc.balance - amount };
        return acc;
      })
    );
    if (currentUser) {
      writeToFirestore(currentUser.uid, 'debts', debtId, updatedDebt);
      writeToFirestore(currentUser.uid, 'transactions', newTx.id, newTx);
      const acc = accounts.find(a => a.id === accountId);
      if (acc) writeToFirestore(currentUser.uid, 'accounts', accountId, { ...acc, balance: acc.balance - amount });
    }
    showToast(`Pago registrado: $${amount.toLocaleString('es-CL')} a ${debt.name}. Saldo restante: $${newRemaining.toLocaleString('es-CL')}`);
  };

  const addFinancialGoal = (goalData: Omit<FinancialGoal, 'id' | 'createdAt'>) => {
    const goal: FinancialGoal = { ...goalData, id: `goal_${Date.now()}`, createdAt: todayLocalDate() };
    setFinancialGoals(prev => [goal, ...prev]);
    if (currentUser) writeToFirestore(currentUser.uid, 'financialGoals', goal.id, goal);
    showToast(`Meta financiera "${goal.name}" creada.`);
  };

  const updateFinancialGoal = (goal: FinancialGoal) => {
    setFinancialGoals(prev => prev.map(item => item.id === goal.id ? goal : item));
    if (currentUser) writeToFirestore(currentUser.uid, 'financialGoals', goal.id, goal);
  };

  const deleteFinancialGoal = (goalId: string) => {
    setFinancialGoals(prev => prev.filter(goal => goal.id !== goalId));
    if (currentUser) deleteFromFirestore(currentUser.uid, 'financialGoals', goalId);
  };

  const addRecurringTransaction = (itemData: Omit<RecurringTransaction, 'id'>) => {
    const item: RecurringTransaction = { ...itemData, id: `recurring_${Date.now()}` };
    setRecurringTransactions(prev => [item, ...prev]);
    if (currentUser) writeToFirestore(currentUser.uid, 'recurringTransactions', item.id, item);
    showToast('Movimiento recurrente creado.');
  };

  const updateRecurringTransaction = (item: RecurringTransaction) => {
    setRecurringTransactions(prev => prev.map(current => current.id === item.id ? item : current));
    if (currentUser) writeToFirestore(currentUser.uid, 'recurringTransactions', item.id, item);
  };

  const deleteRecurringTransaction = (id: string) => {
    setRecurringTransactions(prev => prev.filter(item => item.id !== id));
    if (currentUser) deleteFromFirestore(currentUser.uid, 'recurringTransactions', id);
  };

  // --- Books Operations ---
  const addBook = (bookData: Omit<Book, 'id' | 'createdAt'>) => {
    const newBook: Book = {
      ...bookData,
      id: `book_${Date.now()}`,
      createdAt: todayLocalDate(),
    };
    setBooks((prev) => [newBook, ...prev]);
    if (currentUser) writeToFirestore(currentUser.uid, 'books', newBook.id, newBook);
    showToast(`Libro "${newBook.title}" agregado a tu biblioteca.`);
  };

  const updateBookProgress = (bookId: string, newPage: number, notes?: string) => {
    const todayStr = todayLocalDate();
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === bookId) {
          const startP = b.currentPage;
          const endP = Math.min(newPage, b.totalPages);
          const pagesDiff = Math.max(0, endP - startP);

          if (pagesDiff > 0) {
            const newLog: ReadingLog = {
              id: `rl_${Date.now()}`,
              bookId, date: todayStr, pagesRead: pagesDiff, startPage: startP, endPage: endP, notes,
            };
            setReadingLogs((logs) => [newLog, ...logs]);
            if (currentUser) writeToFirestore(currentUser.uid, 'readingLogs', newLog.id, newLog);
          }

          if (endP >= b.totalPages) triggerConfetti();

          const updated = {
            ...b,
            currentPage: endP,
            status: endP >= b.totalPages ? 'completed' : 'reading',
            finishDate: endP >= b.totalPages ? todayStr : b.finishDate,
          };
          if (currentUser) writeToFirestore(currentUser.uid, 'books', bookId, updated);
          return updated;
        }
        return b;
      })
    );
  };

  const updateBookStatus = (bookId: string, status: Book['status']) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === bookId) {
          const updated = { ...b, status };
          if (currentUser) writeToFirestore(currentUser.uid, 'books', bookId, updated);
          return updated;
        }
        return b;
      })
    );
    showToast('Estado del libro actualizado.');
  };

  const addBookNote = (noteData: Omit<BookNote, 'id' | 'createdAt'>) => {
    const newNote: BookNote = {
      ...noteData,
      id: `note_${Date.now()}`,
      createdAt: todayLocalDate(),
    };
    setBookNotes((prev) => [newNote, ...prev]);
    if (currentUser) writeToFirestore(currentUser.uid, 'bookNotes', newNote.id, newNote);
    showToast('Nota de lectura guardada.');
  };

  // Reading session and group actions
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

  // Health Actions
  const updateHealthProfile = (partialProfile: Partial<HealthProfile>) => {
    setHealthProfile((prev) => {
      const updated = { ...prev, ...partialProfile };
      if (currentUser) {
        setDoc(doc(db, 'users', currentUser.uid, 'config', 'healthProfile'), removeUndefinedFields(updated), { merge: true })
          .catch(e => console.error('Error saving health profile:', e));
      }
      return updated;
    });
    showToast('Perfil médico y de salud actualizado.');
  };

  const addHealthLog = (logData: Omit<HealthLog, 'id'>) => {
    const newLog: HealthLog = { ...logData, id: `hlog_${Date.now()}` };
    setHealthLogs((prev) => [newLog, ...prev]);
    if (currentUser) writeToFirestore(currentUser.uid, 'healthLogs', newLog.id, newLog);
    showToast('Registro de constantes vitales guardado.');
  };

  const deleteHealthLog = (id: string) => {
    setHealthLogs((prev) => prev.filter((l) => l.id !== id));
    if (currentUser) deleteFromFirestore(currentUser.uid, 'healthLogs', id);
    showToast('Registro de salud eliminado.');
  };

  const addWorkoutLog = (logData: Omit<WorkoutLog, 'id'>) => {
    const newLog: WorkoutLog = { ...logData, id: `wlog_${Date.now()}` };
    setWorkoutLogs((prev) => [newLog, ...prev]);
    if (currentUser) writeToFirestore(currentUser.uid, 'workoutLogs', newLog.id, newLog);
    showToast('Entrenamiento registrado.');
  };

  const deleteWorkoutLog = (id: string) => {
    setWorkoutLogs((prev) => prev.filter((l) => l.id !== id));
    if (currentUser) deleteFromFirestore(currentUser.uid, 'workoutLogs', id);
    showToast('Entrenamiento eliminado.');
  };

  // Data Export / Reset
  const exportDataJSON = () => {
    const fullData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      tasks, habits, habitLogs, accounts, budgets, debts, transactions, financialGoals, recurringTransactions,
      books, readingLogs, bookNotes, readingGroups, readingSessions, projects,
      shiftConfig, healthProfile, healthLogs, workoutLogs, appSettings,
    };
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LifeOS_Backup_${todayLocalDate()}.json`;
    a.click();
    showToast('Copia de respaldo exportada exitosamente.');
  };

  const importDataJSON = (data: Record<string, unknown>, mode: 'merge' | 'replace') => {
    const mergeById = <T extends { id: string }>(current: T[], incoming: unknown) => {
      if (!Array.isArray(incoming)) return current;
      if (mode === 'replace') return incoming as T[];
      const byId = new Map(current.map(item => [item.id, item]));
      (incoming as T[]).forEach(item => byId.set(item.id, item));
      return Array.from(byId.values());
    };

    setTasks(current => mergeById(current, data.tasks));
    setHabits(current => mergeById(current, data.habits));
    setHabitLogs(current => mergeById(current, data.habitLogs));
    setAccounts(current => mergeById(current, data.accounts));
    setBudgets(current => mergeById(current, data.budgets));
    setDebts(current => mergeById(current, data.debts));
    setTransactions(current => mergeById(current, data.transactions));
    setFinancialGoals(current => mergeById(current, data.financialGoals));
    setRecurringTransactions(current => mergeById(current, data.recurringTransactions));
    setBooks(current => mergeById(current, data.books));
    setReadingLogs(current => mergeById(current, data.readingLogs));
    setBookNotes(current => mergeById(current, data.bookNotes));
    setReadingGroups(current => mergeById(current, data.readingGroups));
    setReadingSessions(current => mergeById(current, data.readingSessions));
    setProjects(current => mergeById(current, data.projects));
    setHealthLogs(current => mergeById(current, data.healthLogs));
    setWorkoutLogs(current => mergeById(current, data.workoutLogs));
    if (data.shiftConfig && typeof data.shiftConfig === 'object') setShiftConfig(data.shiftConfig as ShiftConfig);
    if (data.healthProfile && typeof data.healthProfile === 'object') setHealthProfile(data.healthProfile as HealthProfile);
    if (data.appSettings && typeof data.appSettings === 'object') setAppSettings(current => ({ ...current, ...(data.appSettings as AppCustomSettings) }));
    showToast(mode === 'merge' ? 'Respaldo fusionado en este dispositivo.' : 'Respaldo restaurado en este dispositivo.');
  };

  const resetToDefaults = (skipConfirm: boolean = false) => {
    if (skipConfirm || window.confirm('¿Deseas reiniciar todos los parámetros de LifeOS para empezar a usar la app desde hoy?')) {
      setTasks(initialTasks);
      setHabits(initialHabits);
      setHabitLogs(initialHabitLogs);
      setAccounts(initialAccounts);
      setBudgets(initialBudgets);
      setDebts(initialDebts);
      setTransactions(initialTransactions);
      setFinancialGoals([]);
      setRecurringTransactions([]);
      setBooks(initialBooks);
      setReadingLogs(initialReadingLogs);
      setBookNotes(initialBookNotes);
      setReadingGroups([]);
      setReadingSessions([]);
      setProjects(initialProjects);
      setHealthProfile(initialHealthProfile);
      setHealthLogs(initialHealthLogs);
      setWorkoutLogs([]);
      setShiftConfig(DEFAULT_SHIFT_CONFIG);
      setAppSettings(initialAppSettings);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('lifeos_custom_settings');
      localStorage.removeItem('lifeos_dark_mode');
      showToast('Datos de este dispositivo restablecidos. Tus datos cloud no fueron eliminados.');
    }
  };

  const updateAppSettings = (partial: Partial<AppCustomSettings>) => {
    setAppSettings(prev => ({ ...prev, ...partial }));
    if (currentUser) {
      setDoc(doc(db, 'users', currentUser.uid, 'config', 'appSettings'), removeUndefinedFields(partial), { merge: true })
        .then(() => {
          setSyncState(prev => ({ ...prev, settings: 'synced' }));
          setLastSyncedAt(new Date().toISOString());
        })
        .catch(() => setSyncState(prev => ({ ...prev, settings: 'error' })));
    }
  };

  return (
    <LifeOSContext.Provider
      value={{
        activeTab, setActiveTab, darkMode, toggleDarkMode,
        currentUser, isSyncing, syncState, lastSyncedAt, isSigningIn, signInWithGoogle, logout, syncToCloud,
        shiftConfig, shiftInfo, isShiftCalibrationOpen, openShiftCalibration, closeShiftCalibration,
        calibrateShift, updateShiftConfig,
        areas, projects, tasks, habits, habitLogs, accounts, budgets, debts, transactions, financialGoals, recurringTransactions,
        books, readingLogs, bookNotes, readingGroups, readingSessions, healthProfile, healthLogs, workoutLogs,
        updateHealthProfile, addHealthLog, deleteHealthLog,
        isQuickCaptureOpen, openQuickCapture, closeQuickCapture,
        isAICopilotOpen, openAICopilot, closeAICopilot,
        isVoiceModalOpen, openVoiceModal, closeVoiceModal,
        parseQuickCapture, executeQuickCapture,
        addTask, toggleTaskStatus, deleteTask, updateTask,
        addProject, updateProject, deleteProject, toggleProjectMilestone,
        addHabit, updateHabit, logHabit, updateHabitLog, deleteHabit,
        addTransaction, updateTransaction, deleteTransaction,
        addAccount, updateAccount, deleteAccount,
        addBudget, updateBudget, deleteBudget,
        addDebt, updateDebt, deleteDebt, payDebt,
        addFinancialGoal, updateFinancialGoal, deleteFinancialGoal,
        addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction,
        addBook, updateBookProgress, updateBookStatus, addBookNote,
        startReadingSession, endReadingSession, updateReadingSession,
        createReadingGroup, updateReadingGroup, deleteReadingGroup, updateReadingGroupProgress,
        addReadingGroupMember, removeReadingGroupMember,
        addWorkoutLog, deleteWorkoutLog,
        exportDataJSON, importDataJSON, resetToDefaults,
        toastMessage, showToast,
        isCalendarModalOpen, openCalendarModal, closeCalendarModal,
        isNotificationsModalOpen, openNotificationsModal, closeNotificationsModal,
        isFitModalOpen, openFitModal, closeFitModal,
        appSettings, updateAppSettings,
      }}
    >
      {children}
    </LifeOSContext.Provider>
  );
};

export const useLifeOS = () => {
  const context = useContext(LifeOSContext);
  if (!context) {
    throw new Error('useLifeOS must be used within a LifeOSProvider');
  }
  return context;
};
