import * as functions from 'firebase-functions';

const retired = () => {
  throw new functions.https.HttpsError(
    'failed-precondition',
    'Esta función de IA fue retirada. Usa el backend autenticado de LifeOS.',
  );
};

export const aiWorkout = functions.https.onCall(async () => retired());
export const aiChat = functions.https.onCall(async () => retired());
export const parseVoice = functions.https.onCall(async () => retired());

export const syncCalendar = functions.https.onCall(async (request) => {
  const { events } = request.data;
  if (!events || !Array.isArray(events)) {
    throw new functions.https.HttpsError('invalid-argument', 'Eventos requeridos');
  }

  const calendarLinks = events.map((event: any) => {
    const date = event.startDate?.replace(/-/g, '');
    const title = encodeURIComponent(event.title || 'Evento LifeOS');
    const desc = encodeURIComponent(event.description || '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}/${date}&details=${desc}`;
  });

  return {
    success: true,
    eventsSynced: events.length,
    message: `${events.length} eventos generados para Google Calendar.`,
    calendarLinks,
  };
});
