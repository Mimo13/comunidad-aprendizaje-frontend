import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  User,
  Activity,
  ActivityWithEnrollments,
  Enrollment,
  Availability,
  LoginForm,
  RegisterForm,
  ActivityForm,
  ActivityFilters,
  ApiResponse,
  PaginationResponse,
  DashboardStats,
  ProfileForm,
  ChangePasswordForm,
  AvailabilityForm,
  FileAttachment
} from '@/types';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Crear instancia de Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== INTERCEPTORS =====

// Request interceptor - añadir token de autenticación
apiClient.interceptors.request.use(
  (config) => {
    const rawEmail = (config.data as any)?.email;
    if (typeof rawEmail === 'string') {
      (config.data as any).email = rawEmail.trim();
    }
    // Cookies HttpOnly gestionan la autenticación; no añadimos Authorization aquí
    
    // Log de requests en desarrollo
    if (import.meta.env.DEV) {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Variable para controlar si ya estamos refrescando el token
let isRefreshing = false;
let failedQueue: any[] = [];

// Detectar si el store persistido indica sesión activa
const hasActiveSession = (): boolean => {
  try {
    const raw = localStorage.getItem('auth-store');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed?.state?.isAuthenticated;
  } catch {
    return false;
  }
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor - manejo de errores globales
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Evitar loop infinito si falla el refresh token
    if (originalRequest.url.includes('/auth/refresh-token')) {
      return Promise.reject(error);
    }
    // No intentar refresh en rutas públicas de auth (login/register/forgot/reset/verify)
    if (
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/register') ||
      originalRequest.url.includes('/auth/forgot-password') ||
      originalRequest.url.includes('/auth/reset-password') ||
      originalRequest.url.includes('/2fa/verify')
    ) {
      return Promise.reject(error);
    }
    // No intentar refresh cuando falla la comprobación de sesión (/auth/me)
    if (originalRequest.url.includes('/auth/me')) {
      return Promise.reject(error);
    }
    // Si aún no hay sesión activa, no intentes refresh
    if (!hasActiveSession()) {
      return Promise.reject(error);
    }

    // Si el token es inválido (401) y no hemos reintentado aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({resolve, reject});
        }).then(() => {
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await authService.refreshToken();
        
        if (response.success && response.data) {
          processQueue(null, null);
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh token failed');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        handleLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    console.error('❌ API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

const handleLogout = async () => {
  await apiClient.post('/auth/logout').catch(() => {});
  localStorage.removeItem('user');
  localStorage.removeItem('auth-store');
  
  if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && !window.location.pathname.includes('/reset-password')) {
    window.location.href = '/login';
  }
};

// ===== SERVICIOS DE AUTENTICACIÓN =====
export const authService = {
  /**
   * Registrar nuevo usuario
   */
  register: (data: RegisterForm): Promise<ApiResponse<{ user: User }>> =>
    apiClient.post('/auth/register', data).then(res => res.data),

  /**
   * Iniciar sesión
   */
  login: (data: LoginForm): Promise<ApiResponse<{ user: User }>> =>
    apiClient.post('/auth/login', data).then(res => res.data),

  /**
   * Obtener perfil del usuario autenticado
   */
  getProfile: (): Promise<ApiResponse<User>> =>
    apiClient.get('/auth/profile').then(res => res.data),
  /**
   * Obtener perfil (cookies)
   */
  me: (): Promise<ApiResponse<User>> =>
    apiClient.get('/auth/me').then(res => res.data),

  /**
   * Actualizar perfil del usuario
   */
  updateProfile: (data: ProfileForm): Promise<ApiResponse<User>> =>
    apiClient.put('/auth/profile', data).then(res => res.data),

  /**
   * Cambiar contraseña
   */
  changePassword: (data: ChangePasswordForm): Promise<ApiResponse> =>
    apiClient.post('/auth/change-password', data).then(res => res.data),

  /**
   * Solicitar recuperación de contraseña
   */
  forgotPassword: (email: string): Promise<ApiResponse> =>
    apiClient.post('/auth/forgot-password', { email }).then(res => res.data),

  /**
   * Restablecer contraseña con token
   */
  resetPassword: (token: string, password: string): Promise<ApiResponse> =>
    apiClient.post(`/auth/reset-password/${token}`, { password }).then(res => res.data),

  /**
   * Refrescar token de acceso
   */
  refreshToken: (): Promise<ApiResponse<{ message: string }>> =>
    apiClient.post('/auth/refresh-token').then(res => res.data),
};

// ===== SERVICIOS DE ACTIVIDADES =====
export const activityService = {
  /**
   * Obtener lista de actividades con filtros opcionales
   */
  getActivities: (filters?: ActivityFilters): Promise<ApiResponse<PaginationResponse<ActivityWithEnrollments>>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    return apiClient.get(`/activities?${params.toString()}`).then(res => res.data);
  },

  /**
   * Obtener actividad por ID
   */
  getActivityById: (id: string): Promise<ApiResponse<ActivityWithEnrollments>> =>
    apiClient.get(`/activities/${id}`).then(res => res.data),

  /**
   * Crear nueva actividad
   */
  createActivity: (data: ActivityForm): Promise<ApiResponse<ActivityWithEnrollments>> =>
    apiClient.post('/activities', data).then(res => res.data),

  /**
   * Actualizar actividad
   */
  updateActivity: (id: string, data: Partial<ActivityForm>): Promise<ApiResponse<ActivityWithEnrollments>> =>
    apiClient.put(`/activities/${id}`, data).then(res => res.data),

  /**
   * Eliminar actividad
   */
  deleteActivity: (id: string): Promise<ApiResponse> =>
    apiClient.delete(`/activities/${id}`).then(res => res.data),

  /**
   * Subir archivo adjunto a una actividad
   */
  uploadFile: (activityId: string, formData: FormData): Promise<ApiResponse<FileAttachment>> =>
    apiClient.post(`/activities/${activityId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data),

  /**
   * Obtener archivos adjuntos de una actividad
   */
  getActivityFiles: (activityId: string): Promise<ApiResponse<FileAttachment[]>> =>
    apiClient.get(`/activities/${activityId}/files`).then(res => res.data),

  /**
   * Descargar archivo adjunto
   */
  downloadFile: (fileId: string): Promise<Blob> =>
    apiClient.get(`/activities/files/${fileId}/download`, {
      responseType: 'blob',
    }).then(res => res.data),

  /**
   * Eliminar archivo adjunto
   */
  deleteFile: (fileId: string): Promise<ApiResponse> =>
    apiClient.delete(`/activities/files/${fileId}`).then(res => res.data),

  /**
   * Obtener URL de Google Calendar para una actividad
   */
  getGoogleCalendarUrl: (activityId: string): Promise<ApiResponse<{ url: string }>> =>
    apiClient.get(`/activities/${activityId}/calendar/google`).then(res => res.data),

  /**
   * Obtener URL de Outlook Calendar para una actividad
   */
  getOutlookCalendarUrl: (activityId: string): Promise<ApiResponse<{ url: string }>> =>
    apiClient.get(`/activities/${activityId}/calendar/outlook`).then(res => res.data),
};

// ===== SERVICIOS DE INSCRIPCIONES =====
export const enrollmentService = {
  /**
   * Obtener inscripciones del usuario autenticado
   */
  getMyEnrollments: (filters?: { status?: string; upcoming?: boolean }): Promise<ApiResponse<Enrollment[]>> => {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.upcoming) params.append('upcoming', 'true');
    
    return apiClient.get(`/enrollments/my-enrollments?${params.toString()}`).then(res => res.data);
  },

  /**
   * Inscribirse en una actividad
   */
  enrollInActivity: (activityId: string): Promise<ApiResponse<Enrollment>> =>
    apiClient.post(`/enrollments/activities/${activityId}/enroll`).then(res => res.data),

  enrollUserInActivity: (activityId: string, userId: string): Promise<ApiResponse> =>
    apiClient.post(`/enrollments/activities/${activityId}/enroll-user`, { userId }).then(res => res.data),

  /**
   * Cancelar inscripción en una actividad (propia)
   */
  unenrollFromActivity: (activityId: string): Promise<ApiResponse> =>
    apiClient.delete(`/enrollments/activities/${activityId}/unenroll`).then(res => res.data),

  /**
   * Obtener inscripciones de una actividad (solo para admin/directiva/creador)
   */
  getActivityEnrollments: (activityId: string): Promise<ApiResponse<Enrollment[]>> =>
    apiClient.get(`/enrollments/activities/${activityId}/enrollments`).then(res => res.data),

  /**
   * NUEVO: Cancelar una inscripción por id (ADMIN/AMPA/DIRECTIVA o creador)
   */
  cancelEnrollment: (enrollmentId: string): Promise<ApiResponse> =>
    apiClient.delete(`/enrollments/${enrollmentId}`).then(res => res.data),
};

// ===== SERVICIOS DE DISPONIBILIDAD =====
export const availabilityService = {
  /**
   * Obtener disponibilidad del usuario
   */
  getMyAvailability: (): Promise<ApiResponse<Availability[]>> =>
    apiClient.get('/availability/my-availability').then(res => res.data),

  /**
   * Crear disponibilidad
   */
  createAvailability: (data: AvailabilityForm): Promise<ApiResponse<Availability>> =>
    apiClient.post('/availability', data).then(res => res.data),

  /**
   * Actualizar disponibilidad
   */
  updateAvailability: (id: string, data: Partial<AvailabilityForm>): Promise<ApiResponse<Availability>> =>
    apiClient.put(`/availability/${id}`, data).then(res => res.data),

  /**
   * Eliminar disponibilidad
   */
  deleteAvailability: (id: string): Promise<ApiResponse> =>
    apiClient.delete(`/availability/${id}`).then(res => res.data),
};

// ===== SERVICIOS DE DASHBOARD/ESTADÍSTICAS =====
export const dashboardService = {
  /**
   * Obtener estadísticas del dashboard
   */
  getStats: (): Promise<ApiResponse<DashboardStats>> =>
    apiClient.get('/dashboard/stats').then(res => res.data),
};

// ===== SERVICIOS DE FESTIVOS =====
export const holidayService = {
  /**
   * Obtener lista de festivos
   */
  getHolidays: (): Promise<ApiResponse<any[]>> =>
    apiClient.get('/holidays').then(res => res.data),

  createHoliday: (data: { name: string; date: string; description?: string; type?: 'NATIONAL' | 'REGIONAL' | 'LOCAL' }): Promise<ApiResponse<any>> =>
    apiClient.post('/holidays', data).then(res => res.data),

  deleteHoliday: (id: string): Promise<ApiResponse> =>
    apiClient.delete(`/holidays/${id}`).then(res => res.data),
};

// ===== SERVICIOS DE ESTADÍSTICAS =====
export const statsService = {
  getHeatmapStats: (): Promise<ApiResponse<any[]>> => 
    apiClient.get('/stats/heatmap').then(res => res.data),
    
  getGeneralStats: (): Promise<ApiResponse<any>> => 
    apiClient.get('/stats/general').then(res => res.data),
    
  getTopVolunteers: (): Promise<ApiResponse<any[]>> => 
    apiClient.get('/stats/top-volunteers').then(res => res.data),
};

// ===== SERVICIOS DE USUARIOS (ADMIN) =====
export const userService = {
  getAllUsers: (filters?: { roles?: string[] }): Promise<ApiResponse<User[]>> => {
    let url = '/users';
    if (filters?.roles && filters.roles.length > 0) {
      url += `?roles=${filters.roles.join(',')}`;
    }
    return apiClient.get(url).then(res => res.data);
  },
    
  createUser: (data: Partial<User> & { password: string }): Promise<ApiResponse<User>> =>
    apiClient.post('/users', data).then(res => res.data),
    
  updateUser: (id: string, data: Partial<User> & { password?: string }): Promise<ApiResponse<User>> =>
    apiClient.put(`/users/${id}`, data).then(res => res.data),

  disableUserTwoFactor: (id: string): Promise<ApiResponse> =>
    apiClient.post(`/users/${id}/2fa/disable`).then(res => res.data),
    
  deleteUser: (id: string): Promise<ApiResponse> =>
    apiClient.delete(`/users/${id}`).then(res => res.data),
};

// ===== SERVICIOS DE ASIGNATURAS =====
export const subjectService = {
  getAllSubjects: (): Promise<ApiResponse<any[]>> =>
    apiClient.get('/subjects').then(res => res.data),

  createSubject: (data: { name: string; color?: string }): Promise<ApiResponse<any>> =>
    apiClient.post('/subjects', data).then(res => res.data),

  updateSubject: (id: string, data: { name: string; color?: string }): Promise<ApiResponse<any>> =>
    apiClient.put(`/subjects/${id}`, data).then(res => res.data),

  deleteSubject: (id: string): Promise<ApiResponse> =>
    apiClient.delete(`/subjects/${id}`).then(res => res.data),
};

// ===== SERVICIOS DE AULAS =====
export const classroomService = {
  getAllClassrooms: (): Promise<ApiResponse<any[]>> =>
    apiClient.get('/classrooms').then(res => res.data),

  createClassroom: (data: { name: string }): Promise<ApiResponse<any>> =>
    apiClient.post('/classrooms', data).then(res => res.data),

  deleteClassroom: (id: string): Promise<ApiResponse> =>
    apiClient.delete(`/classrooms/${id}`).then(res => res.data),
};

// ===== SERVICIOS DE CLASES (GRUPOS) =====
export const classService = {
  getAllClasses: (): Promise<ApiResponse<any[]>> =>
    apiClient.get('/classes').then(res => res.data),

  createClass: (data: { name: string }): Promise<ApiResponse<any>> =>
    apiClient.post('/classes', data).then(res => res.data),

  updateClass: (id: string, data: { name: string }): Promise<ApiResponse<any>> =>
    apiClient.put(`/classes/${id}`, data).then(res => res.data),

  deleteClass: (id: string): Promise<ApiResponse> =>
    apiClient.delete(`/classes/${id}`).then(res => res.data),
};

// ===== SERVICIOS DE ROLES =====
export const roleService = {
  getAllRoles: (): Promise<ApiResponse<any[]>> =>
    apiClient.get('/roles').then(res => res.data),

  createRole: (data: { name: string; description?: string; color?: string }): Promise<ApiResponse<any>> =>
    apiClient.post('/roles', data).then(res => res.data),

  updateRole: (id: string, data: { name?: string; description?: string; color?: string }): Promise<ApiResponse<any>> =>
    apiClient.put(`/roles/${id}`, data).then(res => res.data),

  deleteRole: (id: string): Promise<ApiResponse> =>
    apiClient.delete(`/roles/${id}`).then(res => res.data),
};

// ===== SERVICIOS DE TRAMOS HORARIOS =====
export const timeSlotService = {
  getAllTimeSlots: (): Promise<ApiResponse<any[]>> =>
    apiClient.get('/timeslots').then(res => res.data),
};

// ===== UTILIDADES =====

/**
 * Health check del API
 */
export const healthCheck = (): Promise<any> =>
  axios.get(`${API_BASE_URL.replace('/api', '')}/health`).then(res => res.data);

/**
 * Configurar token de autenticación
 */
export const setAuthToken = (_token: string) => { return; };

/**
 * Limpiar token de autenticación
 */
export const clearAuthToken = () => {
  localStorage.removeItem('user');
};

/**
 * Obtener token actual
 */
export const getAuthToken = (): string | null => null;

/**
 * Verificar si el usuario está autenticado
 */
export const isAuthenticated = (): boolean => true;

export default apiClient;
