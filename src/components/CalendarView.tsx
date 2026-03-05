import { useState, useMemo } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Grid, 
  Chip, 
  useTheme, 
  useMediaQuery,
  Tooltip
} from '@mui/material';
import { 
  ChevronLeft as ChevronLeftIcon, 
  ChevronRight as ChevronRightIcon,
  Event as EventIcon 
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { ActivityWithEnrollments, ActivityStatus, ACTIVITY_STATUS_LABELS } from '@/types';
import { Holiday } from '@/types';

interface CalendarViewProps {
  currentDate: Dayjs;
  onMonthChange: (date: Dayjs) => void;
  activities: ActivityWithEnrollments[];
  onActivityClick: (activity: ActivityWithEnrollments) => void;
  loading?: boolean;
  holidays?: Holiday[];
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const CalendarView = ({ 
  currentDate, 
  onMonthChange, 
  activities, 
  onActivityClick,
  loading = false,
  holidays = []
}: CalendarViewProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Generar días del calendario
  const calendarDays = useMemo(() => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    
    // Ajustar para que la semana empiece en Lunes (dayjs domingo es 0)
    // Queremos Lunes=0, Domingo=6
    let startDayOfWeek = startOfMonth.day() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Domingo

    const days = [];
    
    // Días previos (mes anterior)
    const prevMonth = startOfMonth.subtract(1, 'month');
    const daysInPrevMonth = prevMonth.daysInMonth();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.date(daysInPrevMonth - i),
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Días del mes actual
    const today = dayjs();
    for (let i = 1; i <= startOfMonth.daysInMonth(); i++) {
      const date = startOfMonth.date(i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.isSame(today, 'day')
      });
    }

    // Días siguientes (mes siguiente) para completar 42 celdas (6 semanas) o 35 (5 semanas)
    const remainingCells = 42 - days.length; // Usar 6 filas fijas para estabilidad
    const nextMonth = startOfMonth.add(1, 'month');
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: nextMonth.date(i),
        isCurrentMonth: false,
        isToday: false
      });
    }

    return days;
  }, [currentDate]);

  // Agrupar actividades por fecha
  const activitiesByDate = useMemo(() => {
    const map: Record<string, ActivityWithEnrollments[]> = {};
    activities.forEach(activity => {
      const dateKey = dayjs(activity.date).format('YYYY-MM-DD');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(activity);
    });
    return map;
  }, [activities]);

  // Mapa de festivos para acceso rápido
  const holidaysMap = useMemo(() => {
    const map: Record<string, Holiday> = {};
    holidays.forEach(h => {
      // Ajustar la fecha del festivo para ignorar la hora y asegurar formato correcto
      const dateKey = dayjs(h.date).format('YYYY-MM-DD');
      map[dateKey] = h;
    });
    return map;
  }, [holidays]);

  const getStatusColor = (status: ActivityStatus, spots: number) => {
    if (status === ActivityStatus.CANCELLED) return theme.palette.error.main;
    if (status === ActivityStatus.COMPLETED) return theme.palette.info.main;
    if (spots === 0) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const getDayBackgroundColor = (dayObj: any, isWeekend: boolean, holiday?: Holiday) => {
    if (dayObj.isToday) return 'rgba(255, 209, 103, 0.3)';

    if (holiday) {
      switch (holiday.type) {
        case 'NATIONAL': return '#D32F2F';
        case 'REGIONAL': return '#2E7D32';
        case 'LOCAL':    return '#1976D2';
        default:         return theme.palette.error.light;
      }
    }
    
    if (isWeekend) return theme.palette.action.hover;
    
    return theme.palette.background.paper;
  };

  const getDayTextColor = (dayObj: any, isWeekend: boolean, holiday?: Holiday) => {
    if (dayObj.isToday) return theme.palette.text.primary;
    if (holiday || isWeekend) return '#fff';
    return theme.palette.text.primary;
  };

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
      {/* Header del Calendario */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <IconButton onClick={() => onMonthChange(currentDate.subtract(1, 'month'))}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h5" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
          {currentDate.format('MMMM YYYY')}
        </Typography>
        <IconButton onClick={() => onMonthChange(currentDate.add(1, 'month'))}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Grid de días de la semana */}
      <Grid container spacing={0} sx={{ borderBottom: `1px solid ${theme.palette.divider}`, mb: 1 }}>
        {WEEKDAYS.map((day, index) => (
          <Grid item xs={12 / 7} key={day} sx={{ textAlign: 'center', py: 1 }}>
            <Typography 
              variant="subtitle2" 
              fontWeight="bold" 
              color={index >= 5 ? 'error.main' : 'text.secondary'} // Sáb y Dom en rojo en la cabecera
            >
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Grid del Calendario */}
      <Box 
        display="grid" 
        gridTemplateColumns="repeat(7, 1fr)" 
        gap="1px"
        bgcolor={theme.palette.divider}
        border={`1px solid ${theme.palette.divider}`}
        sx={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}
      >
        {calendarDays.map((dayObj, index) => {
          const dateKey = dayObj.date.format('YYYY-MM-DD');
          const dayActivities = activitiesByDate[dateKey] || [];
          const holiday = holidaysMap[dateKey];
          const isWeekend = dayObj.date.day() === 0 || dayObj.date.day() === 6; // 0=Domingo, 6=Sábado
          const textColor = getDayTextColor(dayObj, isWeekend, holiday);
          
          return (
            <Box 
              key={index} 
              bgcolor={getDayBackgroundColor(dayObj, isWeekend, holiday)}
              minHeight={{ xs: 80, md: 120 }}
              p={1}
              sx={{ 
                opacity: dayObj.isCurrentMonth ? 1 : 0.5,
                '&:hover': { bgcolor: 'action.hover' },
                position: 'relative'
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                 {/* Indicador de festivo (punto de color o etiqueta pequeña) */}
                 {holiday ? (
                  <Tooltip title={`${holiday.name} (${holiday.type})`}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.65rem', 
                        color: '#fff', 
                        fontWeight: 'bold',
                        lineHeight: 1.2,
                        maxWidth: '70%',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {holiday.name}
                    </Typography>
                  </Tooltip>
                ) : <Box />}

                <Typography 
                  variant="body2" 
                  fontWeight={dayObj.isToday ? 'bold' : (isWeekend || holiday ? 'bold' : 'normal')}
                  color={textColor}
                  mb={0.5}
                >
                  {dayObj.date.date()}
                </Typography>
              </Box>

              <Box display="flex" flexDirection="column" gap={0.5} sx={{ overflow: 'hidden' }}>
                {dayActivities.slice(0, isMobile ? 2 : 4).map((activity) => (
                  <Tooltip key={activity.id} title={`${dayjs(activity.date).format('HH:mm')} - ${activity.title} (${activity.availableSpots} plazas)`}>
                    <Box 
                      onClick={() => onActivityClick(activity)}
                      sx={{ 
                        cursor: 'pointer',
                        bgcolor: getStatusColor(activity.status, activity.availableSpots),
                        color: '#fff',
                        borderRadius: 1,
                        px: 0.5,
                        py: 0.25,
                        fontSize: '0.7rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      {!isMobile && (
                        <span style={{ opacity: 0.8, fontSize: '0.65rem' }}>
                          {dayjs(activity.date).format('HH:mm')}
                        </span>
                      )}
                      <span style={{ fontWeight: 500 }}>
                        {activity.title}
                        {activity.teacherName && (
                          <span style={{ fontWeight: 400, opacity: 0.9, marginLeft: '4px', fontSize: '0.65rem' }}>
                            ({activity.teacherName.split(' ')[0]})
                          </span>
                        )}
                      </span>
                    </Box>
                  </Tooltip>
                ))}
                {dayActivities.length > (isMobile ? 2 : 4) && (
                  <Typography variant="caption" color="text.secondary" align="center" display="block">
                    +{dayActivities.length - (isMobile ? 2 : 4)} más
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

export default CalendarView;