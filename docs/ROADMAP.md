# Roadmap de LifeOS

Este roadmap prioriza estabilidad, claridad arquitectónica y seguridad antes de añadir más módulos.

## P0 — Saneamiento inmediato

- Mantener README y documentación técnica alineados con el producto real.
- Consolidar un único gestor de paquetes y un único lockfile (`package-lock.json` o `bun.lock`).
- Revisar variables de entorno y eliminar referencias heredadas de AI Studio que ya no sean necesarias.
- Inventariar integraciones externas: Firebase, Google Calendar, Health Connect y Gemini.
- Definir qué datos son locales, cuáles se sincronizan y cuál es la fuente de verdad.
- Revisar mensajes y valores fallback relacionados con salud para evitar confundir datos simulados con datos reales.

## P1 — Calidad y CI

- Añadir pruebas automatizadas para lógica crítica: ciclo 14×14, tareas, finanzas, respaldo/restauración y sincronización.
- Añadir CI para ejecutar TypeScript/lint y build en cada Pull Request.
- Añadir verificación de secretos/configuración sensible.
- Documentar build y firma Android.
- Añadir checklist de release.

## P1 — Datos y sincronización

- Versionar el esquema de exportación/importación JSON.
- Documentar estrategia de conflictos entre almacenamiento local y Firestore.
- Definir migraciones de datos entre versiones.
- Añadir pruebas de restauración y compatibilidad hacia atrás.

## P2 — IA

- Separar prompts extensos de `server.ts` hacia módulos dedicados.
- Crear validadores explícitos para respuestas estructuradas de IA.
- Minimizar datos personales enviados al proveedor.
- Añadir límites y manejo de errores consistente.
- Documentar comportamiento cuando Gemini no está disponible.

## P2 — Android

- Documentar dependencias nativas y permisos.
- Validar notificaciones locales en versiones Android soportadas.
- Revisar Health Connect y permisos por versión.
- Formalizar flujo de generación de APK/AAB y publicación.

## P3 — Producto

- Consolidar métricas de uso realmente útiles.
- Reducir complejidad visual donde existan módulos solapados.
- Revisar qué funcionalidades son núcleo de LifeOS y cuáles deberían ser opcionales.
- Mantener `FUNCIONALIDADES.md` actualizado tras cada cambio relevante.

## Política de prioridad

Antes de añadir una nueva funcionalidad debe evaluarse:

1. ¿Resuelve un problema recurrente?
2. ¿Encaja con el ciclo 14×14 y el propósito central de LifeOS?
3. ¿Introduce nuevos datos sensibles o permisos?
4. ¿Tiene pruebas o una forma clara de validarse?
5. ¿Aumenta deuda técnica en una zona que ya requiere saneamiento?

Si una funcionalidad no supera estas preguntas, debe quedar como Issue de exploración y no implementarse directamente.
