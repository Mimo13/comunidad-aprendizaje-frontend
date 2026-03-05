import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { lazy, Suspense, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

// Componentes base
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from './LoadingSpinner';

// Lazy load de páginas pesadas
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ActivitiesPage = lazy(() => import('@/pages/ActivitiesPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

// Lazy load de páginas de admin (las más pesadas)
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminSubjectsPage = lazy(() => import('@/pages/admin/AdminSubjectsPage'));
const AdminHolidaysPage = lazy(() => import('@/pages/admin/AdminHolidaysPage'));
const AdminClassroomsPage = lazy(() => import('@/pages/admin/AdminClassroomsPage'));
const AdminRolesPage = lazy(() => import('@/pages/admin/AdminRolesPage'));
const AdminStatsPage = lazy(() => import('@/pages/admin/AdminStatsPage'));
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'));

const AnimatedRoutes = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  
  const prefetch = (promises: Promise<any>[]) => {
    promises.forEach(p => p.catch(() => {}));
  };
  
  useEffect(() => {
    if (!isAuthenticated) return;
    const p = location.pathname;
    if (p.startsWith('/dashboard')) {
      prefetch([
        import('@/pages/ActivitiesPage'),
        import('@/pages/NotificationsPage'),
        import('@/pages/SettingsPage'),
      ]);
    } else if (p.startsWith('/activities')) {
      prefetch([
        import('@/pages/DashboardPage'),
        import('@/pages/NotificationsPage'),
        import('@/pages/SettingsPage'),
      ]);
    } else if (p.startsWith('/notifications')) {
      prefetch([
        import('@/pages/DashboardPage'),
        import('@/pages/ActivitiesPage'),
        import('@/pages/SettingsPage'),
      ]);
    } else if (p.startsWith('/settings')) {
      prefetch([
        import('@/pages/admin/AdminUsersPage'),
        import('@/pages/admin/AdminSubjectsPage'),
        import('@/pages/admin/AdminHolidaysPage'),
        import('@/pages/admin/AdminClassroomsPage'),
        import('@/pages/admin/AdminRolesPage'),
        import('@/pages/admin/AdminStatsPage'),
        import('@/pages/admin/ReportsPage'),
      ]);
    }
  }, [isAuthenticated, location.pathname]);

  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password'].some(path => location.pathname.startsWith(path));
  const animationKey = isAuthRoute ? location.pathname : 'app-shell';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={animationKey}
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={<LoadingSpinner />}>
          <Routes location={location}>
            {/* Rutas públicas */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
              } 
            />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route 
              path="/register" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
              } 
            />
            
            {/* Rutas protegidas */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="activities" element={<ActivitiesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              
              {/* Rutas de Administración */}
              <Route path="admin/users" element={<AdminUsersPage />} />
              <Route path="admin/subjects" element={<AdminSubjectsPage />} />
              <Route path="admin/holidays" element={<AdminHolidaysPage />} />
              <Route path="admin/classrooms" element={<AdminClassroomsPage />} />
              <Route path="admin/roles" element={<AdminRolesPage />} />
              <Route path="admin/stats" element={<AdminStatsPage />} />
              <Route path="admin/reports" element={<ReportsPage />} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
            
            {/* Ruta por defecto */}
            <Route 
              path="*" 
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
            />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
