# LifeOS

LifeOS es una aplicación personal para organizar la vida alrededor de turnos laborales 14×14, con foco en productividad, hábitos, finanzas, salud, calendario y asistencia con IA.

El proyecto utiliza React + TypeScript para la interfaz, un servidor Express para endpoints locales/IA, Capacitor para Android y Firebase para autenticación/sincronización opcional.

## Estado

Proyecto activo en desarrollo. La aplicación ya contiene módulos funcionales y una integración Android mediante Capacitor. La lista detallada de funcionalidades actuales se mantiene en [`FUNCIONALIDADES.md`](./FUNCIONALIDADES.md).

## Funcionalidades principales

- Dashboard diario adaptado al ciclo de turno.
- Gestión de tareas y prioridades.
- Seguimiento de hábitos y rachas.
- Finanzas personales, cuentas y presupuestos.
- Registro de salud y biometría.
- Calendario y sincronización con Google Calendar.
- Biblioteca y seguimiento de lectura.
- LifeOS Copilot y funciones de IA con Gemini.
- Comandos de voz.
- Temporizadores de enfoque.
- Notificaciones locales.
- Health Connect en Android.
- Respaldo, restauración y sincronización con Firebase.

## Stack

- React 19
- TypeScript
- Vite
- Express
- Capacitor 8 / Android
- Firebase Authentication + Firestore
- Google Gemini API
- Tailwind CSS
- Recharts

## Estructura general

```text
LifeOS/
├── src/                    # Aplicación React
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── lib/
│   ├── types/
│   └── utils/
├── functions/              # Funciones/backend Firebase cuando corresponda
├── android/                # Proyecto Android generado/integraciones nativas
├── server.ts               # Servidor Express y endpoints de IA
├── firestore.rules         # Reglas de seguridad de Firestore
├── capacitor.config.ts     # Configuración Capacitor
├── FUNCIONALIDADES.md      # Inventario funcional detallado
└── docs/                   # Arquitectura, roadmap y decisiones
```

Para una descripción técnica más detallada, ver [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Desarrollo local

### Requisitos

- Node.js
- npm
- Android Studio + JDK, solo si se trabajará en la aplicación Android

### Gestor de paquetes

**npm es el gestor de paquetes oficial de LifeOS.** `package-lock.json` es el único lockfile que debe versionarse y es la fuente de verdad para instalaciones reproducibles.

Usa `npm ci` para instalaciones limpias/CI y `npm install` cuando necesites modificar dependencias. No generes lockfiles de otros gestores de paquetes en el repositorio.

### Instalación

```bash
npm install
```

Crea un archivo `.env` o `.env.local` a partir de `.env.example` y configura las variables necesarias. Nunca subas claves reales al repositorio.

### Ejecutar en desarrollo

```bash
npm run dev
```

El servidor de desarrollo expone la aplicación y los endpoints locales definidos en `server.ts`.

### Validación TypeScript

```bash
npm run lint
```

### Build web/servidor

```bash
npm run build
npm start
```

### Android / Capacitor

```bash
npm run cap:sync
npm run cap:open
```

Para preparar web + Capacitor:

```bash
npm run cap:build
```

## Integración continua

GitHub Actions ejecuta el workflow `.github/workflows/ci.yml` en cada Pull Request hacia `main` y en cada push a `main`.

El job utiliza Node.js 22 y valida, en este orden:

```bash
npm ci
npm run lint
npm run build
```

Un Pull Request no debe integrarse si este workflow falla. Las instalaciones de CI deben utilizar `npm ci` y el `package-lock.json` versionado.

## Variables de entorno

Consulta [`.env.example`](./.env.example).

Actualmente el servidor utiliza, entre otras:

- `GEMINI_API_KEY`: acceso del backend a Gemini.
- `APP_URL`: URL pública/base de la aplicación cuando sea necesaria.

Las credenciales reales deben mantenerse fuera de Git.

## Firebase y datos

Las reglas actuales de Firestore restringen el acceso de cada usuario a su propio árbol `users/{userId}` mediante autenticación Firebase.

Antes de modificar modelo de datos, autenticación o reglas de Firestore, documentar el cambio y revisar su impacto en sincronización y compatibilidad de datos.

## Salud e IA

LifeOS muestra y procesa información de salud y puede utilizar IA para generar recomendaciones. Estas funciones deben tratarse como apoyo informativo y de organización, no como diagnóstico médico. Los umbrales, mensajes de seguridad y recomendaciones relacionadas con salud deben revisarse y probarse explícitamente antes de una publicación.

## Flujo de trabajo

Para cambios nuevos:

1. Crear o vincular un Issue.
2. Crear una rama `feature/...`, `fix/...`, `docs/...` o equivalente.
3. Implementar y validar el cambio.
4. Abrir un Pull Request hacia `main`.
5. Revisar impacto, pruebas y documentación antes de hacer merge.

`main` debe representar el estado estable del proyecto.

## Roadmap

El plan de saneamiento y evolución está en [`docs/ROADMAP.md`](./docs/ROADMAP.md).

## Documentación

- [`FUNCIONALIDADES.md`](./FUNCIONALIDADES.md): inventario funcional completo.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md): arquitectura técnica.
- [`docs/ROADMAP.md`](./docs/ROADMAP.md): prioridades de desarrollo y deuda técnica.
