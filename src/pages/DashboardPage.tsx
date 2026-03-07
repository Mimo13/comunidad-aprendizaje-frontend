import { Typography, Box, Grid, Paper, Button } from '@mui/material';
import { NotificationsActive } from '@mui/icons-material';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/stores/authStore';
import ScheduleWidget from '@/components/ScheduleWidget';
import ActivityHeatmapWidget from '@/components/ActivityHeatmapWidget';
import ActivityChartWidget from '@/components/ActivityChartWidget';
import AvailabilityOverviewWidget from '@/components/AvailabilityOverviewWidget';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { pushNotificationService } from '@/services/notificationService';

const DashboardPage = () => {
  const { user } = useAuthStore();
  const { canAccess } = usePermissions();
  const navigate = useNavigate();
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const canViewAvailabilityWidget = canAccess('AVAILABILITY_WIDGET');
  const canViewHeatmapWidget = canAccess('ACTIVITY_HEATMAP_WIDGET');
  const canViewActivityChartWidget = canAccess('ACTIVITY_CHART_WIDGET');

  useEffect(() => {
    // Comprobar si las notificaciones están activas
    const checkNotifications = async () => {
      try {
        await pushNotificationService.initialize();
        const isSubscribed = await pushNotificationService.isSubscribed();
        // Si no está suscrito y el navegador lo soporta, mostrar prompt
        if (!isSubscribed && 'Notification' in window && Notification.permission !== 'denied') {
          setShowNotificationPrompt(true);
        }
      } catch (e) {
        console.warn('Error checking notifications status', e);
      }
    };
    
    checkNotifications();
  }, []);

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold" sx={{ color: '#fff', mb: 1 }}>
          Hola, {user?.name?.split(' ')[0]}!
        </Typography>
      </Box>

      {/* Prompt de Notificaciones - Desactivado */}
      {/* 
      {showNotificationPrompt && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: 'rgba(255,255,255,0.1)', 
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <NotificationsActive sx={{ color: '#fff' }} />
            <Box>
              <Typography variant="subtitle2" color="white" fontWeight="bold">
                Activa las notificaciones
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Recibe avisos sobre nuevas actividades y cambios
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="contained" 
            size="small" 
            onClick={() => navigate('/profile')}
            sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
          >
            Configurar
          </Button>
        </Paper>
      )}
      */}

      <Grid container spacing={3}>
        {/* Schedule Widget (Main Focus) */}
        <Grid item xs={12} md={5} lg={4}>
          <ScheduleWidget />
        </Grid>

        {/* Stats Widget */}
        <Grid item xs={12} md={7} lg={8}>
          <Box display="flex" flexDirection="column" gap={3}>
            {canViewHeatmapWidget && <ActivityHeatmapWidget />}
            {canViewAvailabilityWidget && <AvailabilityOverviewWidget />}
            {canViewActivityChartWidget && <ActivityChartWidget />}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
