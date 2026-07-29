# LifeOS — Funcionalidades Completas

> App para trabajadores mineros con régimen 14×14. React 19 + TypeScript + Capacitor Android + Gemini AI.

---

## Índice

1. [Dashboard (Inicio)](#1-dashboard-inicio)
2. [Sistema de Turnos 14×14](#2-sistema-de-turnos-14x14)
3. [Tareas](#3-tareas)
4. [Hábitos](#4-hábitos)
5. [Finanzas](#5-finanzas)
6. [Salud y Biometría](#6-salud-y-biometría)
7. [Calendario](#7-calendario)
8. [Lectura (Biblioteca)](#8-lectura-biblioteca)
9. [Asistente IA (Copilot)](#9-asistente-ia-copilot)
10. [Comandos de Voz](#10-comandos-de-voz)
11. [Temporizadores de Enfoque](#11-temporizadores-de-enfoque)
12. [Notificaciones](#12-notificaciones)
13. [Google Calendar](#13-google-calendar)
14. [Health Connect](#14-health-connect)
15. [Widget Android](#15-widget-android)
16. [Personalización y Ajustes](#16-personalización-y-ajustes)
17. [Sincronización en la Nube](#17-sincronización-en-la-nube)
18. [Respaldo y Restauración](#18-respaldo-y-restauración)

---

## 1. Dashboard (Inicio)

Pantalla principal que centraliza toda la información del día.

### Componentes visuales

| Widget | Descripción |
|---|---|
| **Turno 14×14** | Tarjeta con fase actual (Faena/Descanso), día del ciclo, progreso y próxima fecha de cambio |
| **Temporizadores** | Pomodoro, Meditación y Ejercicio con círculo de progreso SVG |
| **Hábitos de Hoy** | Lista de hábitos del día con check rápido y racha actual |
| **Tareas Prioritarias** | Tareas P1/P2 pendientes con toggle de completado |
| **Salud y Biometría** | SpO2, pulso, presión arterial y sueño del último registro |
| **Finanzas del Mes** | Balance de cuentas, gasto acumulado y barra de presupuesto |
| **Lectura Activa** | Progreso del libro actual y botones para sumar páginas |

### Controles
- **Botón Widgets**: Activar/desactivar cada tarjeta visible
- **Botón Captura Rápida**: Añadir tareas al instante
- **Botón Copilot IA**: Flotante en esquina inferior derecha

---

## 2. Sistema de Turnos 14×14

Gestión del ciclo de trabajo minero de 14 días de faena y 14 de descanso.

### Configuración
- Días de faena y descanso configurables
- Fecha ancla para sincronizar el ciclo
- Nombre de ubicación o campamento

### Visualización
- Fase actual: **⛏️ Faena Minera** o **🏠 Descanso**
- Día actual dentro del ciclo (1–14)
- Días restantes hasta el próximo cambio
- Fecha del próximo cambio de fase
- Barra de progreso del ciclo completo

### Calibración
- Modal de recalibración para ajustar el ciclo manualmente
- Selección de día y fase desde una fecha específica

---

## 3. Tareas

Gestión completa de tareas con soporte para contextos mineros.

### Vistas
- **Lista**: Vista tradicional con filtros por prioridad y estado
- **Kanban**: Columnas de pendiente, en progreso y completado

### Características
- Prioridades: P1 (urgente), P2 (alta), P3 (normal), P4 (baja)
- Contexto de turno: `all`, `solo faena`, `solo descanso`
- Subtareas
- Fecha de vencimiento y hora
- Vincular a proyecto, hábito, libro o transacción
- Área categorizable (salud, finanzas, trabajo, etc.)

### Captura Rápida
- Modal rápido para crear tareas sin navegar
- Parseo inteligente de texto (detecta prioridad, fecha)

---

## 4. Hábitos

Seguimiento de hábitos diarios con rachas y estadísticas.

### Tipos de Frecuencia
- **Diario**: Una vez al día
- **Semanal**: N veces por semana
- **Por meta**: Valor numérico específico (ej. 2000 ml agua)

### Vistas
- **Tarjetas**: Vista compacta con toggle diario
- **Semanal**: Tabla de 7 días con racha actual
- **Mensual**: Calendario con heatmap de 28 días

### Características
- Racha actual y mejor racha histórica
- Logro diario con un clic
- Color y área personalizable
- Contexto de turno (faena/descanso/ambos)
- Vinculable a libro (ej. leer 20 páginas/día)

---

## 5. Finanzas

Control de finanzas personales con múltiples cuentas y presupuestos.

### Cuentas
- Tipos: efectivo, débito, crédito, ahorro, inversión
- Saldo por cuenta
- Moneda configurable (CLP, USD, EUR, UF)
- Color e ícono por cuenta

### Transacciones
- Ingresos, gastos y transferencias
- Categorización por área
- Vinculable a proyectos y tareas
- Fecha y descripción

### Presupuestos
- Límite mensual por categoría
- Alerta visual al 80% y 100% del presupuesto
- Barra de progreso con color dinámico (verde → ámbar → rojo)

---

## 6. Salud y Biometría

Monitoreo de salud adaptado a trabajadores en altitud minera.

### Registros Biométricos
- SpO2 (saturación de oxígeno)
- Frecuencia cardíaca (BPM)
- Presión arterial (sistólica/diastólica)
- Peso
- Horas y calidad de sueño
- Nivel de energía
- Síntomas de altitud
- Contexto de ubicación (campamento/descanso/tránsito)

### Perfil de Salud
- Tipo de sangre
- Altura y peso
- Alergias y condiciones crónicas
- Contacto de emergencia
- Exámenes ocupacionales con fechas de expiración
- Altitud operativa (msnm)
- Meta diaria de agua

### Rutinas de Ejercicio
- Generación de rutinas personalizadas vía IA (Gemini)
- Adaptación a altitud y niveles de SpO2
- Ejercicios con series, repeticiones y descanso
- Precauciones para alta altitud

### Integración Health Connect
- Sincronización nativa con Health Connect (Android)
- Importa SpO2, pulso, pasos, sueño y presión
- Modal de sincronización Xiaomi Fitness

---

## 7. Calendario

Vista mensual unificada de todas las actividades.

### Filtros por Categoría
| Filtro | Color | Qué muestra |
|---|---|---|
| Tareas | 🔵 Azul | Días con tareas con fecha de vencimiento |
| Hábitos | 🟠 Naranjo | Días con hábitos registrados |
| Salud | 🩷 Rosa | Días con registros biométricos |
| Turno | 🟡 Ámbar/Verde | Faena (ámbar) o Descanso (verde) |
| Finanzas | 🟣 Púrpura | Días con ingresos o gastos |

### Navegación
- Flechas para cambiar de mes
- Click en un día para ver detalle
- Panel inferior con lista de eventos del día seleccionado
- Vista de cuadrícula mensual

### Leyenda
Colores explicativos para cada tipo de indicador en los días.

---

## 8. Lectura (Biblioteca)

Seguimiento de lectura con registro detallado.

### Estados
- Quiero leer, Leyendo, Completado, Abandonado

### Características
- Portada, autor y número de páginas
- Progreso página actual / total
- Registro diario de páginas leídas
- Notas y citas por libro con número de página
- Valoración (1–5 estrellas)
- Vinculable a hábito de lectura
- Vinculable a proyecto

---

## 9. Asistente IA (Copilot)

Chat conversacional con inteligencia artificial contextualizada.

### Proveedor
- **Google Gemini 3.1 Flash Lite** (gratuito, 60 req/minuto)
- API key ingresada en Ajustes > Inteligencia Artificial
- Fallback local sin API key

### Contexto que conoce
- Turno actual (día, fase, ubicación)
- Biometría (SpO2, pulso, presión, sueño)
- Tareas pendientes
- Hábitos activos
- Finanzas y cuentas

### Capacidades
- Responder preguntas sobre turno, salud, finanzas y hábitos
- Recomendar rutinas de ejercicio
- Dar consejos para dormir en altitud
- Sugerir acciones basadas en el contexto

### Activación
- Botón flotante "Copilot IA" en esquina inferior derecha
- Modal de chat con historial y sugerencias rápidas

---

## 10. Comandos de Voz

Dictado inteligente para registrar datos sin formularios.

### Comandos Soportados

| Intención | Ejemplo | Acción |
|---|---|---|
| `expense` | *"Gaste 15.000 en supermercado"* | Registra gasto |
| `income` | *"Recibí bono de 50 mil"* | Registra ingreso |
| `health_log` | *"Tengo 98 de saturación y 65 de pulso"* | Registro biométrico |
| `health_log` | *"Presión 120 con 80"* | Registra presión arterial |
| `task` | *"Tarea comprar pasajes para viaje"* | Crea tarea P2 |
| `habit` | *"Crea hábito de leer 20 minutos"* | Crea hábito diario |

### Procesamiento
- Con API key: interpretación vía Gemini (JSON estructurado)
- Sin API key: parseo local con regex (fallback)
- Confirmación antes de guardar
- Retroalimentación visual del resultado

---

## 11. Temporizadores de Enfoque

Temporizador integrado en el Dashboard con 3 modos.

### Modos
| Modo | Duración | Color | Icono |
|---|---|---|---|
| 🍅 Pomodoro | 25 min | Rosa | Cerebro |
| 🧘 Meditación | 10 min | Índigo | Corazón |
| 🏋️ Ejercicio | 15 min | Esmeralda | Pesas |

### Controles
- **Iniciar/Pausar**: Botón circular central
- **Reiniciar**: Vuelve al tiempo del modo seleccionado
- **+5 min / -5 min**: Ajuste rápido de tiempo
- **Selector de modo**: Cambia entre Pomodoro, Meditación y Ejercicio

### Visualización
- Círculo de progreso SVG con animación suave
- Tiempo restante en formato `MM:SS`
- Estado actual: Corriendo / Detenido / Terminado

---

## 12. Notificaciones

Notificaciones locales nativas de Android.

### Canales
| Canal | Propósito |
|---|---|
| `shift_alerts` | Recordatorio de cambio de turno (24h antes) |
| `health_alerts` | Recordatorio diario de chequeo de SpO2 (8 AM) |
| `habit_alerts` | Recordatorios de hábitos personalizados |

### Características
- Notificaciones nativas vía `@capacitor/local-notifications`
- Recordatorios programados en segundo plano
- Modal de configuración para activar/desactivar
- Compatible con Android 12+

---

## 13. Google Calendar

Sincronización de turnos 14×14 con Google Calendar.

### Funcionalidad
- Genera eventos de turno (faena/descanso) para todo el ciclo
- Crea eventos en Google Calendar usando la REST API
- Eventos con título, fecha y descripción del ciclo

### Autenticación
- Usa el token OAuth de Firebase Authentication nativo
- Scope: `https://www.googleapis.com/auth/calendar.events`
- Modal con selección de eventos a sincronizar

---

## 14. Health Connect

Sincronización biométrica con Health Connect de Android.

### Datos Sincronizables
- SpO2 (saturación de oxígeno)
- Frecuencia cardíaca
- Pasos diarios
- Sueño (horas y calidad)
- Presión arterial

### Implementación
- Plugin nativo `@capgo/capacitor-health`
- Modal de sincronización con selección de fechas
- Soporte para dispositivos Xiaomi y Google Fit

---

## 15. Widget Android

Widget de pantalla de inicio con estado de turno.

### Implementación Nativa
- `AppWidgetProvider` en Java (`LifeOSWidget.java`)
- Plugin Capacitor para comunicación bidireccional (`LifeOSWidgetPlugin.java`)
- Actualización vía `AppWidgetManager`

### Visualización
- Fase actual (Faena/Descanso) con icono
- Día del ciclo
- Fecha del próximo cambio

---

## 16. Personalización y Ajustes

Configuración completa de la interfaz y funcionalidades.

### Secciones

| Sección | Opciones |
|---|---|
| **Apariencia** | Modo claro/oscuro, 5 colores de acento, 3 densidades de interfaz |
| **Turno** | Días faena/descanso, fecha ancla, ubicación |
| **Finanzas** | Moneda (CLP/USD/EUR/UF), resumen de cuentas |
| **Salud** | Altitud operativa, meta de agua diaria |
| **Notificaciones** | Configuración de recordatorios (abre modal) |
| **Inteligencia Artificial** | API key de Gemini, funcionalidades IA |
| **Datos** | Exportar/importar JSON, reinicio de fábrica |

### Persistencia
- Preferencias guardadas en localStorage
- Tema oscuro/claro con detección automática
- Color de acento aplicado en tiempo real vía CSS custom properties

---

## 17. Sincronización en la Nube

Sincronización opcional con Firebase/Firestore.

### Autenticación
- Google Sign-In nativo vía `@capacitor-firebase/authentication`
- Login con un clic
- Foto de perfil y nombre mostrados en ajustes

### Datos sincronizables
- Tareas, hábitos, finanzas, libros, salud
- Sincronización manual con botón en ajustes
- Estado de sincronización con spinner

### Firestore
- Cada usuario tiene su propio documento
- Almacenamiento en `users/{uid}/data`

---

## 18. Respaldo y Restauración

Exportación e importación completa de datos.

### Exportar
- Descarga un archivo `.json` con todos los datos:
  - Tareas, hábitos y logs
  - Cuentas, transacciones y presupuestos
  - Libros, lecturas y notas
  - Perfil de salud y logs biométricos
  - Configuración de turno

### Importar
- Carga un archivo `.json` exportado previamente
- Validación de formato
- Recarga automática después de importar

### Reinicio
- Restauración de fábrica: borra todos los datos locales

---

## Tecnologías Utilizadas

| Capa | Tecnología |
|---|---|
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Íconos | Lucide React |
| Mobile | Capacitor 8 (Android) |
| IA | Google Gemini 3.1 Flash Lite (REST API) |
| Auth | Firebase Authentication (nativo) |
| Base de datos | localStorage + Firestore (opcional) |
| Notificaciones | Capacitor Local Notifications |
| Salud | @capgo/capacitor-health (Health Connect) |
| Calendario | Google Calendar REST API |
| Widget | Android AppWidgetProvider (Java) |
| Build | Vite 6, Gradle 8 |

---

*Generado el 28 de julio de 2026 — LifeOS v2.4*
