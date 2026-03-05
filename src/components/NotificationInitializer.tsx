import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { pushNotificationService } from '@/services/notificationService';

const NotificationInitializer = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    const initService = async () => {
      if (user && 'Notification' in window && 'serviceWorker' in navigator) {
        try {
          // Inicializar servicio (registrar Service Worker) sin solicitar permisos
          await pushNotificationService.initialize(false);
          
          // No intentamos suscripción automática para respetar UX.
          // El usuario debe activarlas explícitamente desde Ajustes.
        } catch (error) {
          console.error('Error al inicializar servicio de notificaciones:', error);
        }
      }
    };

    initService();
  }, [user]);

  return null;
};

export default NotificationInitializer;