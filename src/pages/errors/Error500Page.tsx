import AppErrorView from '@/components/error/AppErrorView';

const Error500Page = () => (
  <AppErrorView
    code="500"
    title="Error interno"
    description="Ha ocurrido un problema en el servidor. Estamos trabajando para resolverlo."
  />
);

export default Error500Page;
