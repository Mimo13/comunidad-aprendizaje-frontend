import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  List,
  ListItem,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  Slide
} from '@mui/material';
import { Close as CloseIcon, AccessTime as TimeIcon, LocationOn as LocationIcon, School as SchoolIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { activityService } from '@/services/api';
import { ActivityWithEnrollments } from '@/types';
import ActivityDetailsModal from './ActivityDetailsModal';
import { TransitionProps } from '@mui/material/transitions';

interface DayActivitiesDialogProps {
  open: boolean;
  onClose: () => void;
  date: Dayjs | null;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

const DayActivitiesDialog: React.FC<DayActivitiesDialogProps> = ({ open, onClose, date }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<ActivityWithEnrollments[]>([]);
  
  // Estado para la actividad seleccionada (detalle)
  const [selectedActivity, setSelectedActivity] = useState<ActivityWithEnrollments | null>(null);

  useEffect(() => {
    if (open && date) {
      loadActivities();
      setSelectedActivity(null); // Reset al abrir
    }
  }, [open, date]);

  const loadActivities = async () => {
    if (!date) return;
    
    setLoading(true);
    try {
      const dateStr = date.format('YYYY-MM-DD');
      const response = await activityService.getActivities({ 
        date: dateStr,
        limit: 100, // Aseguramos traer todas las del día
        status: 'NON_CANCELLED'
      });
      
      if (response.success && response.data) {
        setActivities(response.data.activities);
      }
    } catch (error) {
      console.error('Error loading activities for day', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityClick = (activity: ActivityWithEnrollments) => {
    setSelectedActivity(activity);
  };

  const handleBackToList = () => {
    setSelectedActivity(null);
    // Recargar lista por si hubo cambios en inscripción
    loadActivities();
  };

  const handleCloseDetail = () => {
    setSelectedActivity(null);
    loadActivities();
  };

  if (!date) return null;

  // Si hay una actividad seleccionada, mostramos el detalle en lugar de la lista
  // Usamos el componente ActivityDetailsModal pero controlado desde aquí para la transición
  return (
    <>
      <Dialog 
        open={open && !selectedActivity} 
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box>
            <Typography variant="h6" component="div" fontWeight="bold">
              Actividades del día
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {date.format('dddd, D [de] MMMM [de] YYYY')}
            </Typography>
          </Box>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : activities.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">No hay actividades programadas para este día.</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {activities.map((activity) => {
                const isFull = activity.availableSpots <= 0;
                const isEnrolled = activity.isUserEnrolled;
                
                return (
                  <ListItem 
                    key={activity.id}
                    disablePadding
                    sx={{ 
                      mb: 2, 
                      display: 'block',
                      border: '1px solid',
                      borderColor: 'grey.300',
                      borderRadius: 2,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      bgcolor: 'rgba(255, 255, 255, 0.5)',
                      color: 'grey.900',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                        borderColor: 'primary.main'
                      }
                    }}
                    onClick={() => handleActivityClick(activity)}
                  >
                    <Box p={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                          {activity.title}
                        </Typography>
                        {isEnrolled ? (
                          <Chip label="Inscrito" color="success" size="small" />
                        ) : isFull ? (
                          <Chip label="Completo" color="error" size="small" />
                        ) : (
                          <Chip label={`${activity.availableSpots} plazas`} color="primary" variant="outlined" size="small" />
                        )}
                      </Box>
                      
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <TimeIcon fontSize="small" sx={{ color: 'grey.600' }} />
                          <Typography variant="body2">
                            {dayjs(activity.date).format('HH:mm')} - {dayjs(activity.endDate).format('HH:mm')}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={1}>
                          <SchoolIcon fontSize="small" sx={{ color: 'grey.600' }} />
                          <Typography variant="body2">
                            {activity.subject}
                          </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationIcon fontSize="small" sx={{ color: 'grey.600' }} />
                          <Typography variant="body2">
                            {activity.classroom}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>

      <ActivityDetailsModal 
        open={!!selectedActivity} 
        onClose={handleBackToList} // Al cerrar volvemos a la lista
        activity={selectedActivity}
        onEnrollSuccess={loadActivities}
      />
    </>
  );
};

export default DayActivitiesDialog;
