import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { sanitizePersistedState } from './lib/storageRecovery';
import './lib/syncProbe';
import './index.css';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Error desconocido al iniciar LifeOS.';

const StartupFallback = ({ error }: { error: unknown }) => {
  const resetLocalData = () => {
    const confirmed = window.confirm(
      'Esto eliminará solamente los datos locales de LifeOS en este navegador. Los datos sincronizados en la nube no se eliminarán. ¿Continuar?'
    );
    if (!confirmed) return;

    localStorage.removeItem('lifeos_local_v1');
    localStorage.removeItem('lifeos_widget_config');
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <section className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-widest text-amber-400">LifeOS · recuperación</p>
        <h1 className="mt-2 text-2xl font-extrabold">No se pudo iniciar la aplicación</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          El sitio está disponible, pero ocurrió un error al cargar la aplicación en este navegador.
        </p>
        <pre className="mt-4 max-h-40 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-rose-300 whitespace-pre-wrap">
          {getErrorMessage(error)}
        </pre>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950"
          >
            Recargar
          </button>
          <button
            onClick={resetLocalData}
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200"
          >
            Restablecer datos locales
          </button>
        </div>
      </section>
    </main>
  );
};

class StartupErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('LifeOS render error:', error, info);
  }

  render() {
    if (this.state.error) return <StartupFallback error={this.state.error} />;
    return this.props.children;
  }
}

async function bootstrap() {
  sanitizePersistedState();

  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('No se encontró el contenedor raíz de LifeOS.');

  const root = createRoot(rootElement);

  try {
    const { default: App } = await import('./App.tsx');
    root.render(
      <StrictMode>
        <StartupErrorBoundary>
          <App />
        </StartupErrorBoundary>
      </StrictMode>,
    );
  } catch (error) {
    console.error('LifeOS startup error:', error);
    root.render(<StartupFallback error={error} />);
  }
}

void bootstrap();
