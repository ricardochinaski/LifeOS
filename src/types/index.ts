export type Priority = 'p1' | 'p2' | 'p3' | 'p4';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export type ViewMode = 'list' | 'kanban' | 'calendar';

export type ShiftType = 'rest' | 'work'; // 'rest' = Descanso, 'work' = Faena Minera

export interface ShiftConfig {
  enabled: boolean;
  restDays: number;       // default 14
  workDays: number;       // default 14
  currentPhase: ShiftType;// 'rest' or 'work'
  currentDayInPhase: number; // 1..14 (e.g. 4)
  anchorDate: string;     // YYYY-MM-DD date corresponding to Day 1 of the currentPhase
  notes?: string;
  locationName?: string;  // e.g. "Mina / Campamento"
}

export interface ShiftInfo {
  phase: ShiftType;
  dayInPhase: number;
  totalPhaseDays: number;
  daysRemaining: number;
  nextChangeDate: string; // YYYY-MM-DD
  nextPhase: ShiftType;
  cycleProgressPct: number;
}

export interface AreaCategory {
  id: string;
  name: string;
  color: string; // Tailwind color class or hex
  icon: string;  // Lucide icon identifier
  type: 'general' | 'finance' | 'work' | 'health' | 'education' | 'lifestyle';
}

export type ProjectCategory = 'app' | 'physical' | 'hardware' | 'personal' | 'home';
export type ProjectStatus = 'idea' | 'in_progress' | 'paused' | 'completed';

export interface ProjectMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  areaId: string;
  color: string;
  icon: string;
  targetDate?: string;
  createdAt: string;
  category?: ProjectCategory;
  status?: ProjectStatus;
  progress?: number; // 0..100
  milestones?: ProjectMilestone[];
  budget?: number;
  notes?: string;
  tags?: string[];
}

export interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endsAfter?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  dueTime?: string;
  projectId?: string;
  areaId?: string;
  subtasks: { id: string; title: string; completed: boolean }[];
  linkedHabitId?: string;
  linkedBookId?: string;
  linkedTransactionId?: string;
  shiftContext?: 'all' | 'rest' | 'work'; // 'rest'=Solo Descanso, 'work'=Solo Faena
  createdAt: string;
  completedAt?: string;
  notifyAt?: string; // HH:mm format for notification reminder
  recurrence?: RecurrenceRule;
  completedCount?: number;
  tags?: string[];
  estimatedMinutes?: number;
}

export type HabitFrequency = 'daily' | 'weekly' | 'target_times';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  areaId: string;
  color: string;
  icon: string;
  frequency: HabitFrequency;
  targetValue: number; // e.g., 1 time, 2000 ml, 30 mins
  unit: string;        // 'veces', 'ml', 'minutos', 'páginas'
  targetDaysOfWeek?: number[]; // [1,2,3,4,5,6,0] (1=Mon)
  targetPerWeek?: number;
  streak: number;
  bestStreak: number;
  createdAt: string;
  linkedBookId?: string;
  shiftContext?: 'all' | 'rest' | 'work';
  notifyAt?: string; // HH:mm format for daily notification reminder
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  activeDays?: number[]; // 0=Sunday, 1=Monday... Empty means every day.
  streakFreezes?: number;
  isNegative?: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  value: number; // actual logged value
  completed: boolean;
  notes?: string;
}

export type AccountType = 'cash' | 'debit' | 'credit' | 'savings' | 'investment';

export interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string; // 'USD', 'EUR', 'MXN', 'COP', 'ARS'
  color: string;
  icon: string;
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  category: string;
  areaId?: string;
  description: string;
  date: string;
  transferToAccountId?: string;
  linkedProjectId?: string;
  linkedTaskId?: string;
  linkedBookId?: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  areaId?: string;
  period: string; // YYYY-MM
  rollover?: boolean;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  color: string;
  linkedAccountId?: string;
  createdAt: string;
}

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  accountId: string;
  frequency: 'weekly' | 'monthly';
  nextDate: string;
  active: boolean;
}

export type SyncCollection = 'tasks' | 'habits' | 'habitLogs' | 'finances' | 'library' | 'health' | 'projects' | 'settings';
export type SyncState = Record<SyncCollection, 'idle' | 'syncing' | 'synced' | 'error'>;

export type DebtType = 'loan' | 'credit_card' | 'retail' | 'personal' | 'mortgage' | 'other';

export interface Debt {
  id: string;
  name: string;
  creditor: string;
  type: DebtType;
  totalAmount: number;       // total original debt
  remainingAmount: number;   // what's left to pay
  interestRate?: number;     // annual % (e.g. 1.8 for 1.8%)
  monthlyPayment?: number;   // cuota mensual
  totalInstallments?: number; // total cuotas (e.g. 12)
  paidInstallments?: number;  // cuotas pagadas
  dueDate?: string;          // YYYY-MM-DD
  startDate: string;         // YYYY-MM-DD
  notes?: string;
  color?: string;
}

export type BookStatus = 'want_to_read' | 'reading' | 'completed' | 'abandoned';

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  category?: string;
  rating?: number; // 1-5
  startDate?: string;
  finishDate?: string;
  linkedHabitId?: string;
  linkedProjectId?: string;
  createdAt: string;
}

export interface ReadingLog {
  id: string;
  bookId: string;
  date: string; // YYYY-MM-DD
  pagesRead: number;
  startPage: number;
  endPage: number;
  notes?: string;
}

export interface BookNote {
  id: string;
  bookId: string;
  title: string;
  content: string; // Markdown supported
  quote?: string;
  pageNumber?: number;
  createdAt: string;
  tags?: string[];
}

export type TabType = 'dashboard' | 'tasks' | 'habits' | 'finances' | 'library' | 'health' | 'settings';

export interface AppCustomSettings {
  primaryColor: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose';
  uiDensity: 'comfortable' | 'compact' | 'spacious';
  fontFamily: 'sans' | 'serif' | 'mono';
  currency: 'CLP' | 'USD' | 'EUR' | 'UF';
  autoSyncCloud: boolean;
  soundEffects: boolean;
  startOfWeek: 1 | 0; // 1=Monday, 0=Sunday
}

export interface EmergencyContact {
  name: string;
  kinship: string;
  phone: string;
  insuranceProvider: string;
}

export interface OccupationalExam {
  id: string;
  title: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring_soon' | 'expired';
  institution?: string;
}

export interface HealthProfile {
  bloodType: string;
  heightCm: number;
  weightKg: number;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: EmergencyContact;
  miningAltitudeMeters: number;
  occupationalExams: OccupationalExam[];
  dailyWaterTargetMl: number;
  notes?: string;
}

export interface HealthLog {
  id: string;
  date: string;
  time?: string;
  bloodPressureSys?: number;
  bloodPressureDia?: number;
  heartRateBpm?: number;
  spO2Pct?: number;
  weightKg?: number;
  sleepHours?: number;
  sleepQuality?: 'excelente' | 'buena' | 'regular' | 'mala';
  steps?: number;
  calories?: number;
  bodyFatPct?: number;
  energyLevel?: number;
  altitudeSymptoms?: string[];
  locationContext?: 'rest_home' | 'mine_camp' | 'transit';
  notes?: string;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  targetMuscle: string;
  description: string;
}

export interface WorkoutRoutineAI {
  id?: string;
  date?: string;
  title: string;
  summary: string;
  precautions: string[];
  warmup: { exercise: string; duration: string; notes?: string }[];
  exercises: WorkoutExercise[];
  cooldown: { exercise: string; duration: string; notes?: string }[];
  equipment?: string;
  durationMinutes?: number;
  focusGoal?: string;
}

export interface QuickCaptureParsed {
  title: string;
  type: 'task' | 'habit' | 'transaction' | 'reading';
  priority?: Priority;
  areaId?: string;
  dueDate?: string;
  amount?: number;
  account?: string;
  bookTitle?: string;
  pages?: number;
}

export interface ReadingGroup {
  id: string;
  name: string;
  description: string;
  bookId: string;
  ownerId: string;
  memberIds: string[];
  schedule: {
    type: 'weekly' | 'biweekly' | 'monthly' | 'custom';
    dayOfWeek?: number;
    time?: string;
  };
  status: 'active' | 'paused' | 'completed';
  progress: number; // percentage
  currentPage: number;
  targetPage: number;
  membersCount: number;
  messages?: any[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastMeetingDate?: string;
  nextMeetingDate?: string;
}


export interface ReadingSession {
  id: string;
  bookId: string;
  groupId?: string;
  userId: string;
  date: string;
  startTime: string;
  endTime?: string;
  pagesRead: number;
  duration: number; // in minutes
  notes?: string;
  createdAt: string;
}
