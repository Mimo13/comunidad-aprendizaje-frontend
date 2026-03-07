import AppErrorView from '@/components/error/AppErrorView';

const Error404Page = () => (
  <AppErrorView
    code="404"
    title="Pagina no encontrada"
    description="La ruta que has solicitado no existe o ya no esta disponible."
  />
);

export default Error404Page;
