import { AreaCategory, Project, Task, Habit, HabitLog, FinancialAccount, Transaction, Budget, Book, ReadingLog, BookNote, HealthProfile, HealthLog, Debt, ReadingGroup, ReadingSession } from '../types';

// Helper to get today/yesterday ISO dates
const getTodayStr = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const currentMonthStr = getTodayStr().substring(0, 7);

export const initialAreas: AreaCategory[] = [
  { id: 'area_health', name: 'Salud & Bienestar', color: '#10B981', icon: 'HeartPulse', type: 'health' },
  { id: 'area_work', name: 'Trabajo & Carrera', color: '#3B82F6', icon: 'Briefcase', type: 'work' },
  { id: 'area_finance', name: 'Finanzas Personales', color: '#F59E0B', icon: 'Wallet', type: 'finance' },
  { id: 'area_learning', name: 'Desarrollo Personal', color: '#8B5CF6', icon: 'GraduationCap', type: 'education' },
  { id: 'area_home', name: 'Hogar & Estilo de Vida', color: '#EC4899', icon: 'Home', type: 'lifestyle' },
];

export const initialProjects: Project[] = [
  {
    id: 'proj_huerta',
    name: 'Huerta Vertical Hidropónica',
    description: 'Construcción de estructura de tubos PVC de 4 niveles con sistema de riego por goteo automatizado y temporizador solar.',
    areaId: 'area_home',
    color: '#10B981',
    icon: 'Sprout',
    targetDate: getTodayStr(20),
    createdAt: getTodayStr(-10),
    category: 'physical',
    status: 'in_progress',
    progress: 60,
    budget: 85000,
    tags: ['Huerta', 'DIY', 'Sostenibilidad', 'Hogar'],
    milestones: [
      { id: 'm1', title: 'Comprar tubos PVC 4" y bomba de agua 12V', completed: true },
      { id: 'm2', title: 'Perforar maceteros y armar soporte de madera', completed: true },
      { id: 'm3', title: 'Instalar circuito de riego y temporizador digital', completed: false },
      { id: 'm4', title: 'Plantar lechugas, albahaca y frutillas', completed: false }
    ],
    notes: 'Ubicación ideal: Patio trasero orientado al norte para máxima radiación solar.'
  },
  {
    id: 'proj_app',
    name: 'LifeOS App Móvil PWA',
    description: 'Desarrollo de versión web app ejecutable offline en smartphone con soporte para régimen minero y biometría.',
    areaId: 'area_work',
    color: '#3B82F6',
    icon: 'Smartphone',
    targetDate: getTodayStr(15),
    createdAt: getTodayStr(-5),
    category: 'app',
    status: 'in_progress',
    progress: 80,
    tags: ['React', 'Mobile', 'LifeOS', 'Software'],
    milestones: [
      { id: 'm10', title: 'Diseñar arquitectura local-first', completed: true },
      { id: 'm11', title: 'Integrar Asistente Copilot IA con Gemini', completed: true },
      { id: 'm12', title: 'Añadir módulo de Proyectos Físicos y Apps', completed: true },
      { id: 'm13', title: 'Generar PWA manifest y exportación APK', completed: false }
    ],
    notes: 'Probar performance en dispositivos Android durante bajada de faena.'
  },
  {
    id: 'proj_1',
    name: 'Configuración Inicial LifeOS',
    description: 'Puesta a punto de metas, hábitos y presupuestos personales',
    areaId: 'area_work',
    color: '#6366F1',
    icon: 'Rocket',
    targetDate: getTodayStr(7),
    createdAt: getTodayStr(),
    category: 'personal',
    status: 'in_progress',
    progress: 75,
    milestones: [
      { id: 'm20', title: 'Calibrar turno 14x14', completed: true },
      { id: 'm21', title: 'Configurar cuentas en CLP', completed: true },
      { id: 'm22', title: 'Sincronizar cuenta Google', completed: false }
    ]
  },
  {
    id: 'proj_3',
    name: 'Fondo de Reserva Personal',
    description: 'Meta de ahorro consciente en CLP',
    areaId: 'area_finance',
    color: '#F59E0B',
    icon: 'PiggyBank',
    targetDate: getTodayStr(180),
    createdAt: getTodayStr(),
    category: 'personal',
    status: 'in_progress',
    progress: 40,
    budget: 3500000,
    tags: ['Ahorro', 'Finanzas']
  }
];

export const initialTasks: Task[] = [
  {
    id: 'task_1',
    title: 'Calibrar turno de trabajo (14x14) en LifeOS',
    description: 'Ajustar el día exacto de descanso/trabajo para sincronizar el calendario.',
    status: 'todo',
    priority: 'p1',
    dueDate: getTodayStr(0),
    dueTime: '12:00',
    projectId: 'proj_1',
    areaId: 'area_work',
    subtasks: [
      { id: 'sub_1', title: 'Ingresar día actual del turno', completed: false },
      { id: 'sub_2', title: 'Verificar fechas de subida y bajada de faena', completed: false }
    ],
    createdAt: getTodayStr(0),
  },
  {
    id: 'task_2',
    title: 'Configurar presupuestos mensuales en CLP',
    description: 'Ajustar límites de gasto en supermercado, ocio y transporte.',
    status: 'todo',
    priority: 'p2',
    dueDate: getTodayStr(0),
    dueTime: '18:00',
    projectId: 'proj_3',
    areaId: 'area_finance',
    subtasks: [],
    createdAt: getTodayStr(0),
  },
  {
    id: 'task_3',
    title: 'Registrar primer chequeo de constantes vitales',
    description: 'Medir saturación de oxígeno (SpO2) y presión arterial.',
    status: 'todo',
    priority: 'p1',
    dueDate: getTodayStr(0),
    dueTime: '20:00',
    projectId: 'proj_2',
    areaId: 'area_health',
    subtasks: [],
    createdAt: getTodayStr(0),
  },
];

export const initialHabits: Habit[] = [
  {
    id: 'habit_1',
    title: 'Ejercicio & Movilidad',
    description: 'Entrenamiento físico o caminata diaria de 45 minutos',
    areaId: 'area_health',
    color: '#10B981',
    icon: 'Dumbbell',
    frequency: 'daily',
    targetValue: 45,
    unit: 'minutos',
    streak: 0,
    bestStreak: 0,
    createdAt: getTodayStr(0),
  },
  {
    id: 'habit_2',
    title: 'Hidratación Consciente',
    description: 'Beber 2.5 a 3.5 Litros de agua (clave para altura geográfica)',
    areaId: 'area_health',
    color: '#06B6D4',
    icon: 'Droplets',
    frequency: 'daily',
    targetValue: 2500,
    unit: 'ml',
    streak: 0,
    bestStreak: 0,
    createdAt: getTodayStr(0),
  },
  {
    id: 'habit_3',
    title: 'Lectura Diaria',
    description: 'Leer al menos 15-20 páginas de un libro de interés',
    areaId: 'area_learning',
    color: '#8B5CF6',
    icon: 'BookOpen',
    frequency: 'daily',
    targetValue: 20,
    unit: 'páginas',
    streak: 0,
    bestStreak: 0,
    createdAt: getTodayStr(0),
  },
  {
    id: 'habit_4',
    title: 'Registro de Finanzas Diarias',
    description: 'Anotar cada gasto e ingreso del día en pesos chilenos (CLP)',
    areaId: 'area_finance',
    color: '#F59E0B',
    icon: 'Receipt',
    frequency: 'daily',
    targetValue: 1,
    unit: 'veces',
    streak: 0,
    bestStreak: 0,
    createdAt: getTodayStr(0),
  },
];

export const initialHabitLogs: HabitLog[] = [];

export const initialAccounts: FinancialAccount[] = [
  { id: 'acc_1', name: 'Cuenta RUT / Débito', type: 'debit', balance: 1500000, currency: 'CLP', color: '#3B82F6', icon: 'CreditCard' },
  { id: 'acc_2', name: 'Efectivo Personal', type: 'cash', balance: 50000, currency: 'CLP', color: '#10B981', icon: 'Banknote' },
  { id: 'acc_3', name: 'Fondo de Ahorro / Inversión', type: 'savings', balance: 5000000, currency: 'CLP', color: '#8B5CF6', icon: 'PiggyBank' },
];

export const initialBudgets: Budget[] = [
  { id: 'bud_1', category: 'Alimentación & Supermercado', monthlyLimit: 400000, areaId: 'area_home', period: currentMonthStr },
  { id: 'bud_2', category: 'Tecnología & Herramientas', monthlyLimit: 150000, areaId: 'area_work', period: currentMonthStr },
  { id: 'bud_3', category: 'Salud & Deporte', monthlyLimit: 120000, areaId: 'area_health', period: currentMonthStr },
  { id: 'bud_4', category: 'Ocio & Entretenimiento', monthlyLimit: 150000, areaId: 'area_home', period: currentMonthStr },
];

export const initialTransactions: Transaction[] = [];

export const initialDebts: Debt[] = [
  { id: 'debt_1', name: 'TV Samsung 65"', creditor: 'Abcdin', type: 'retail', totalAmount: 890000, remainingAmount: 520000, interestRate: 1.5, monthlyPayment: 37000, totalInstallments: 24, paidInstallments: 10, startDate: '2025-09-15', dueDate: '2027-09-15', color: '#F59E0B' },
  { id: 'debt_2', name: 'Tarjeta de Crédito BCI', creditor: 'Banco BCI', type: 'credit_card', totalAmount: 2400000, remainingAmount: 1850000, interestRate: 2.8, monthlyPayment: 120000, totalInstallments: 24, paidInstallments: 5, startDate: '2025-12-01', dueDate: '2027-12-01', color: '#EF4444' },
  { id: 'debt_3', name: 'Préstamo Personal', creditor: 'Banco Estado', type: 'loan', totalAmount: 5000000, remainingAmount: 3200000, interestRate: 0.9, monthlyPayment: 175000, totalInstallments: 36, paidInstallments: 10, startDate: '2024-06-01', dueDate: '2027-06-01', color: '#8B5CF6' },
];

export const initialBooks: Book[] = [
  {
    id: 'book_1',
    title: 'Hábitos Atómicos',
    author: 'James Clear',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    totalPages: 320,
    currentPage: 0,
    status: 'reading',
    category: 'Desarrollo Personal',
    rating: 5,
    startDate: getTodayStr(0),
    linkedHabitId: 'habit_3',
    createdAt: getTodayStr(0),
  },
  {
    id: 'book_2',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80',
    totalPages: 616,
    currentPage: 0,
    status: 'want_to_read',
    category: 'Ingeniería de Software',
    rating: 5,
    createdAt: getTodayStr(0),
  }
];

export const initialReadingLogs: ReadingLog[] = [];

export const initialBookNotes: BookNote[] = [
  {
    id: 'note_1',
    bookId: 'book_1',
    title: 'Sistemas sobre Metas',
    quote: 'No te elevas al nivel de tus metas. Caes al nivel de tus sistemas.',
    content: `Las pequeñas mejoras diarias del 1% generan resultados compuestos extraordinarios a lo largo del tiempo.`,
    pageNumber: 1,
    createdAt: getTodayStr(0),
    tags: ['hábitos', 'sistemas', 'productividad']
  }
];

export const initialHealthProfile: HealthProfile = {
  bloodType: 'O Rh+',
  heightCm: 178,
  weightKg: 80.0,
  allergies: ['Sin alergias declaradas'],
  chronicConditions: ['Ninguna'],
  emergencyContact: {
    name: 'Contacto de Emergencia',
    kinship: 'Familiar Directo',
    phone: '+56 9 1234 5678',
    insuranceProvider: 'Fonasa / Isapre + ACHS / Mutual',
  },
  miningAltitudeMeters: 3800,
  occupationalExams: [
    {
      id: 'exam_1',
      title: 'Examen Ocupacional de Altura Geográfica (>3.000 msnm)',
      issueDate: getTodayStr(-30),
      expiryDate: getTodayStr(335),
      status: 'valid',
      institution: 'Mutual de Seguridad CChC',
    }
  ],
  dailyWaterTargetMl: 3500,
  notes: 'Ficha médica limpia e inicializada hoy. Lista para monitoreo de constantes vitales.'
};

export const initialHealthLogs: HealthLog[] = [
  {
    id: 'hlog_1',
    date: getTodayStr(0),
    time: '08:00',
    bloodPressureSys: 120,
    bloodPressureDia: 80,
    heartRateBpm: 65,
    spO2Pct: 98,
    weightKg: 80.0,
    sleepHours: 8.0,
    sleepQuality: 'excelente',
    steps: 10420,
    calories: 2350,
    energyLevel: 9,
    altitudeSymptoms: [],
    locationContext: 'rest_home',
    notes: 'Primer registro del día. Estado general óptimo.'
  }
];
