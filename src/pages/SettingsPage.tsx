import { Box, Typography, Grid, Paper, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  Person as PersonIcon, 
  School as SchoolIcon, 
  EventNote as EventIcon, 
  MeetingRoom as RoomIcon, 
  Group as GroupIcon,
  AdminPanelSettings as RoleIcon,
  Assessment as AssessmentIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { usePermissions } from '@/stores/authStore';
import { motion } from 'framer-motion';

const SettingsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { canAccess } = usePermissions();

  const adminOptions = [
    {
      id: 'users',
      title: 'Usuarios',
      description: 'Gestión de usuarios y familias',
      icon: <PersonIcon fontSize="large" />,
      path: '/admin/users',
      permission: 'USERS',
      color: theme.palette.primary.main
    },
    {
      id: 'subjects',
      title: 'Asignaturas',
      description: 'Configuración de departamentos',
      icon: <SchoolIcon fontSize="large" />,
      path: '/admin/subjects',
      permission: 'SUBJECTS',
      color: theme.palette.secondary.main
    },
    {
      id: 'holidays',
      title: 'Festivos',
      description: 'Calendario escolar y días no lectivos',
      icon: <EventIcon fontSize="large" />,
      path: '/admin/holidays',
      permission: 'HOLIDAYS',
      color: theme.palette.success.main
    },
    {
      id: 'classrooms',
      title: 'Aulas',
      description: 'Espacios disponibles',
      icon: <RoomIcon fontSize="large" />,
      path: '/admin/classrooms',
      permission: 'CLASSROOMS',
      color: theme.palette.warning.main
    },
    {
      id: 'classes',
      title: 'Clases',
      description: 'Grupos y niveles escolares',
      icon: <GroupIcon fontSize="large" />,
      path: '/admin/classes',
      permission: 'CLASSES',
      color: theme.palette.warning.dark
    },
    {
      id: 'roles',
      title: 'Perfiles y Roles',
      description: 'Gestión de permisos de acceso',
      icon: <RoleIcon fontSize="large" />,
      path: '/admin/roles',
      permission: 'ROLES',
      color: theme.palette.info.main
    },
    {
      id: 'reports',
      title: 'Informes',
      description: 'Generación de listados y documentación',
      icon: <AssessmentIcon fontSize="large" />,
      path: '/admin/reports',
      permission: 'REPORTS', // O 'ADMIN' si queremos restringir
      color: '#673ab7' // Deep Purple manual para diferenciar
    }
  ];

  const availableOptions = adminOptions.filter((opt) => {
    if (opt.id === 'classes') {
      return canAccess('CLASSES') || canAccess('CLASSROOMS');
    }
    return canAccess(opt.permission);
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Administración y Ajustes
      </Typography>

      <Grid container spacing={2}>
        {availableOptions.map((option) => (
          <Grid item xs={12} sm={6} md={4} key={option.id}>
            <motion.div
              layoutId={`admin-card-${option.id}`}
              style={{ height: '100%' }}
            >
              <Paper
                elevation={0}
                onClick={() => navigate(option.path)}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, box-shadow 0.2s', // Quitamos transform para no pelear con Framer
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  height: '100%',
                  '&:hover': {
                    // transform: 'translateY(-4px)', // Gestionado por framer si quisiéramos
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    borderColor: option.color
                  }
                }}
              >
                <Box 
                  sx={{ 
                    p: 1.5, 
                    borderRadius: 3, 
                    bgcolor: `${option.color}22`, // 22 hex = ~13% opacity
                    color: option.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {option.icon}
                </Box>
                
                <Box flexGrow={1}>
                  <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                    {option.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.description}
                  </Typography>
                </Box>

                <ChevronRightIcon color="action" />
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SettingsPage;
