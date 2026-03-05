import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Paper, 
  IconButton, 
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { notificationService, NotificationData } from '@/services/notificationService';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getMyNotifications();
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      enqueueSnackbar('Error al cargar notificaciones', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Aquí iría la lógica de borrado si existiera en el servicio
    // Por ahora solo simulamos visualmente o marcamos como leída
    handleMarkAsRead(id); 
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Avisos y Notificaciones
      </Typography>

      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 4, 
          overflow: 'hidden',
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        {loading ? (
          <Box p={4} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography color="text.secondary">No tienes notificaciones pendientes</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification, index) => (
              <Box key={notification.id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{ 
                    bgcolor: notification.read ? 'transparent' : 'rgba(16, 138, 177, 0.08)',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
                  }}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={(e) => handleDelete(notification.id, e)}>
                       {notification.read ? <DeleteIcon color="disabled" fontSize="small" /> : <CheckCircleIcon color="primary" />}
                    </IconButton>
                  }
                >
                  <Box mr={2} mt={0.5}>
                    <CircleIcon sx={{ fontSize: 12, color: notification.read ? 'transparent' : 'secondary.main' }} />
                  </Box>
                  <ListItemText
                    primaryTypographyProps={{ component: 'div' }}
                    secondaryTypographyProps={{ component: 'div' }}
                    primary={
                      <Box component="div">
                        <Typography variant="subtitle1" fontWeight={notification.read ? 'normal' : 'bold'}>
                          {notification.title}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box component="div" mt={0.5}>
                        <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(notification.createdAt).format('DD/MM/YYYY HH:mm')}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider component="li" />}
              </Box>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default NotificationsPage;
