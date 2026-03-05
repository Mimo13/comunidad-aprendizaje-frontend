import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  InputBase, 
  Paper, 
  Avatar, 
  AvatarGroup, 
  Tooltip,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  ChevronLeft as ChevronLeftIcon, 
  ChevronRight as ChevronRightIcon, 
  Search as SearchIcon, 
  KeyboardArrowDown as ExpandMoreIcon,
  Add as AddIcon
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { activityService, holidayService, subjectService, enrollmentService } from '@/services/api';
import { ActivityWithEnrollments } from '@/types';
import { useNavigate } from 'react-router-dom';
import EnrollmentDialog from '@/components/EnrollmentDialog';
import { usePermissions } from '@/stores/authStore';
import { useSnackbar } from 'notistack';
import { stringToColor } from '@/utils/avatarUtils';
import { SkeletonListItem } from '@/components/SkeletonLoader';

const TimeText = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem !important',
  fontWeight: 500,
  opacity: 0.7,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
  width: 'max-content',
}));

const ScheduleWidget = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = usePermissions();
  const { enqueueSnackbar } = useSnackbar();
  
  // Estado para la fecha base (siempre será el inicio de la semana visible o el día seleccionado)
  // Pero para "7 días, empezando por el domingo", necesitamos calcular el inicio de la semana de la fecha seleccionada.
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [activities, setActivities] = useState<ActivityWithEnrollments[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<ActivityWithEnrollments[]>([]);
  const [weekActivityDates, setWeekActivityDates] = useState<Set<string>>(new Set());
  const [subjects, setSubjects] = useState<any[]>([]); // Cache para colores
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Estado para inscripción
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityWithEnrollments | null>(null);
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Calcular el inicio de la semana (Domingo) basado en la fecha seleccionada
  // dayjs().day(0) devuelve el domingo de la semana actual
  const startOfWeek = selectedDate.day(0); 
  
  // Generar los 7 días de la semana actual (Domingo a Sábado)
  const days: Dayjs[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(startOfWeek.add(i, 'day'));
  }

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Calcular fecha para próximas actividades (día siguiente al seleccionado)
      const nextDay = selectedDate.add(1, 'day').startOf('day');
      const weekEnd = startOfWeek.add(6, 'day');

      // Cargar actividades para la fecha seleccionada y lista de asignaturas para colores
      const [activitiesRes, upcomingRes, weekActivitiesRes, holidaysRes, subjectsRes] = await Promise.all([
        activityService.getActivities({
          date: selectedDate.toISOString(),
          limit: 20
        }),
        activityService.getActivities({
          fromDate: nextDay.format('YYYY-MM-DD'),
          limit: 5
        }),
        activityService.getActivities({
          fromDate: startOfWeek.format('YYYY-MM-DD'),
          toDate: weekEnd.format('YYYY-MM-DD'),
          limit: 100
        }),
        holidayService.getHolidays(),
        subjectService.getAllSubjects()
      ]);

      if (activitiesRes.success && activitiesRes.data) {
        setActivities(activitiesRes.data.activities);
      }

      if (upcomingRes.success && upcomingRes.data) {
        setUpcomingActivities(upcomingRes.data.activities);
      }

      if (weekActivitiesRes.success && weekActivitiesRes.data) {
        const dates = new Set(weekActivitiesRes.data.activities.map(a => dayjs(a.date).format('YYYY-MM-DD')));
        setWeekActivityDates(dates);
      }
      
      if (holidaysRes.success && holidaysRes.data) {
        setHolidays(holidaysRes.data);
      }

      if (subjectsRes.success && subjectsRes.data) {
        setSubjects(subjectsRes.data);
      }

    } catch (error) {
      console.error('Error loading data', error);
    } finally {
      setLoading(false);
    }
  };

  const getHolidayColor = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const holiday = holidays.find(h => dayjs(h.date).format('YYYY-MM-DD') === dateStr);
    
    if (!holiday) return null;
    
    switch (holiday.type) {
      case 'NATIONAL': return '#D32F2F';
      case 'REGIONAL': return '#2E7D32';
      case 'LOCAL': return '#1976D2';
      default: return '#D32F2F';
    }
  };

  const isHoliday = (date: Dayjs) => {
    // Sábados (6) y Domingos (0) - Gris suave si no hay festivo explícito
    const dayOfWeek = date.day();
    if (dayOfWeek === 0 || dayOfWeek === 6) return true;

    // Verificar festivos desde BD
    const dateStr = date.format('YYYY-MM-DD');
    return holidays.some(h => dayjs(h.date).format('YYYY-MM-DD') === dateStr);
  };

  const handleEnrollClick = (e: React.MouseEvent, activity: ActivityWithEnrollments) => {
    e.stopPropagation();
    setSelectedActivity(activity);
    setEnrollmentDialogOpen(true);
  };

  const handleEnrollConfirm = async (userId?: string) => {
    if (!selectedActivity) return;
    setEnrollLoading(true);
    try {
      let res;
      if (userId && userId !== user?.id) {
        res = await enrollmentService.enrollUserInActivity(selectedActivity.id, userId);
      } else {
        res = await enrollmentService.enrollInActivity(selectedActivity.id);
      }

      if (res.success) {
        enqueueSnackbar(userId && userId !== user?.id ? 'Usuario inscrito correctamente' : 'Te has inscrito correctamente', { variant: 'success' });
        setEnrollmentDialogOpen(false);
        loadData(); // Recargar datos
      } else {
        enqueueSnackbar(res.message || 'No se pudo realizar la inscripción', { variant: 'error' });
      }
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.message || e?.message || 'Error al inscribirse', { variant: 'error' });
    } finally {
      setEnrollLoading(false);
    }
  };

  const renderActivityCard = (activity: ActivityWithEnrollments, index: number) => {
    // Buscar color de la asignatura si existe, sino usar alternancia
    const subjectData = subjects.find(s => s.name === activity.subject);
    const isEven = index % 2 === 0;
    
    // Si hay color personalizado, usarlo. Si no, usar los por defecto.
    const baseColor = subjectData?.color || '#D0E9F5';
    // Convertir a rgba con transparencia para el fondo
    const bgColor = subjectData?.color || 'rgba(255, 255, 255, 0.3)';
    
    const textColor = subjectData?.color ? theme.palette.getContrastText(subjectData.color) : '#1A1A1A'; 
    const tagColor = textColor;

    const canEnroll = !activity.isUserEnrolled && activity.availableSpots > 0 && dayjs(activity.date).isAfter(dayjs());

    return (
      <Box
        key={activity.id}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: 3,
          p: 2.5,
          color: '#1A1A1A',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          position: 'relative'
        }}
      >
        {canEnroll && (
          <Tooltip title="Apuntarme">
            <IconButton
              size="small"
              onClick={(e) => handleEnrollClick(e, activity)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'warning.main',
                color: 'common.black',
                '&:hover': {
                  bgcolor: 'warning.dark',
                },
                boxShadow: 2,
                zIndex: 1,
                width: 32,
                height: 32
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Box mb={1.5} sx={{ ml: '10px', mt: '-10px', borderBottom: '1px solid rgba(0,0,0,0.1)', pb: 0.5, pr: canEnroll ? 4 : 0 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', mb: -0.5 }}>
            {activity.title}
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.6 }}>
              {dayjs(activity.date).format('DD/MM')}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.6 }}>
              {dayjs(activity.date).format('HH:mm')} - {dayjs(activity.date).add(1, 'hour').format('HH:mm')}
            </Typography>
          </Box>
          {activity.teacherName && (
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, mt: 0.5, color: 'text.primary' }}>
              Prof: {activity.teacherName}
            </Typography>
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={0.5}>
          <Box display="flex" alignItems="center">
            {activity.enrollments && activity.enrollments.length > 0 ? (
              <AvatarGroup 
                max={4} 
                sx={{ 
                  '& .MuiAvatar-root': { 
                    width: 32, 
                    height: 32, 
                    fontSize: '0.8rem',
                    borderColor: bgColor,
                    marginLeft: '-8px' // Ajuste para solapamiento más compacto si se desea, o quitar para default
                  } 
                }}
              >
                {activity.enrollments.map((enrollment) => (
                  <Tooltip key={enrollment.id} title={enrollment.user.name} arrow>
                    <Avatar 
                      sx={{ bgcolor: stringToColor(enrollment.user.name), cursor: 'pointer' }}
                      alt={enrollment.user.name}
                    >
                      {enrollment.user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            ) : (
              // Placeholder invisible para mantener altura si no hay avatares, o nada
              null
            )}
          </Box>

          <Box 
            sx={{ 
              backgroundColor: baseColor, 
              color: textColor,
              px: 1.5,
              py: 0.5,
              borderRadius: '7px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              flexGrow: 1, // Para que ocupe espacio si fuera necesario, aunque aquí parece fixed width content
              display: 'flex',
              alignItems: 'center',
              height: 32, // Misma altura que los avatares para asegurar alineación vertical perfecta
              whiteSpace: 'nowrap', // Evitar salto de línea
              overflow: 'hidden',   // Ocultar desbordamiento
              textOverflow: 'ellipsis' // Puntos suspensivos si es muy largo
            }}
          >
            {activity.subject}
          </Box>
        </Box>

        <Box 
          mt={2} 
          sx={{ 
             backgroundColor: '#7B61FF',
             color: '#ffffff',
             borderRadius: '7px',
             px: 1.5,
             width: '100%',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             height: 32,
             fontSize: '0.75rem',
             fontWeight: 'bold',
             textTransform: 'uppercase',
             letterSpacing: 0.5
           }}
         >
            {activity.classroom}
        </Box>
      </Box>
    );
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 4, 
        backgroundColor: 'background.paper',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" fontWeight="bold">Agenda</Typography>
        </Box>
        <Button 
          variant="text" 
          onClick={() => navigate('/activities')}
          sx={{ 
            color: 'text.secondary', 
            textTransform: 'none',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 2,
            px: 2
          }}
        >
          Ver Todo
        </Button>
      </Box>

      {/* Month Selector (controls the selected date -> week) */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <IconButton size="small" onClick={() => setSelectedDate(selectedDate.subtract(1, 'week'))}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h6" fontWeight="600">
          {selectedDate.format('MMMM, YYYY')}
        </Typography>
        <IconButton size="small" onClick={() => setSelectedDate(selectedDate.add(1, 'week'))}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Horizontal Date Strip (Week View: Sun - Sat) */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 1, 
          mb: 3, 
          position: 'sticky', // Hace que la barra de fechas sea pegajosa
          top: 0,
          backgroundColor: 'background.paper',
          zIndex: 10,
          pb: 2, // Padding inferior para que no se corte la sombra/borde al scrollear
          pt: 1  // Padding superior para espacio
        }}
      >
        {days.map((day) => {
          const isSelected = day.isSame(selectedDate, 'day');
          const holidayColor = getHolidayColor(day);
          const isWeekend = day.day() === 0 || day.day() === 6;
          const hasActivity = weekActivityDates.has(day.format('YYYY-MM-DD'));
          
          return (
            <Box
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              sx={{
                height: 80,
                borderRadius: 4,
                backgroundColor: isSelected 
                  ? '#7B61FF' 
                  : holidayColor 
                    ? holidayColor // Color específico del festivo
                    : isWeekend
                      ? 'rgba(255, 255, 255, 0.05)' // Fin de semana gris suave
                      : 'transparent',
                border: isWeekend 
                  ? '1px solid #F04770' 
                  : (isSelected || holidayColor ? 'none' : '1px solid rgba(255,255,255,0.1)'),
                boxShadow: isSelected ? '0 1px 3px rgba(0, 0, 0, 0.5)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: (isSelected || holidayColor) ? '#fff' : (isWeekend ? '#F04770' : 'text.primary'),
                position: 'relative',
                '&:hover': {
                  backgroundColor: isSelected 
                    ? '#7B61FF' 
                    : holidayColor
                      ? holidayColor
                      : 'rgba(255,255,255,0.1)'
                }
              }}
            >
              {hasActivity && (
                <Box 
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: (isSelected || holidayColor) ? 'white' : '#4CAF50',
                    position: 'absolute',
                    top: 8,
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                />
              )}
              <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem', fontWeight: 600 }}>
                {day.format('ddd')}
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {day.format('DD')}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Header Listado - Actividades para Hoy */}
      <Box 
        sx={{ 
          overflowY: 'auto', 
          maxHeight: 'calc(100vh - 400px)', 
          pr: 1,
          // Ocultar scrollbar en navegadores WebKit (Chrome, Safari) y Firefox
          scrollbarWidth: 'none',  // Firefox
          msOverflowStyle: 'none',  // IE/Edge
          '&::-webkit-scrollbar': { 
            display: 'none'  // Chrome, Safari, Opera
          }
        }}
      >
        <Box mb={2}>
          <Typography variant="h6" fontWeight="bold">Actividades para Hoy</Typography>
        </Box>

        {/* Activities List - Today */}
        <Box display="flex" flexDirection="column" gap={2}>
          {loading ? (
            <>
              <SkeletonListItem />
              <SkeletonListItem />
              <SkeletonListItem />
            </>
          ) : activities.length === 0 ? (
            <Box textAlign="center" py={4} sx={{ opacity: 0.7 }}>
              <Typography>No hay actividades programadas para este día</Typography>
              {isHoliday(selectedDate) && (
                 <Typography color="error" fontWeight="bold" mt={1}>
                   ¡Es día festivo! 🏖️
                 </Typography>
              )}
            </Box>
          ) : (
            activities.map((activity, index) => renderActivityCard(activity, index))
          )}
        </Box>

        {/* Header Listado - Próximas Actividades */}
        {upcomingActivities.length > 0 && (
          <>
            <Box mb={2} mt={4}>
              <Typography variant="h6" fontWeight="bold">Próximas Actividades</Typography>
            </Box>

            <Box display="flex" flexDirection="column" gap={2}>
              {upcomingActivities.map((activity, index) => renderActivityCard(activity, index + 100))}
            </Box>
          </>
        )}
      </Box>

      <EnrollmentDialog
        open={enrollmentDialogOpen}
        onClose={() => setEnrollmentDialogOpen(false)}
        activity={selectedActivity}
        onConfirm={handleEnrollConfirm}
        loading={enrollLoading}
      />
    </Paper>
  );
};

export default ScheduleWidget;
