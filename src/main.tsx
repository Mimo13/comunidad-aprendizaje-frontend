import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';
import App from './App.tsx';
import { sentryFilter } from './utils/sentryFilter';
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

// Configurar Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring.
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  // Environment
  environment: import.meta.env.MODE || 'development',
  // Release
  release: import.meta.env.VITE_APP_VERSION,
  beforeSend: sentryFilter.beforeSend,
});

// Configurar Service Worker para PWA solo en producción
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegistered(r?: ServiceWorkerRegistration) {
      console.log('✅ Service Worker registrado correctamente:', r);
      if (r) {
        r.update().catch(err => console.error('Error al actualizar SW:', err));
      }
    },
    onRegisterError(error: any) {
      console.error('❌ Error al registrar Service Worker:', error);
    },
    onNeedRefresh() {
      if (confirm('Nueva versión disponible. ¿Recargar la aplicación?')) {
        window.location.reload();
      }
    },
    onOfflineReady() {
      console.log('App lista para trabajar offline');
    },
  });
}

// Configurar notificaciones push si están disponibles
// if ('Notification' in window && 'serviceWorker' in navigator) {
//   // Verificar permisos de notificaciones al cargar
//   if (Notification.permission === 'default') {
//     console.log('Permisos de notificación no configurados');
//   }
// }

// Configurar medidas offline
window.addEventListener('online', () => {
  console.log('🟢 Conectado a internet');
  // Aquí podrías sincronizar datos pendientes
});

window.addEventListener('offline', () => {
  console.log('🔴 Sin conexión a internet');
});

// Manejo de errores globales
window.addEventListener('error', (event) => {
  console.error('Error global capturado:', event.error);
  Sentry.captureException(event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rechazada no manejada:', event.reason);
  Sentry.captureException(event.reason);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={({ error, resetError }: { error: unknown; resetError: () => void }) => (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>¡Ups! Algo salió mal</h1>
        <p>Lo sentimos, ha ocurrido un error inesperado.</p>
        <details style={{ whiteSpace: 'pre-wrap' }}>
          {import.meta.env.MODE === 'development' && String(error)}
        </details>
        <button onClick={resetError}>Recargar página</button>
      </div>
    )}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
