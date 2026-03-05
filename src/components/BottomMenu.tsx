import { Box, IconButton, useTheme, Typography } from '@mui/material';
import { 
  Home as HomeIcon, 
  Event as EventIcon, 
  Notifications as NotificationsIcon, 
  Settings as SettingsIcon, 
  Person as PersonIcon 
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { usePermissions } from '@/stores/authStore';
import { motion } from 'framer-motion';
import ReactDOM from 'react-dom';
import StyledTooltip from './StyledTooltip';

interface BottomMenuProps {
  unreadCount?: number;
}

const BottomMenu = ({ unreadCount = 0 }: BottomMenuProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { canAccess } = usePermissions();

  const [activeIndex, setActiveIndex] = useState(0);

  // Definir las opciones del menú
  const menuItems = [
    { 
      id: 'activities', 
      label: 'Actividades',
      icon: <EventIcon />, 
      path: '/activities', 
      action: () => navigate('/activities'),
      hidden: !canAccess('ACTIVITIES')
    },
    { 
      id: 'notifications', 
      label: 'Mensajes',
      icon: <NotificationsIcon />, 
      path: '/notifications',
      action: () => navigate('/notifications'),
      badge: unreadCount
    },
    { 
      id: 'home', 
      label: 'Inicio',
      icon: <HomeIcon />, 
      path: '/dashboard', 
      action: () => navigate('/dashboard') 
    },
    { 
      id: 'settings', 
      label: 'Ajustes',
      icon: <SettingsIcon />, 
      path: '/settings',
      action: () => navigate('/settings'),
      hidden: !(canAccess('USERS') || canAccess('SUBJECTS') || canAccess('HOLIDAYS') || canAccess('CLASSROOMS') || canAccess('ROLES'))
    },
    { 
      id: 'profile', 
      label: 'Perfil',
      icon: <PersonIcon />, 
      path: '/profile',
      action: () => navigate('/profile')
    }
  ];

  // Filtrar items ocultos
  const visibleItems = useMemo(() => menuItems.filter(item => !item.hidden), [canAccess]);

  // Determinar índice activo basado en la ruta actual o acción reciente
  useEffect(() => {
    const currentPath = location.pathname;
    const index = visibleItems.findIndex(item => item.path && currentPath.startsWith(item.path));
    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [location.pathname, visibleItems]);

  const handleItemClick = (index: number, item: any, event: React.MouseEvent<HTMLElement>) => {
    setActiveIndex(index);
    item.action(event);
  };

  // Configuración de dimensiones para SVG
  // Usamos un sistema de coordenadas fijo para evitar distorsiones
  // pero escalable horizontalmente
  const viewBoxHeight = 60; // Coincide con la altura real del contenedor
  // Ancho arbitrario grande para el viewBox, que se adaptará
  const viewBoxWidth = 500; 
  
  const itemWidth = viewBoxWidth / visibleItems.length;
  // Ajustamos el ancho de la curva relativo al ancho del item
  const curveWidth = 80; // Ancho fijo en unidades de usuario para la curva (aprox 80px)
  const curveDepth = 35; // Profundidad de la curva
  
  // Calcular el path del SVG
  // La curva es un "hueco" hacia abajo donde se asienta la bola
  const getPath = (index: number) => {
    const center = (index * itemWidth) + (itemWidth / 2);
    const startX = center - (curveWidth / 2);
    const endX = center + (curveWidth / 2);
    
    // Radio de las esquinas
    const cornerRadius = 15; 
    
    // Puntos de control para la curva Bezier cúbica del socket
    
    return `
      M ${cornerRadius} 0 
      L ${startX} 0 
      C ${startX + (curveWidth * 0.25)} 0, ${center - (curveWidth * 0.25)} ${curveDepth}, ${center} ${curveDepth} 
      C ${center + (curveWidth * 0.25)} ${curveDepth}, ${endX - (curveWidth * 0.25)} 0, ${endX} 0 
      L ${viewBoxWidth - cornerRadius} 0 
      Q ${viewBoxWidth} 0, ${viewBoxWidth} ${cornerRadius}
      L ${viewBoxWidth} ${viewBoxHeight - cornerRadius} 
      Q ${viewBoxWidth} ${viewBoxHeight}, ${viewBoxWidth - cornerRadius} ${viewBoxHeight}
      L ${cornerRadius} ${viewBoxHeight} 
      Q 0 ${viewBoxHeight}, 0 ${viewBoxHeight - cornerRadius}
      L 0 ${cornerRadius}
      Q 0 0, ${cornerRadius} 0
      Z
    `;
  };

  return ReactDOM.createPortal(
    <Box
      sx={{
        position: 'fixed',
        bottom: 0, 
        left: 0,
        width: '100%',
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none', // Permitir clicks fuera del menú
        pb: 2
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '95%',
          maxWidth: 500,
          height: 60,
          filter: 'drop-shadow(0px 5px 15px rgba(0,0,0,0.3))', 
          pointerEvents: 'auto', // Reactivar clicks en el menú
          mb: 1
        }}
      >
      {/* Contenedor relativo para posicionar elementos */}
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        
        {/* Fondo SVG Fluido animado */}
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          preserveAspectRatio="none"
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0,
            overflow: 'visible'
          }}
        >
          <motion.path
            d={getPath(activeIndex)}
            fill={theme.palette.background.paper}
            animate={{ d: getPath(activeIndex) }}
            transition={{ 
              type: "spring", 
              stiffness: 350, 
              damping: 30 
            }}
          />
        </svg>

        {/* Bola rodante (Indicador activo) */}
        <motion.div
          animate={{
            left: `${(activeIndex * (100 / visibleItems.length)) + ((100 / visibleItems.length) / 2)}%`,
          }}
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 30,
          }}
          style={{
            position: 'absolute',
            top: -20, // Ajustado para encajar en la nueva profundidad (antes -15)
            width: 50, 
            height: 50,
            marginLeft: -25, // Centrar
            borderRadius: '50%',
            backgroundColor: theme.palette.success.main, 
            border: `4px solid ${theme.palette.background.default}`, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(6, 215, 160, 0.4)',
          }}
        >
          {/* Icono dentro de la bola con rotación */}
          <motion.div
            key={activeIndex} 
            initial={{ rotate: -180, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{ color: '#073A4B', display: 'flex' }}
          >
            {visibleItems[activeIndex]?.icon}
          </motion.div>
        </motion.div>

        {/* Items del menú */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            zIndex: 5,
          }}
        >
          {visibleItems.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <StyledTooltip key={item.id} title={item.label || ''} placement="top">
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    cursor: 'pointer',
                    // Eliminado padding condicional para centrado perfecto
                  }}
                  onClick={(e) => handleItemClick(index, item, e as any)}
                >
                  {/* Texto o icono inactivo */}
                  <motion.div
                    animate={{
                      y: isActive ? 30 : 0, // Movimiento más corto hacia abajo
                      opacity: isActive ? 0 : 1,
                      scale: isActive ? 0.5 : 1
                    }}
                    transition={{ duration: 0.2 }}
                    style={{ 
                      color: theme.palette.text.secondary,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    {item.icon}
                  </motion.div>
                </Box>
              </StyledTooltip>
            );
          })}
        </Box>
      </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
        © {new Date().getFullYear()} Familias Colaboradoras - Cártama, Málaga
      </Typography>
    </Box>,
    document.body
  );
};

export default BottomMenu;
