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
  { key: 'ACTIVITY_HEATMAP_WIDGET', label: 'Widget Actividad Curso', description: 'Visualización de calor de actividad en el panel de inicio' },
  { key: 'ACTIVITY_CHART_WIDGET', label: 'Widget Evolución Actividades', description: 'Visualización de gráfica de evolución en el panel de inicio' },
  { key: 'AVAILABILITY_WIDGET', label: 'Widget Disponibilidad', description: 'Visualización de disponibilidad en el panel de inicio' },
];
