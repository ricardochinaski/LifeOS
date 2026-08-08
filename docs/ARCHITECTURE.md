# Arquitectura de LifeOS

## Visión general

LifeOS combina una aplicación React/TypeScript, un servidor Express para endpoints de aplicación e IA, una capa móvil Android mediante Capacitor y servicios Firebase para autenticación y sincronización opcional.

```text
Usuario
  ↓
React + TypeScript
  ↓
Contexto / componentes / utilidades
  ↓                  ↘
Persistencia local     server.ts (Express)
  ↓                      ↓
Capacitor / Android      Gemini API
  ↓
Firebase Auth / Firestore / integraciones nativas
```

## Frontend

La aplicación web vive principalmente en `src/`.

- `src/components/`: componentes y pantallas.
- `src/context/`: estado compartido y proveedores de contexto.
- `src/data/`: datos y estructuras auxiliares.
- `src/lib/`: integraciones/lógica reusable.
- `src/types/`: contratos TypeScript.
- `src/utils/`: funciones auxiliares.

La entrada principal es `src/main.tsx` y el contenedor de aplicación es `src/App.tsx`.

## Servidor

`server.ts` levanta Express y sirve tanto la aplicación compilada como endpoints `/api/...`.

Entre sus responsabilidades actuales están:

- health check del servicio;
- generación de rutinas con IA;
- asistente conversacional LifeOS Copilot;
- fallbacks locales cuando la API de Gemini no está disponible.

Las claves de IA se leen desde variables de entorno. Ninguna clave real debe almacenarse en el repositorio.

## Android y Capacitor

`capacitor.config.ts` define:

- `appId`: `com.aselec.lifeos`;
- nombre de aplicación `LifeOS`;
- salida web `dist`;
- integración de Firebase Authentication;
- notificaciones locales;
- reconocimiento de voz en `es-CL`;
- configuración Android y alias de firma.

El directorio `android/` contiene el proyecto nativo y las integraciones que no pueden resolverse únicamente desde la capa web.

## Firebase

LifeOS usa Firebase para autenticación y sincronización opcional.

Las reglas actuales de Firestore limitan acceso a usuarios autenticados y a su propio árbol:

```text
users/{userId}/...
```

Cualquier cambio en estructura de datos debe considerar migraciones, compatibilidad con copias locales y restauración desde JSON.

## Datos locales y sincronización

LifeOS tiene una filosofía local-first en varias funciones: la aplicación debe seguir siendo útil sin conexión y utilizar servicios de nube como complemento.

Antes de ampliar la sincronización conviene formalizar:

1. fuente de verdad por tipo de dato;
2. estrategia de resolución de conflictos;
3. versión del esquema de exportación/importación;
4. comportamiento offline;
5. migraciones entre versiones.

## IA

Actualmente se utiliza `@google/genai` desde el servidor.

Principios recomendados:

- mantener la clave del proveedor exclusivamente en backend/entorno seguro;
- validar y limitar los datos enviados al modelo;
- separar prompts de lógica de negocio cuando crezcan;
- validar respuestas estructuradas antes de persistirlas;
- conservar un fallback razonable cuando el proveedor no esté disponible.

## Salud y seguridad

LifeOS maneja biometría y recomendaciones relacionadas con ejercicio y altitud. Esta parte requiere especial disciplina:

- no presentar recomendaciones generadas como diagnóstico;
- evitar valores por defecto que puedan confundirse con datos reales del usuario;
- identificar claramente datos simulados/fallback;
- revisar umbrales clínicos antes de convertirlos en reglas de producto;
- registrar las decisiones de seguridad relevantes en `docs/decisions/`.

## Gestión de cambios

`main` debe mantenerse estable. Para cambios relevantes:

```text
Issue → rama → implementación → validación → Pull Request → revisión → merge
```

Cambios arquitectónicos que afecten persistencia, seguridad, autenticación, IA o integraciones nativas deberían documentarse mediante una decisión técnica corta en `docs/decisions/`.
