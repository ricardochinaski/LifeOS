# PE-20 · Entrenamientos como único módulo físico

## Decisión
LifeOS retira Salud/Biometría de la experiencia operativa y concentra el ámbito físico en un único módulo de **Entrenamientos**.

## Experiencia visible
- Más: `Entrenamientos` reemplaza a `Salud`.
- Inicio: solo resume entrenamiento; no muestra biometría.
- Calendario: capa `Entrenos`; se retira la capa `Salud`.
- Copilot: usa turno, tareas, hábitos, finanzas y entrenamiento; no recibe biometría.
- Configuración: `Salud & Biometría` se retira de la navegación visible.
- Captura rápida conserva `Entreno`.
- Health Connect / sincronización biométrica deja de estar accesible desde la experiencia.

## Pantalla Entrenamientos
Basada en el `WorkoutLog` existente:
- registro de sesiones;
- tipos de entrenamiento;
- duración y contexto Faena/Descanso;
- múltiples ejercicios;
- series, repeticiones, carga, descanso y RPE;
- historial expandible y filtros;
- métricas de 7 y 30 días;
- planificación de rutina por IA sin biometría.

## Integridad de datos
No se borran automáticamente `healthProfile` ni `healthLogs`. Permanecen como datos históricos de compatibilidad y backup hasta que exista una migración explícita. Tampoco se elimina la sincronización general de LifeOS/Firestore: la retirada corresponde únicamente al producto Salud/Health Connect.
