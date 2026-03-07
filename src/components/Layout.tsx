import { useNavigate, useLocation, useOutlet } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box, IconButton, Badge, Menu, MenuItem } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { 
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/stores/authStore';
import { notificationService, NotificationData, pushNotificationService } from '@/services/notificationService';
import NotificationInitializer from './NotificationInitializer';
import { AnimatePresence, motion } from 'framer-motion';

import Asset1 from '@/assets/1x/Asset 1.png';
import BottomMenu from './BottomMenu';
import StyledTooltip from './StyledTooltip';
import OfflineIndicator from './OfflineIndicator';

// 

// Mapeo de rutas a índices para determinar la dirección de la transición
const routeIndices: Record<string, number> = {
  // Rutas principales (BottomMenu)
  '/activities': 0,
  '/notifications': 1,
  '/dashboard': 2,
  '/settings': 3,
  '/profile': 4,
  
  // Rutas de administración (conceptualmente a la derecha de settings/profile o como subniveles)
  // Asignamos índices mayores para que deslicen "hacia adelante" desde dashboard
  '/admin/users': 10,
  '/admin/subjects': 11,
  '/admin/classrooms': 12,
  '/admin/holidays': 13,
  '/admin/roles': 14,
  '/admin/stats': 15,
  '/admin/reports': 16
};

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentOutlet = useOutlet();
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [adminAnchorEl, setAdminAnchorEl] = useState<null | HTMLElement>(null);
  
  // Lógica de dirección de animación
  const currentPath = location.pathname;
  
  // Determinar índice actual
  let currentIndex = 2; // Default a dashboard
  
  // Búsqueda exacta primero
  if (routeIndices[currentPath] !== undefined) {
    currentIndex = routeIndices[currentPath];
  } else {
    // Búsqueda por prefijo
    const matchingKey = Object.keys(routeIndices).find(key => currentPath.startsWith(key) && key !== '/');
    if (matchingKey) {
      currentIndex = routeIndices[matchingKey];
    }
  }
  
  const prevIndexRef = useRef(currentIndex);
  
  // Calcular dirección
  let direction = 0;
  if (currentIndex > prevIndexRef.current) {
    direction = 1;
  } else if (currentIndex < prevIndexRef.current) {
    direction = -1;
  }
  
  // Actualizar ref después del render
  useEffect(() => {
    prevIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Variantes para la animación de diapositivas
  const pageVariants = {
    initial: (direction: number) => ({
      // Ascendente (dir > 0): de derecha a izquierda (entra desde 100%)
      // Descendente (dir < 0): de izquierda a derecha (entra desde -100%)
      x: direction > 0 ? '100%' : direction < 0 ? '-100%' : 0,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction: number) => ({
      // Ascendente (dir > 0): sale hacia la izquierda (-100%)
      // Descendente (dir < 0): sale hacia la derecha (100%)
      x: direction > 0 ? '-100%' : direction < 0 ? '100%' : 0,
      opacity: 0,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };
  
  // Estado para el menú de perfil
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      checkPushStatus();
      // Actualizar notificaciones cada 30 segundos
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const checkPushStatus = async () => {
    try {
      // Intentar inicializar silenciosamente para asegurar que el SW está listo
      await pushNotificationService.initialize();
      const isSubscribed = await pushNotificationService.isSubscribed();
      setNotificationsEnabled(isSubscribed);
    } catch (error) {
      console.error('Error verificando push status', error);
    }
  };

  const handlePushToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // IMPORTANTE: Esta función debe ser invocada directamente por un evento de usuario (click/change)
    // para que Safari permita solicitar permisos.
    if (!user) return;
    
    // Evitar que el menú se cierre inmediatamente si queremos ver el cambio visual (opcional)
    // e.stopPropagation(); 
    
    setPushLoading(true);
    try {
      if (notificationsEnabled) {
        const unsubscribed = await pushNotificationService.unsubscribeFromPushNotifications();
        if (unsubscribed) setNotificationsEnabled(false);
      } else {
        // En Safari, Notification.requestPermission() DEBE ser llamado aquí, en respuesta directa al evento
        if (Notification.permission !== 'granted') {
           const permission = await Notification.requestPermission();
           if (permission !== 'granted') {
             console.warn('Permisos denegados por el usuario');
             // TODO: Mostrar mensaje al usuario: "Debes permitir las notificaciones en tu navegador"
             setPushLoading(false);
             return;
           }
        }

        const initialized = await pushNotificationService.initialize();
        if (initialized) {
          const subscribed = await pushNotificationService.subscribeToPushNotifications(user.id);
          if (subscribed) {
            setNotificationsEnabled(true);
          } else {
            console.error('No se pudo completar la suscripción');
            // TODO: Mostrar mensaje de error al usuario
          }
        } else {
           console.error('No se pudo inicializar el servicio de notificaciones');
        }
      }
    } catch (error) {
      console.error('Error toggling push notifications', error);
    } finally {
      setPushLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await notificationService.getMyNotifications();
      if (response.success && response.data) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
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
      handleNotificationsClose();
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleAdminMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAdminAnchorEl(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAdminAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  

  const isActive = (path: string) => location.pathname === path;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Inicializar notificaciones automáticamente */}
      <NotificationInitializer />
      <OfflineIndicator />
      
      <AppBar position="static">
        <Toolbar>
          <Box 
            display="flex" 
            alignItems="center" 
            gap={2} 
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <img src={Asset1} alt="Logo IES Cartima" style={{ height: 40 }} loading="lazy" />
            <Typography variant="h6" component="div">
              IES Cartima
            </Typography>
          </Box>
          
          {user && (
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton
                color="inherit"
                onClick={handleNotificationsOpen}
                aria-label="notificaciones"
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              
              <StyledTooltip title="Cerrar sesión" placement="bottom">
                <IconButton
                  color="inherit"
                  onClick={handleLogout}
                  aria-label="cerrar sesión"
                >
                  <LogoutIcon />
                </IconButton>
              </StyledTooltip>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Menú de notificaciones */}
      <Menu
        anchorEl={notificationsAnchorEl}
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: 350,
          },
        }}
      >
        {notifications.length === 0 ? (
          <MenuItem disabled>
            No tienes notificaciones
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              selected={!notification.read}
              sx={{ 
                backgroundColor: !notification.read ? 'action.hover' : 'transparent',
                whiteSpace: 'normal',
                flexDirection: 'column',
                alignItems: 'flex-start',
                py: 2
              }}
            >
              <Typography variant="subtitle2" fontWeight={!notification.read ? 'bold' : 'normal'}>
                {notification.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {notification.message}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {new Date(notification.createdAt).toLocaleString('es-ES')}
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>
      
      <Container component="main" sx={{ mt: 4, mb: 12, flexGrow: 1, position: 'relative', overflowX: 'hidden' }}>
        <AnimatePresence mode='wait' custom={direction}>
          <motion.div
            key={location.pathname}
            custom={direction}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ width: '100%', position: 'relative' }}
          >
            {currentOutlet}
          </motion.div>
        </AnimatePresence>
      </Container>
      
      <BottomMenu 
        unreadCount={unreadCount}
      />

      
    </Box>
  );
};

export default Layout;
