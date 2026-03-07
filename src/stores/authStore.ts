import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, AuthState, LoginForm, RegisterForm } from '@/types';
import { authService } from '@/services/api';

interface AuthActions {
  login: (credentials: LoginForm) => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateUser: (user: User) => void;
  updateProfile: (data: { name: string; phone: string }) => Promise<void>;
  setLoading: (loading: boolean) => void;
}

interface AuthStore extends AuthState, AuthActions {}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Acciones
      login: async (credentials: LoginForm) => {
        try {
          set({ isLoading: true });
          
          const response = await authService.login(credentials);
          
          if (response.success && response.data) {
            const { user } = response.data as any;
            
            // Actualizar estado
            set({
              user,
              token: null,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.message || 'Error en el login');
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.response?.data?.message || error.message || 'Error de conexión');
        }
      },

      register: async (data: RegisterForm) => {
        try {
          set({ isLoading: true });
          
          const response = await authService.register(data);
          
          if (response.success && response.data) {
            const { user } = response.data as any;
            
            // Actualizar estado
            set({
              user,
              token: null,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.message || 'Error en el registro');
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.response?.data?.message || error.message || 'Error de conexión');
        }
      },

      logout: async () => {
        const { isAuthenticated } = get();
        if (isAuthenticated) {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
        }
        
        // Limpiar estado
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      loadUser: async () => {
        try {
          set({ isLoading: true });
          
          const response = await authService.me();
          
          if (response.success && response.data) {
            set({
              user: response.data,
              token: null,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error: any) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateUser: (user: User) => {
        set({ user });
      },

      updateProfile: async (data: { name: string; phone: string }) => {
        try {
          set({ isLoading: true });
          
          const response = await authService.updateProfile(data);
          
          if (response.success && response.data) {
            set({ 
              user: response.data,
              isLoading: false 
            });
          } else {
            throw new Error(response.message || 'Error al actualizar perfil');
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.response?.data?.message || error.message || 'Error al actualizar perfil');
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      // Solo persistir datos básicos, no acciones
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Hook personalizado para verificar permisos
export const usePermissions = () => {
  const { user } = useAuthStore();
  
  const hasRole = (role: string) => user?.role === role;
  
  const hasAnyRole = (roles: string[]) => 
    user ? roles.includes(user.role) : false;
  
  const canAccess = (moduleKey: string) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    const normalizedPermissions = (user.permissions || []).map((permission) => String(permission).toUpperCase());
    const target = moduleKey.toUpperCase();
    if (normalizedPermissions.includes(target)) return true;

    // Compatibilidad legacy: DASHBOARD habilita los widgets del panel de inicio.
    if (
      normalizedPermissions.includes('DASHBOARD') &&
      ['ACTIVITY_HEATMAP_WIDGET', 'ACTIVITY_CHART_WIDGET', 'AVAILABILITY_WIDGET'].includes(target)
    ) {
      return true;
    }

    return false;
  };

  const canCreateActivities = () => 
    canAccess('create_activity');
  
  const canEnrollInActivities = () => 
    canAccess('enroll_activity');
  
  const canManageUsers = () => 
    canAccess('view_all_users');
  
  const canManageSettings = () => 
    hasRole('ADMIN'); // Settings sigue siendo exclusivo de admin por ahora

  return {
    user,
    hasRole,
    hasAnyRole,
    canAccess,
    canCreateActivities,
    canEnrollInActivities,
    canManageUsers,
    canManageSettings,
  };
};
