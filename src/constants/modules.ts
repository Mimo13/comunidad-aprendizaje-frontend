export interface AppModule {
  key: string;
  label: string;
  description: string;
}

export const APP_MODULES: AppModule[] = [
  { key: 'ACTIVITIES', label: 'Actividades', description: 'Ver y gestionar actividades y calendario' },
  { key: 'USERS', label: 'Usuarios', description: 'Administración de usuarios y familias' },
  { key: 'ROLES', label: 'Perfiles', description: 'Gestión de roles y permisos de acceso' },
  { key: 'SUBJECTS', label: 'Asignaturas', description: 'Catálogo de asignaturas y colores' },
  { key: 'CLASSROOMS', label: 'Aulas', description: 'Catálogo de espacios y aulas' },
  { key: 'CLASSES', label: 'Clases', description: 'Catálogo de grupos y clases escolares' },
  { key: 'TIME_SLOTS', label: 'Horarios', description: 'Configuración de tramos horarios' },
  { key: 'HOLIDAYS', label: 'Festivos', description: 'Calendario de días festivos' },
];
