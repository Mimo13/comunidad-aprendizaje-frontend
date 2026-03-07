// ===== ENUMS =====
export enum UserRole {
  ADMIN = 'ADMIN',
  DIRECTIVA = 'DIRECTIVA', 
  PROFESOR = 'PROFESOR',
  AMPA = 'AMPA',
  FAMILIA = 'FAMILIA'
}

export enum ActivityStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED', 
  COMPLETED = 'COMPLETED'
}

export enum DayOfWeek {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY'
}

export enum NotificationType {
  ONE_DAY_BEFORE = 'ONE_DAY_BEFORE',
  ONE_HOUR_BEFORE = 'ONE_HOUR_BEFORE',
  NEW_ACTIVITY_AVAILABLE = 'NEW_ACTIVITY_AVAILABLE'
}

// ===== INTERFACES DE USUARIO =====
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  permissions?: string[];
  isActive: boolean;
  hasTwoFactor?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserWithCounts extends User {
  _count: {
    enrollments: number;
    createdActivities: number;
    availability: number;
  };
}

// ===== INTERFACES DE ACTIVIDAD =====
export interface Activity {
  id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  subject: string;
  classroom: string;
  classGroup?: string;
  maxHelpers: number;
  teacherName?: string;
  status: ActivityStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  createdById: string;
}

export interface ActivityWithEnrollments extends Activity {
  enrollments: Array<{
    id: string;
    user: User;
    createdAt: string;
  }>;
  availableSpots: number;
  isUserEnrolled: boolean;
}

// ===== INTERFACES DE ARCHIVOS ADJUNTOS =====
export interface FileAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  description?: string;
  uploadedAt: string;
  uploadedBy: string;
  activityId: string;
}

// ===== INTERFACES DE INSCRIPCIÓN =====
export interface Enrollment {
  id: string;
  userId: string;
  activityId: string;
  createdAt: string;
  user: User;
  activity: ActivityWithEnrollments;
}

// ===== INTERFACES DE DISPONIBILIDAD =====
export interface Availability {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// ===== INTERFACES DE NOTIFICACIÓN =====
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  scheduledFor: string;
  sent: boolean;
  sentAt?: string;
  createdAt: string;
  userId: string;
  activityId?: string;
  activity?: Activity;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description?: string;
  type: 'NATIONAL' | 'REGIONAL' | 'LOCAL';
  createdAt: string;
  updatedAt: string;
}

// ===== INTERFACES DE API =====
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginationResponse<T> {
  activities: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// ===== INTERFACES DE FORMULARIOS =====
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  name: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface ActivityForm {
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  startTime?: string; // Mantener como opcional por compatibilidad
  endTime?: string;   // Mantener como opcional por compatibilidad
  subject: string;
  classroom: string;
  classGroup: string;
  maxHelpers: number;
  teacherName?: string;
}

export interface AvailabilityForm {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface ProfileForm {
  name: string;
  phone?: string;
}

export interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ===== INTERFACES DE FILTROS =====
export interface ActivityFilters {
  date?: string;
  fromDate?: string;
  toDate?: string;
  subject?: string;
  classroom?: string;
  status?: ActivityStatus | string; // Permitir string para 'ALL', 'NON_CANCELLED' o listas
  createdById?: string;
  page?: number;
  limit?: number;
}

// ===== INTERFACES DE ESTADÍSTICAS =====
export interface DashboardStats {
  totalActivities: number;
  activeActivities: number;
  userEnrollments: number;
  availableActivities: number;
  upcomingActivities: Array<{
    id: string;
    title: string;
    date: string;
    subject: string;
    availableSpots: number;
  }>;
}

// ===== INTERFACES DE CONFIGURACIÓN =====
export interface AppConfig {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

export interface NotificationSettings {
  oneDayBefore: boolean;
  oneHourBefore: boolean;
  newActivitiesInAvailableHours: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

// ===== INTERFACES DE PWA =====
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// ===== CONSTANTES =====
export const USER_ROLE_LABELS = {
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.DIRECTIVA]: 'Directiva',
  [UserRole.PROFESOR]: 'Profesor',
  [UserRole.AMPA]: 'AMPA',
  [UserRole.FAMILIA]: 'Familia'
} as const;

export const ACTIVITY_STATUS_LABELS = {
  [ActivityStatus.ACTIVE]: 'Activa',
  [ActivityStatus.CANCELLED]: 'Cancelada',
  [ActivityStatus.COMPLETED]: 'Completada'
} as const;

export const DAY_OF_WEEK_LABELS = {
  [DayOfWeek.SUNDAY]: 'Domingo',
  [DayOfWeek.MONDAY]: 'Lunes',
  [DayOfWeek.TUESDAY]: 'Martes',
  [DayOfWeek.WEDNESDAY]: 'Miércoles',
  [DayOfWeek.THURSDAY]: 'Jueves',
  [DayOfWeek.FRIDAY]: 'Viernes',
  [DayOfWeek.SATURDAY]: 'Sábado'
} as const;

// ===== TIPOS DE UTILIDAD =====
export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalField<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ===== INTERFACES DE CONTEXTO/STORE =====
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AppState {
  theme: 'light' | 'dark';
  language: 'es' | 'en';
  notifications: Notification[];
  isOnline: boolean;
  lastSync?: string;
}
