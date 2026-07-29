export const APP_CONSTANTS = {
  VERSION: '2.4.0',
  STORAGE_KEYS: {
    CUSTOM_SETTINGS: 'lifeos_custom_settings',
    DARK_MODE: 'lifeos_dark_mode',
    LOCAL_DATA: 'lifeos_local_v1',
  },
  DEFAULTS: {
    ALTITUDE_METERS: 4200,
    WATER_TARGET_ML: 3500,
    READING_PAGES_PER_DAY: 20,
    WORK_DAYS: 14,
    REST_DAYS: 14,
  },
  COLORS: {
    ACCENT_OPTIONS: [
      { id: 'emerald', name: 'Esmeralda', bg: 'bg-emerald-500' },
      { id: 'blue', name: 'Zafiro', bg: 'bg-blue-500' },
      { id: 'purple', name: 'Amatista', bg: 'bg-purple-500' },
      { id: 'amber', name: 'Cobre', bg: 'bg-amber-500' },
      { id: 'rose', name: 'Carmesí', bg: 'bg-rose-500' },
    ] as const,
    DENSITY_OPTIONS: [
      { id: 'comfortable', label: 'Cómoda', desc: 'Espacioso' },
      { id: 'compact', label: 'Compacta', desc: 'Alta Densidad' },
      { id: 'spacious', label: 'Expandida', desc: 'Máximo Confort' },
    ] as const,
    FONT_OPTIONS: [
      { id: 'sans', name: 'Sans (Sistema)', class: 'font-sans' },
      { id: 'serif', name: 'Serif (Lectura)', class: 'font-serif' },
      { id: 'mono', name: 'Mono (Código)', class: 'font-mono' },
    ] as const,
  },
  CURRENCIES: ['CLP', 'USD', 'EUR', 'UF'] as const,
  NOTIFICATION_TYPES: [
    { id: 'shift', label: 'Cambios de Turno', defaultTime: '08:00', defaultEnabled: true },
    { id: 'habit', label: 'Recordatorios de Hábitos', defaultTime: '20:00', defaultEnabled: true },
    { id: 'water', label: 'Hidratación', defaultTime: '10:00', defaultEnabled: false },
    { id: 'reading', label: 'Meta de Lectura', defaultTime: '21:00', defaultEnabled: false },
    { id: 'budget', label: 'Alertas de Presupuesto', defaultTime: '12:00', defaultEnabled: true },
    { id: 'health', label: 'Chequeos de Salud', defaultTime: '07:00', defaultEnabled: false },
  ] as const,
  READING_CATEGORIES: [
    'Desarrollo Personal',
    'Ingeniería de Software',
    'Ciencia & Tecnología',
    'Negocios & Finanzas',
    'Psicología',
    'Historia',
    'Biografías',
    'Ficción',
    'Filosofía',
    'Otros',
  ] as const,
} as const;

export type AccentColorId = typeof APP_CONSTANTS.COLORS.ACCENT_OPTIONS[number]['id'];
export type DensityId = typeof APP_CONSTANTS.COLORS.DENSITY_OPTIONS[number]['id'];
export type FontFamilyId = typeof APP_CONSTANTS.COLORS.FONT_OPTIONS[number]['id'];
export type CurrencyId = typeof APP_CONSTANTS.CURRENCIES[number];
export type NotificationTypeId = typeof APP_CONSTANTS.NOTIFICATION_TYPES[number]['id'];
export type ReadingCategory = typeof APP_CONSTANTS.READING_CATEGORIES[number];