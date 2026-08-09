import { addDaysToDateOnly } from './dateOnly';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { ShiftConfig } from '../types';
import { isNative } from './native';

export interface CalendarSyncResult {
  success: boolean;
  eventsSynced: number;
  message: string;
}

export interface ShiftCalendarEvent {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
}

export function generateShiftEvents(shiftConfig: ShiftConfig): ShiftCalendarEvent[] {
  const events: ShiftCalendarEvent[] = [];
  const totalCycle = shiftConfig.restDays + shiftConfig.workDays;

  for (let i = 0; i < totalCycle; i++) {
    const dateStr = addDaysToDateOnly(shiftConfig.anchorDate, i);
    const dayInCycle = i % totalCycle;
    const isRest = shiftConfig.currentPhase === 'rest'
      ? dayInCycle < shiftConfig.restDays
      : dayInCycle >= shiftConfig.workDays;

    events.push({
      title: isRest ? 'Descanso 🏠' : 'Faena Minera ⛏️',
      description: `Día ${(dayInCycle % (isRest ? shiftConfig.restDays : shiftConfig.workDays)) + 1} de ${isRest ? shiftConfig.restDays : shiftConfig.workDays} · Turno 14x14 LifeOS`,
      startDate: dateStr,
      endDate: dateStr,
      allDay: true,
    });
  }

  return events;
}

async function getCalendarAccessToken(): Promise<string | null> {
  if (!isNative()) return null;

  try {
    const result = await FirebaseAuthentication.signInWithGoogle({
      skipNativeAuth: true,
      scopes: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/calendar.events',
      ],
    });
    return result.credential?.accessToken || null;
  } catch (e) {
    console.error('Error getting calendar access token:', e);
    return null;
  }
}

async function createGoogleCalendarEvent(
  accessToken: string,
  event: ShiftCalendarEvent,
  calendarId = 'primary'
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.title,
          description: event.description,
          start: { date: event.startDate },
          end: { date: event.endDate },
          transparency: 'transparent',
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 30 },
            ],
          },
        }),
      }
    );

    return response.ok;
  } catch (e) {
    console.error('Error creating Google Calendar event:', e);
    return false;
  }
}

export async function syncCalendarWithGoogleCalendar(
  shiftConfig: ShiftConfig
): Promise<CalendarSyncResult> {
  if (!isNative()) {
    return {
      success: false,
      eventsSynced: 0,
      message: 'Sincronización solo disponible en Android.',
    };
  }

  try {
    const accessToken = await getCalendarAccessToken();
    if (!accessToken) {
      return {
        success: false,
        eventsSynced: 0,
        message: 'No se pudo obtener acceso a Google Calendar. Asegúrate de aceptar el permiso.',
      };
    }

    const events = generateShiftEvents(shiftConfig);
    let synced = 0;

    for (const event of events) {
      const ok = await createGoogleCalendarEvent(accessToken, event);
      if (ok) synced++;
    }

    return {
      success: synced > 0,
      eventsSynced: synced,
      message: `${synced} de ${events.length} eventos creados en tu Google Calendar.`,
    };
  } catch (e: any) {
    console.error('Calendar sync error:', e);
    return {
      success: false,
      eventsSynced: 0,
      message: 'Error al sincronizar con Google Calendar.',
    };
  }
}
