import AppErrorView from '@/components/error/AppErrorView';

const ErrorOfflinePage = () => (
  <AppErrorView
    code="OFFLINE"
    title="Sin conexion"
    description="No hay conexion a internet en este momento. Comprueba tu red y vuelve a intentarlo."
  />
);

export default ErrorOfflinePage;
