import { useState, useEffect } from 'react';
import { 
  Switch, 
  FormControlLabel, 
  Typography, 
  Box, 
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemText,
  ListItemButton,
  Badge,
  Checkbox,
  FormGroup,
  Divider,
  Paper
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon
} from '@mui/icons-material';
import { pushNotificationService, notificationService, NotificationData } from '@/services/notificationService';
import { useAuthStore } from '@/stores/authStore';

const NotificationSettings = () => {
  const { user } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Estados para los tipos de notificaciones
  const [preferences, setPreferences] = useState({
    newActivity: true,
    activityCovered: true,
    activityReminder: true
  });

  useEffect(() => {
    checkNotificationStatus();
    loadNotifications();
    loadPreferences();
  }, []);

  const loadPreferences = () => {
    if (user) {
      const stored = localStorage.getItem(`notification_preferences_${user.id}`);
      if (stored) {
        try {
          setPreferences(JSON.parse(stored));
        } catch (e) {
          console.error('Error parsing notification preferences', e);
        }
      }
    }
  };

  const savePreferences = (newPrefs: typeof preferences) => {
    setPreferences(newPrefs);
    if (user) {
      localStorage.setItem(`notification_preferences_${user.id}`, JSON.stringify(newPrefs));
    }
    // Aquí se llamaría al backend si existiera el endpoint
  };

  const handlePreferenceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    savePreferences({
      ...preferences,
      [event.target.name]: event.target.checked,
    });
  };

  const checkNotificationStatus = async () => {
    try {
      // Primero inicializar para asegurarnos de que swRegistration está listo
      await pushNotificationService.initialize();
      const isSubscribed = await pushNotificationService.isSubscribed();
      setNotificationsEnabled(isSubscribed);
    } catch (error) {
      console.error('Error al verificar estado de notificaciones:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    
    setNotificationsLoading(true);
    try {
      const response = await notificationService.getMyNotifications();
      if (response.success && response.data) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleNotificationToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!notificationsEnabled) {
        // Intentar activar
        const subscribed = await pushNotificationService.subscribeToPushNotifications(user.id);
        if (subscribed) {
          setNotificationsEnabled(true);
          setSuccess('Notificaciones activadas correctamente');
        } else {
          setError('No se pudo activar las notificaciones. Asegúrate de permitir las notificaciones en tu navegador.');
        }
      } else {
        // Intentar desactivar
        const unsubscribed = await pushNotificationService.unsubscribeFromPushNotifications();
        if (unsubscribed) {
          setNotificationsEnabled(false);
          setSuccess('Notificaciones desactivadas correctamente');
        } else {
          setError('Error al desactivar las notificaciones.');
        }
      }
    } catch (err) {
      console.error('Error al cambiar estado de notificaciones:', err);
      setError('Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: NotificationData) => {
    try {
      if (!notification.read) {
        await notificationService.markAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  const openNotificationsDialog = () => {
    setNotificationsDialogOpen(true);
  };

  const closeNotificationsDialog = () => {
    setNotificationsDialogOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'transparent', display: 'none' }}>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <NotificationsActiveIcon color={notificationsEnabled ? "primary" : "disabled"} />
          <Box flexGrow={1}>
            <Typography variant="subtitle1" fontWeight="bold">
              Notificaciones Push
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Recibe alertas en tu dispositivo
            </Typography>
          </Box>
          {/* Botón para activar si no está activado. Si está activado, mostramos texto de estado. */}
          {!notificationsEnabled ? (
            <Button 
              variant="contained" 
              size="small" 
              onClick={(e) => handleNotificationToggle({ target: { checked: true } } as any)}
              disabled={loading}
            >
              Activar
            </Button>
          ) : (
            <Typography variant="caption" color="success.main" fontWeight="bold" sx={{ px: 1, py: 0.5, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 1 }}>
              SUSCRIPCIÓN ACTIVA
            </Typography>
          )}
        </Box>
        {loading && <Box display="flex" justifyContent="center" mt={1}><CircularProgress size={20} /></Box>}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mt: 3, mb: 1 }}>
        Suscripción a tipos de notificaciones
      </Typography>
      
      <Paper variant="outlined" sx={{ p: 0, mb: 3, borderRadius: 2, bgcolor: 'transparent', overflow: 'hidden' }}>
        <FormGroup sx={{ p: 1 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={preferences.newActivity} 
                onChange={handlePreferenceChange} 
                name="newActivity" 
                disabled={!notificationsEnabled}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight="500">Nueva Actividad</Typography>
                <Typography variant="caption" color="text.secondary">Cuando se publiquen nuevas actividades</Typography>
              </Box>
            }
            sx={{ m: 0, p: 1, '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }, borderRadius: 1 }}
          />
          <Divider sx={{ my: 0.5 }} />
          <FormControlLabel
            control={
              <Checkbox 
                checked={preferences.activityCovered} 
                onChange={handlePreferenceChange} 
                name="activityCovered" 
                disabled={!notificationsEnabled}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight="500">Actividad Cubierta</Typography>
                <Typography variant="caption" color="text.secondary">Cuando se completen las plazas de una actividad</Typography>
              </Box>
            }
            sx={{ m: 0, p: 1, '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }, borderRadius: 1 }}
          />
          <Divider sx={{ my: 0.5 }} />
          <FormControlLabel
            control={
              <Checkbox 
                checked={preferences.activityReminder} 
                onChange={handlePreferenceChange} 
                name="activityReminder" 
                disabled={!notificationsEnabled}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight="500">Recordatorios</Typography>
                <Typography variant="caption" color="text.secondary">Avisos de proximidad de actividades pendientes</Typography>
              </Box>
            }
            sx={{ m: 0, p: 1, '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }, borderRadius: 1 }}
          />
        </FormGroup>
      </Paper>

      <Box display="flex" alignItems="center" gap={2} mt={3}>
        <Button
          variant="outlined"
          startIcon={
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          }
          onClick={openNotificationsDialog}
          disabled={notificationsLoading}
          fullWidth
        >
          Historial de notificaciones
        </Button>
      </Box>

      <Dialog
        open={notificationsDialogOpen}
        onClose={closeNotificationsDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Mis Notificaciones
        </DialogTitle>
        <DialogContent>
          {notificationsLoading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Typography color="text.secondary" align="center" py={3}>
              No tienes notificaciones
            </Typography>
          ) : (
            <List>
              {notifications.map((notification) => (
                <ListItemButton
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  selected={!notification.read}
                >
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.createdAt).toLocaleString('es-ES')}
                        </Typography>
                      </>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNotificationsDialog}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationSettings;