import AppErrorView from '@/components/error/AppErrorView';

const Error403Page = () => (
  <AppErrorView
    code="403"
    title="Acceso denegado"
    description="No tienes permisos para acceder a este recurso. Si crees que es un error, revisa tu perfil de permisos."
  />
);

export default Error403Page;
