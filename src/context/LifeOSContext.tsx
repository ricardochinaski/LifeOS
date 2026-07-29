import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import {
  AreaCategory, Project, Task, Habit, HabitLog,
  FinancialAccount, Transaction, Budget, Debt, Book, ReadingLog, BookNote,
  TabType, QuickCaptureParsed, Priority, TaskStatus, ShiftConfig, ShiftInfo, ShiftType,
  HealthProfile, HealthLog
} from '../types';
import {
  initialAreas, initialProjects, initialTasks, initialHabits,
  initialHabitLogs, initialAccounts, initialBudgets,
  initialTransactions, initialDebts, initialBooks, initialReadingLogs, initialBookNotes,
  initialHealthProfile, initialHealthLogs
} from '../data/seedData';
import { DEFAULT_SHIFT_CONFIG, calculateShiftInfo, getAnchorDateForDay } from '../utils/shiftUtils';
import { updateWidgetData } from '../lib/widgetBridge';
import {
  auth, db, signInWithPopup, signInWithCredential, GoogleAuthProvider, signOut, onAuthStateChanged,
  doc, setDoc, getDoc, User
} from '../lib/firebase';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { isNative } from '../lib/native';

interface LifeOSContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Google Auth & Cloud Sync
  currentUser: User | null;
  isSyncing: boolean;
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
  books: Book[];
  readingLogs: ReadingLog[];
  bookNotes: BookNote[];
  healthProfile: HealthProfile;
  healthLogs: HealthLog[];

  // Health Actions
  updateHealthProfile: (partial: Partial<HealthProfile>) => void;
  addHealthLog: (log: Omit<HealthLog, 'id'>) => void;
  deleteHealthLog: (id: string) => void;

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
  logHabit: (habitId: string, dateStr?: string, value?: number) => void;
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

  // Book Actions
  addBook: (book: Omit<Book, 'id' | 'createdAt'>) => void;
  updateBookProgress: (bookId: string, newPage: number, notes?: string) => void;
  updateBookStatus: (bookId: string, status: Book['status']) => void;
  addBookNote: (note: Omit<BookNote, 'id' | 'createdAt'>) => void;

  // Export / Reset
  exportDataJSON: () => void;
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
}

const STORAGE_KEY = 'lifeos_local_v1';

const LifeOSContext = createContext<LifeOSContextType | undefined>(undefined);

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
  const skipAutoSync = useRef(false);

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

  // Shift 14x14 configuration (defaulting to Day 4 of Rest)
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
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [readingLogs, setReadingLogs] = useState<ReadingLog[]>(initialReadingLogs);
  const [bookNotes, setBookNotes] = useState<BookNote[]>(initialBookNotes);
  const [healthProfile, setHealthProfile] = useState<HealthProfile>(initialHealthProfile);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>(initialHealthLogs);

  // Auth & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // Load state on mount and listen to Firebase Auth
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.tasks) setTasks(parsed.tasks);
        if (parsed.habits) setHabits(parsed.habits);
        if (parsed.habitLogs) setHabitLogs(parsed.habitLogs);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.budgets) setBudgets(parsed.budgets);
        if (parsed.debts) setDebts(parsed.debts);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.books) setBooks(parsed.books);
        if (parsed.readingLogs) setReadingLogs(parsed.readingLogs);
        if (parsed.bookNotes) setBookNotes(parsed.bookNotes);
        if (parsed.projects) setProjects(parsed.projects);
        if (parsed.shiftConfig) setShiftConfig(parsed.shiftConfig);
        if (parsed.healthProfile) setHealthProfile(parsed.healthProfile);
        if (parsed.healthLogs) setHealthLogs(parsed.healthLogs);
      }
    } catch (e) {
      console.error('Error reading localStorage for LifeOS:', e);
    }
  }, []);

  // Firebase Auth listener and Cloud Firestore initial load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        skipAutoSync.current = true;
        setIsSyncing(true);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists() && docSnap.data().lifeOSData) {
            const remoteData = docSnap.data().lifeOSData;
            if (remoteData.tasks) setTasks(remoteData.tasks);
            if (remoteData.habits) setHabits(remoteData.habits);
            if (remoteData.habitLogs) setHabitLogs(remoteData.habitLogs);
            if (remoteData.accounts) setAccounts(remoteData.accounts);
            if (remoteData.budgets) setBudgets(remoteData.budgets);
            if (remoteData.debts) setDebts(remoteData.debts);
            if (remoteData.transactions) setTransactions(remoteData.transactions);
            if (remoteData.books) setBooks(remoteData.books);
            if (remoteData.readingLogs) setReadingLogs(remoteData.readingLogs);
            if (remoteData.bookNotes) setBookNotes(remoteData.bookNotes);
            if (remoteData.projects) setProjects(remoteData.projects);
            if (remoteData.shiftConfig) setShiftConfig(remoteData.shiftConfig);
            if (remoteData.healthProfile) setHealthProfile(remoteData.healthProfile);
            if (remoteData.healthLogs) setHealthLogs(remoteData.healthLogs);
            showToast(`Bienvenido ${user.displayName || user.email}. Datos sincronizados desde la nube.`);
          } else {
            const lifeOSData = {
              tasks, habits, habitLogs, accounts, budgets, debts, transactions,
              books, readingLogs, bookNotes, projects, shiftConfig, healthProfile, healthLogs
            };
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              updatedAt: new Date().toISOString(),
              lifeOSData
            });
            showToast('Cuenta de Google vinculada. Sincronizacion inicial completada.');
          }
        } catch (error) {
          console.error('Error loading Firestore document:', error);
        } finally {
          setIsSyncing(false);
          setTimeout(() => { skipAutoSync.current = false; }, 2000);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync to LocalStorage & Auto-sync to Cloud Firestore if logged in
  useEffect(() => {
    try {
      const dataToSave = {
        tasks, habits, habitLogs, accounts, budgets, debts, transactions, books, readingLogs, bookNotes, projects, shiftConfig, healthProfile, healthLogs
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

      if (currentUser && !skipAutoSync.current) {
        const syncDebounce = setTimeout(async () => {
          try {
            setIsSyncing(true);
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              updatedAt: new Date().toISOString(),
              lifeOSData: dataToSave
            }, { merge: true });
          } catch (e) {
            console.error('Error auto-syncing to Firestore:', e);
          } finally {
            setIsSyncing(false);
          }
        }, 1500);
        return () => clearTimeout(syncDebounce);
      }
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }, [tasks, habits, habitLogs, accounts, budgets, debts, transactions, books, readingLogs, bookNotes, projects, shiftConfig, healthProfile, healthLogs, currentUser]);

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
      const userDocRef = doc(db, 'users', currentUser.uid);
      const lifeOSData = {
        tasks, habits, habitLogs, accounts, budgets, debts, transactions,
        books, readingLogs, bookNotes, projects, shiftConfig, healthProfile, healthLogs
      };
      await setDoc(userDocRef, {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        updatedAt: new Date().toISOString(),
        lifeOSData
      }, { merge: true });
      showToast('Sincronizado con Google Cloud Firestore ✓');
    } catch (error) {
      console.error('Error manual syncing to cloud:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Derived shift info for today
  const shiftInfo = calculateShiftInfo(shiftConfig);

  const openShiftCalibration = () => setIsShiftCalibrationOpen(true);
  const closeShiftCalibration = () => setIsShiftCalibrationOpen(false);

  const calibrateShift = (dayInPhase: number, phase: ShiftType, restDays = 14, workDays = 14) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newAnchorDate = getAnchorDateForDay(dayInPhase, phase, todayStr);

    setShiftConfig((prev) => ({
      ...prev,
      restDays,
      workDays,
      currentPhase: phase,
      currentDayInPhase: dayInPhase,
      anchorDate: newAnchorDate,
    }));

    showToast(`Turno calibrado: Día ${dayInPhase} de ${dayInPhase > restDays ? workDays : restDays} (${phase === 'rest' ? 'Descanso' : 'Faena Minera'})`);
  };

  const updateShiftConfig = (configPartial: Partial<ShiftConfig>) => {
    setShiftConfig((prev) => ({ ...prev, ...configPartial }));
    showToast('Configuración del sistema de turnos actualizada.');
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

  // Update Android widget with shift status
  useEffect(() => {
    const status = shiftInfo.phase === 'rest' ? 'Descanso 🏠' : 'Faena ⛏️';
    const day = `Día ${shiftInfo.dayInPhase} de ${shiftInfo.phase === 'rest' ? shiftInfo.restDays : shiftInfo.workDays}`;
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
      
      const pct = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      
      if (pct >= 100) {
        showToast(`ALERTA: Presupuesto "${budget.category}" excedido! $${spent.toLocaleString()} / $${budget.limit.toLocaleString()}`);
      } else if (pct >= 80) {
        showToast(`Aviso: Presupuesto "${budget.category}" al ${Math.round(pct)}%. $${spent.toLocaleString()} usado de $${budget.limit.toLocaleString()}`);
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
    } catch (e) {
      // fallback if canvas canvas-confetti issue
    }
  };

  // Quick Capture Parser Logic (Natural Language)
  const parseQuickCapture = (text: string): QuickCaptureParsed => {
    const trimmed = text.trim();
    let priority: Priority = 'p4';
    let type: 'task' | 'habit' | 'transaction' | 'reading' = 'task';
    let dueDate = new Date().toISOString().split('T')[0];
    let areaId: string | undefined = undefined;
    let amount: number | undefined = undefined;
    let pages: number | undefined = undefined;

    // Detect Priority p1-p4
    if (/\bp1\b/i.test(trimmed)) priority = 'p1';
    else if (/\bp2\b/i.test(trimmed)) priority = 'p2';
    else if (/\bp3\b/i.test(trimmed)) priority = 'p3';

    // Detect Area hashtags e.g. #Salud, #Trabajo, #Finanzas, #Desarrollo, #Hogar
    if (/#salud|#health/i.test(trimmed)) areaId = 'area_health';
    else if (/#trabajo|#work/i.test(trimmed)) areaId = 'area_work';
    else if (/#finanzas|#finance/i.test(trimmed)) areaId = 'area_finance';
    else if (/#desarrollo|#aprender|#learning/i.test(trimmed)) areaId = 'area_learning';
    else if (/#hogar|#home/i.test(trimmed)) areaId = 'area_home';

    // Detect Dollar or Expense e.g. "$25" or "25$" or "gasto $25"
    const amountMatch = trimmed.match(/(\$|USD\s*)?(\d+(\.\d{1,2})?)(\$)?/i);
    if (trimmed.includes('$') || /\b(gasto|compra|pago)\b/i.test(trimmed)) {
      if (amountMatch && amountMatch[2]) {
        type = 'transaction';
        amount = parseFloat(amountMatch[2]);
      }
    }

    // Detect Reading e.g. "leer 20 paginas" or "página 150"
    const pagesMatch = trimmed.match(/\b(leer|pág|pag|páginas)\s*(\d+)/i);
    if (pagesMatch) {
      type = 'reading';
      pages = parseInt(pagesMatch[2], 10);
    }

    // Detect Habit e.g. "habito" or "diario"
    if (/\b(hábito|habito|diario|todos los días)\b/i.test(trimmed)) {
      type = 'habit';
    }

    // Clean title by stripping tags
    const cleanTitle = trimmed
      .replace(/#\w+/g, '')
      .replace(/\bp[1-4]\b/gi, '')
      .trim();

    return {
      title: cleanTitle || text,
      type,
      priority,
      areaId,
      dueDate,
      amount,
      pages,
    };
  };

  const executeQuickCapture = (text: string) => {
    const parsed = parseQuickCapture(text);
    if (!parsed.title) return { success: false, message: 'Ingresa una descripción válida.' };

    const todayStr = new Date().toISOString().split('T')[0];

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
      const newHabit: Habit = {
        id: `habit_${Date.now()}`,
        title: parsed.title,
        areaId: parsed.areaId || 'area_health',
        color: '#10B981',
        icon: 'Sparkles',
        frequency: 'daily',
        targetValue: 1,
        unit: 'veces',
        streak: 0,
        bestStreak: 0,
        createdAt: todayStr,
      };
      setHabits((prev) => [newHabit, ...prev]);
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

  // --- Task Operations ---
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const isCompleting = task.status !== 'completed';
          if (isCompleting) triggerConfetti();
          return {
            ...task,
            status: isCompleting ? 'completed' : 'todo',
            completedAt: isCompleting ? new Date().toISOString().split('T')[0] : undefined,
          };
        }
        return task;
      })
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast('Tarea eliminada.');
  };

  const updateTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    showToast('Tarea actualizada.');
  };

  const addProject = (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProj: Project = {
      ...projectData,
      id: `proj_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      progress: projectData.progress ?? 0,
      category: projectData.category || 'personal',
      status: projectData.status || 'in_progress',
      milestones: projectData.milestones || [],
    };
    setProjects((prev) => [...prev, newProj]);
    showToast(`Proyecto "${newProj.name}" creado.`);
  };

  const updateProject = (updatedProj: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
    showToast(`Proyecto "${updatedProj.name}" actualizado.`);
  };

  const deleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
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

          if (calcProgress === 100 && proj.progress !== 100) {
            triggerConfetti();
          }

          return {
            ...proj,
            milestones: updatedMilestones,
            progress: calcProgress,
            status: calcProgress === 100 ? 'completed' : proj.status,
          };
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
      createdAt: new Date().toISOString().split('T')[0],
    };
    setHabits((prev) => [newHabit, ...prev]);
    showToast(`Hábito "${newHabit.title}" creado.`);
  };

  const logHabit = (habitId: string, dateStr = new Date().toISOString().split('T')[0], value = 1) => {
    const existingLog = habitLogs.find((l) => l.habitId === habitId && l.date === dateStr);
    
    if (existingLog) {
      // Toggle off or delete log
      setHabitLogs((prev) => prev.filter((l) => l.id !== existingLog.id));
      // recalculate streak
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id === habitId) {
            const newStreak = Math.max(0, h.streak - 1);
            return { ...h, streak: newStreak };
          }
          return h;
        })
      );
      showToast('Registro de hábito removido.');
    } else {
      // Create new log
      const newLog: HabitLog = {
        id: `hl_${habitId}_${dateStr}`,
        habitId,
        date: dateStr,
        value,
        completed: true,
      };
      setHabitLogs((prev) => [newLog, ...prev]);
      
      triggerConfetti();
      
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id === habitId) {
            const newStreak = h.streak + 1;
            const newBest = Math.max(h.bestStreak, newStreak);
            return { ...h, streak: newStreak, bestStreak: newBest };
          }
          return h;
        })
      );
      showToast('¡Hábito registrado con éxito! 🎉');
    }
  };

  const deleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setHabitLogs((prev) => prev.filter((l) => l.habitId !== habitId));
    showToast('Hábito eliminado.');
  };

  // --- Financial Operations ---
  const addTransaction = (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Update account balance
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === newTx.accountId) {
          const delta = newTx.type === 'expense' ? -newTx.amount : newTx.amount;
          return { ...acc, balance: acc.balance + delta };
        }
        return acc;
      })
    );

    // Check budgets after transaction
    if (newTx.type === 'expense') {
      checkBudgetAlert(newTx, budgets, transactions);
    }

    showToast('Transacción agregada.');
  };

  const updateTransaction = (updatedTx: Transaction) => {
    const oldTx = transactions.find((t) => t.id === updatedTx.id);
    if (oldTx) {
      // Revert old effect and apply new effect on balances
      setAccounts((prev) =>
        prev.map((acc) => {
          let balance = acc.balance;
          if (acc.id === oldTx.accountId) {
            balance += oldTx.type === 'expense' ? oldTx.amount : -oldTx.amount;
          }
          if (acc.id === updatedTx.accountId) {
            balance += updatedTx.type === 'expense' ? -updatedTx.amount : updatedTx.amount;
          }
          return { ...acc, balance };
        })
      );
    }
    setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
    showToast('Transacción actualizada.');
  };

  const deleteTransaction = (txId: string) => {
    const target = transactions.find((t) => t.id === txId);
    if (target) {
      // Reverse account balance effect
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === target.accountId) {
            const reverseDelta = target.type === 'expense' ? target.amount : -target.amount;
            return { ...acc, balance: acc.balance + reverseDelta };
          }
          return acc;
        })
      );
    }
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
    showToast('Transacción eliminada.');
  };

  const addAccount = (accData: Omit<FinancialAccount, 'id'>) => {
    const newAcc: FinancialAccount = { ...accData, id: `acc_${Date.now()}` };
    setAccounts((prev) => [...prev, newAcc]);
    showToast(`Cuenta "${newAcc.name}" agregada.`);
  };

  const updateAccount = (updatedAcc: FinancialAccount) => {
    setAccounts((prev) => prev.map((a) => (a.id === updatedAcc.id ? updatedAcc : a)));
    showToast(`Cuenta "${updatedAcc.name}" actualizada.`);
  };

  const deleteAccount = (accId: string) => {
    const target = accounts.find((a) => a.id === accId);
    setAccounts((prev) => prev.filter((a) => a.id !== accId));
    showToast(`Cuenta "${target?.name || ''}" eliminada.`);
  };

  const addBudget = (budgetData: Omit<Budget, 'id'>) => {
    const newBudget: Budget = { ...budgetData, id: `bud_${Date.now()}` };
    setBudgets((prev) => [...prev, newBudget]);
    showToast(`Presupuesto para "${newBudget.category}" configurado.`);
  };

  const updateBudget = (updatedBudget: Budget) => {
    setBudgets((prev) => prev.map((b) => (b.id === updatedBudget.id ? updatedBudget : b)));
    showToast(`Presupuesto para "${updatedBudget.category}" actualizado.`);
  };

  const deleteBudget = (budgetId: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
    showToast('Presupuesto eliminado.');
  };

  // --- Debt Operations ---
  const addDebt = (debtData: Omit<Debt, 'id'>) => {
    const newDebt: Debt = { ...debtData, id: `debt_${Date.now()}` };
    setDebts((prev) => [...prev, newDebt]);
    showToast(`Deuda "${newDebt.name}" registrada.`);
  };

  const updateDebt = (updatedDebt: Debt) => {
    setDebts((prev) => prev.map((d) => (d.id === updatedDebt.id ? updatedDebt : d)));
    showToast(`Deuda "${updatedDebt.name}" actualizada.`);
  };

  const deleteDebt = (debtId: string) => {
    const target = debts.find((d) => d.id === debtId);
    setDebts((prev) => prev.filter((d) => d.id !== debtId));
    showToast(`Deuda "${target?.name || ''}" eliminada.`);
  };

  // --- Books Operations ---
  const addBook = (bookData: Omit<Book, 'id' | 'createdAt'>) => {
    const newBook: Book = {
      ...bookData,
      id: `book_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBooks((prev) => [newBook, ...prev]);
    showToast(`Libro "${newBook.title}" agregado a tu biblioteca.`);
  };

  const updateBookProgress = (bookId: string, newPage: number, notes?: string) => {
    const todayStr = new Date().toISOString().split('T')[0];

    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === bookId) {
          const startP = b.currentPage;
          const endP = Math.min(newPage, b.totalPages);
          const pagesDiff = Math.max(0, endP - startP);
          const isCompleted = endP >= b.totalPages;

          if (pagesDiff > 0) {
            // Log reading session
            const newLog: ReadingLog = {
              id: `rl_${Date.now()}`,
              bookId,
              date: todayStr,
              pagesRead: pagesDiff,
              startPage: startP,
              endPage: endP,
              notes,
            };
            setReadingLogs((logs) => [newLog, ...logs]);
          }

          if (isCompleted) triggerConfetti();

          return {
            ...b,
            currentPage: endP,
            status: isCompleted ? 'completed' : 'reading',
            finishDate: isCompleted ? todayStr : b.finishDate,
          };
        }
        return b;
      })
    );
  };

  const updateBookStatus = (bookId: string, status: Book['status']) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, status } : b))
    );
    showToast('Estado del libro actualizado.');
  };

  const addBookNote = (noteData: Omit<BookNote, 'id' | 'createdAt'>) => {
    const newNote: BookNote = {
      ...noteData,
      id: `note_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBookNotes((prev) => [newNote, ...prev]);
    showToast('Nota de lectura guardada.');
  };

  // Health Actions
  const updateHealthProfile = (partialProfile: Partial<HealthProfile>) => {
    setHealthProfile((prev) => ({ ...prev, ...partialProfile }));
    showToast('Perfil médico y de salud actualizado.');
  };

  const addHealthLog = (logData: Omit<HealthLog, 'id'>) => {
    const newLog: HealthLog = {
      ...logData,
      id: `hlog_${Date.now()}`,
    };
    setHealthLogs((prev) => [newLog, ...prev]);
    showToast('Registro de constantes vitales guardado.');
  };

  const deleteHealthLog = (id: string) => {
    setHealthLogs((prev) => prev.filter((l) => l.id !== id));
    showToast('Registro de salud eliminado.');
  };

  // Data Export / Reset
  const exportDataJSON = () => {
    const fullData = {
      tasks, habits, habitLogs, accounts, budgets, debts, transactions, books, readingLogs, bookNotes, projects, healthProfile, healthLogs
    };
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LifeOS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Copia de respaldo exportada exitosamente.');
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
      setBooks(initialBooks);
      setReadingLogs(initialReadingLogs);
      setBookNotes(initialBookNotes);
      setProjects(initialProjects);
      setHealthProfile(initialHealthProfile);
      setHealthLogs(initialHealthLogs);
      setShiftConfig(DEFAULT_SHIFT_CONFIG);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.clear();
      showToast('LifeOS reiniciado con parámetros limpios para comenzar hoy.');
    }
  };

  return (
    <LifeOSContext.Provider
      value={{
        activeTab,
        setActiveTab,
        darkMode,
        toggleDarkMode,
        currentUser,
        isSyncing,
        isSigningIn,
        signInWithGoogle,
        logout,
        syncToCloud,
        shiftConfig,
        shiftInfo,
        isShiftCalibrationOpen,
        openShiftCalibration,
        closeShiftCalibration,
        calibrateShift,
        updateShiftConfig,
        areas,
        projects,
        tasks,
        habits,
        habitLogs,
        accounts,
        budgets,
        debts,
        transactions,
        books,
        readingLogs,
        bookNotes,
        healthProfile,
        healthLogs,
        updateHealthProfile,
        addHealthLog,
        deleteHealthLog,
        isQuickCaptureOpen,
        openQuickCapture,
        closeQuickCapture,
        isAICopilotOpen,
        openAICopilot,
        closeAICopilot,
        isVoiceModalOpen,
        openVoiceModal,
        closeVoiceModal,
        parseQuickCapture,
        executeQuickCapture,
        addTask,
        toggleTaskStatus,
        deleteTask,
        updateTask,
        addProject,
        addHabit,
        logHabit,
        deleteHabit,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addAccount,
        updateAccount,
        deleteAccount,
        addBudget,
        updateBudget,
        deleteBudget,
        addDebt,
        updateDebt,
        deleteDebt,
        addBook,
        updateBookProgress,
        updateBookStatus,
        addBookNote,
        exportDataJSON,
        resetToDefaults,
        toastMessage,
        showToast,
        isCalendarModalOpen,
        openCalendarModal,
        closeCalendarModal,
        isNotificationsModalOpen,
        openNotificationsModal,
        closeNotificationsModal,
        isFitModalOpen,
        openFitModal,
        closeFitModal,
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
