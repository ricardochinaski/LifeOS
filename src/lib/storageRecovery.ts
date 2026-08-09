const LIFEOS_STORAGE_KEY = 'lifeos_local_v1';
const WIDGET_STORAGE_KEY = 'lifeos_widget_config';

const ARRAY_KEYS = [
  'tasks',
  'habits',
  'habitLogs',
  'accounts',
  'budgets',
  'debts',
  'transactions',
  'financialGoals',
  'recurringTransactions',
  'books',
  'readingLogs',
  'bookNotes',
  'readingGroups',
  'readingSessions',
  'projects',
  'healthLogs',
  'workoutLogs',
] as const;

const OBJECT_KEYS = ['shiftConfig', 'healthProfile', 'appSettings'] as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function sanitizePersistedState(): void {
  try {
    const raw = localStorage.getItem(LIFEOS_STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);

      if (!isPlainObject(parsed)) {
        localStorage.removeItem(LIFEOS_STORAGE_KEY);
      } else {
        let changed = false;
        const sanitized: Record<string, unknown> = { ...parsed };

        for (const key of ARRAY_KEYS) {
          if (key in sanitized && !Array.isArray(sanitized[key])) {
            delete sanitized[key];
            changed = true;
          }
        }

        for (const key of OBJECT_KEYS) {
          if (key in sanitized && !isPlainObject(sanitized[key])) {
            delete sanitized[key];
            changed = true;
          }
        }

        if (changed) {
          localStorage.setItem(LIFEOS_STORAGE_KEY, JSON.stringify(sanitized));
        }
      }
    }
  } catch (error) {
    console.error('LifeOS: persisted state was invalid and has been reset.', error);
    localStorage.removeItem(LIFEOS_STORAGE_KEY);
  }

  try {
    const rawWidgets = localStorage.getItem(WIDGET_STORAGE_KEY);
    if (rawWidgets) {
      const parsedWidgets: unknown = JSON.parse(rawWidgets);
      if (!isPlainObject(parsedWidgets)) {
        localStorage.removeItem(WIDGET_STORAGE_KEY);
      }
    }
  } catch (error) {
    console.error('LifeOS: widget configuration was invalid and has been reset.', error);
    localStorage.removeItem(WIDGET_STORAGE_KEY);
  }
}
