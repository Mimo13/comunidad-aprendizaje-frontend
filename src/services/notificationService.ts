import { ApiResponse } from '@/types';
import axios from 'axios';

// Crear instancia de axios para notificaciones
const notificationClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
notificationClient.interceptors.request.use(
  (config) => {
    // La autenticacion se gestiona con cookies HttpOnly.
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - manejo de errores globales
notificationClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', error.response?.data || error.message);

    return Promise.reject(error);
  }
);

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: string;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  sentAt?: string;
}

/**
 * Servicio de notificaciones push
 */
export const notificationService = {
  /**
   * Obtener la clave pública VAPID del servidor
   */
  getVapidPublicKey: (): Promise<ApiResponse<{ publicKey: string }>> =>
    notificationClient.get('/notifications/vapid-public-key').then(res => res.data),

  /**
   * Guardar una suscripción de notificaciones push
   */
  saveSubscription: (subscription: PushSubscriptionData): Promise<ApiResponse> =>
    notificationClient.post('/notifications/subscriptions', subscription).then(res => res.data),

  /**
   * Eliminar la suscripción de notificaciones push
   */
  deleteSubscription: (): Promise<ApiResponse> =>
    notificationClient.delete('/notifications/subscriptions/me').then(res => res.data),

  /**
   * Obtener las notificaciones del usuario actual
   */
  getMyNotifications: (limit = 50, offset = 0): Promise<ApiResponse<NotificationData[]>> =>
    notificationClient.get(`/notifications/my-notifications?limit=${limit}&offset=${offset}`).then(res => res.data),

  /**
   * Marcar notificación como leída
   */
  markAsRead: (notificationId: string): Promise<ApiResponse> =>
    notificationClient.put(`/notifications/notifications/${notificationId}/read`).then(res => res.data),

  /**
   * Enviar notificación a un usuario específico (solo admin/directiva)
   */
  sendToUser: (userId: string, title: string, body: string, data?: any): Promise<ApiResponse> =>
    notificationClient.post(`/notifications/send-to-user/${userId}`, { title, body, data }).then(res => res.data),

  /**
   * Enviar notificación a múltiples usuarios (solo admin/directiva)
   */
  sendToMultipleUsers: (userIds: string[], title: string, body: string, data?: any): Promise<ApiResponse> =>
    notificationClient.post('/notifications/send-to-multiple', { userIds, title, body, data }).then(res => res.data),
};

/**
 * Servicio de notificaciones push del navegador
 */
export class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey: string | null = null;

  async initialize(requestPermission = false): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.ready;

      if (!this.vapidPublicKey) {
        try {
          const response = await notificationService.getVapidPublicKey();
          if (response.success && response.data?.publicKey) {
            this.vapidPublicKey = response.data.publicKey;
          } else {
            console.error('No se pudo obtener la clave VAPID');
            return false;
          }
        } catch (error) {
          console.error('Error fetching VAPID key:', error);
          return false;
        }
      }

      if (requestPermission) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('Permiso de notificaciones denegado');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error initializing push service:', error);
      return false;
    }
  }

  async subscribeToPushNotifications(userId: string): Promise<boolean> {
    if (!this.swRegistration || !this.vapidPublicKey) {
      const initialized = await this.initialize(true);
      if (!initialized) return false;
    }

    try {
      let subscription = await this.swRegistration!.pushManager.getSubscription();

      if (!subscription) {
        const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey!);

        subscription = await this.swRegistration!.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as unknown as BufferSource
        });
      }

      const subscriptionJSON = subscription.toJSON();
      if (!subscriptionJSON.keys?.p256dh || !subscriptionJSON.keys?.auth) {
        throw new Error('Claves de suscripción inválidas');
      }

      const pushData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscriptionJSON.keys.p256dh,
          auth: subscriptionJSON.keys.auth
        },
        userId
      };

      await notificationService.saveSubscription(pushData);
      console.log('✅ Suscripción push guardada correctamente');
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return false;
    }
  }

  async unsubscribeFromPushNotifications(): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        if (!('serviceWorker' in navigator)) return false;
        this.swRegistration = await navigator.serviceWorker.ready;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();

        try {
          await notificationService.deleteSubscription();
        } catch (e) {
          console.warn('Error deleting subscription from backend:', e);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }

  async isSubscribed(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Instancia única del servicio
export const pushNotificationService = new PushNotificationService();
