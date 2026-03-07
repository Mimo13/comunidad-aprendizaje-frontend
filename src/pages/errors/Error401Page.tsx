import AppErrorView from '@/components/error/AppErrorView';

const Error401Page = () => (
  <AppErrorView
    code="401"
    title="Sesion expirada"
    description="Tu sesion ha caducado o no has iniciado sesion. Vuelve a autenticarte para continuar."
    primaryLabel="Ir a login"
    primaryTo="/login"
    showBackHome={false}
  />
);

export default Error401Page;
