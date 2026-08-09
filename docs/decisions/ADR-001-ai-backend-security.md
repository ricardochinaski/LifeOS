# ADR-001 — IA administrada por backend

## Estado

Aceptado durante la Fase 1 de saneamiento de LifeOS.

## Decisión

LifeOS no almacenará claves de proveedores de IA en `localStorage`, Firestore ni backups del cliente. Copilot, generación de rutinas y parseo de voz utilizarán un único servicio compartido de IA y, en producción web, un endpoint Vercel autenticado mediante Firebase ID token.

Cuando el proveedor no esté configurado o no responda, LifeOS utilizará fallbacks locales conservadores que no inventan biometría, altitud ni antecedentes ausentes.

## Consecuencias

- `GEMINI_API_KEY` se mantiene únicamente como secreto del entorno de backend.
- La interfaz deja de solicitar una API key al usuario.
- Las implementaciones heredadas de IA en cliente y Firebase Functions quedan retiradas o cerradas de forma explícita.
- Datos de salud ausentes se representan como `no disponible`.
- Las rutas de IA deben tener pruebas de seguridad antes de cambios posteriores.
