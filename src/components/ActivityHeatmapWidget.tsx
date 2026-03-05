import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { statsService, HeatmapStat } from '@/services/statsService';
import { holidayService } from '@/services/api';
import DayActivitiesDialog from './DayActivitiesDialog';
import { SkeletonWidget } from '@/components/SkeletonLoader';

// Configurar locale
dayjs.locale('es');

const ActivityHeatmapWidget = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm')); // Detectar pantalla estrecha
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Map<string, HeatmapStat>>(new Map());
  const [holidays, setHolidays] = useState<Set<string>>(new Set());
  const [totalCreated, setTotalCreated] = useState(0);
  const [totalCovered, setTotalCovered] = useState(0);
  
  // Estado para el modal de actividades
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [statsRes, holidaysRes] = await Promise.all([
        statsService.getHeatmapStats(),
        holidayService.getHolidays()
      ]);

      if (statsRes.success) {
        const statsMap = new Map();
        let created = 0;
        let covered = 0;
        
        statsRes.data.forEach(stat => {
          statsMap.set(stat.date, stat);
          created += stat.count;
          covered += stat.covered;
        });

        setStats(statsMap);
        setTotalCreated(created);
        setTotalCovered(covered);
      }

      if (holidaysRes.success && holidaysRes.data) {
        const holidaysSet = new Set<string>();
        holidaysRes.data.forEach((h: any) => {
           holidaysSet.add(dayjs(h.date).format('YYYY-MM-DD'));
        });
        setHolidays(holidaysSet);
      }

    } catch (error) {
      console.error('Error loading heatmap stats', error);
    } finally {
      setLoading(false);
    }
  };

  // Configuración del curso escolar
  const currentYear = dayjs().year();
  const currentMonth = dayjs().month(); // 0-11
  // Si estamos en Sep-Dic, el curso empezó este año. Si estamos en Ene-Jun, empezó el año pasado.
  const startYear = currentMonth >= 8 ? currentYear : currentYear - 1;
  
  // Meses a mostrar: Septiembre a Junio (10 meses)
  // Indices de meses en dayjs: 0=Ene, 8=Sep, 5=Jun
  const academicMonths = [
    { name: 'Sep', monthIndex: 8, year: startYear },
    { name: 'Oct', monthIndex: 9, year: startYear },
    { name: 'Nov', monthIndex: 10, year: startYear },
    { name: 'Dic', monthIndex: 11, year: startYear },
    { name: 'Ene', monthIndex: 0, year: startYear + 1 },
    { name: 'Feb', monthIndex: 1, year: startYear + 1 },
    { name: 'Mar', monthIndex: 2, year: startYear + 1 },
    { name: 'Abr', monthIndex: 3, year: startYear + 1 },
    { name: 'May', monthIndex: 4, year: startYear + 1 },
    { name: 'Jun', monthIndex: 5, year: startYear + 1 },
  ];

  // Generar datos para cada mes
  const monthsData = academicMonths.map(m => {
    const firstDay = dayjs(new Date(m.year, m.monthIndex, 1));
    const daysInMonth = firstDay.daysInMonth();
    const days = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(dayjs(new Date(m.year, m.monthIndex, i)));
    }
    
    return { ...m, days };
  });

  // Niveles de intensidad para el color (basado en 'count')
  const getDayColor = (day: Dayjs, count: number, covered: number) => {
    const dateStr = day.format('YYYY-MM-DD');
    const isWeekend = day.day() === 0 || day.day() === 6; // 0=Dom, 6=Sab
    const isHoliday = holidays.has(dateStr);

    // Si hay actividades, PRIORIZAR mostrar la actividad sobre si es festivo
    if (count > 0) {
      // Si es festivo/fin de semana PERO tiene actividad, usamos AZUL (#108AB1)
      if (isWeekend || isHoliday) {
        return '#108AB1'; 
      }

      // Si es día laborable con actividad, usamos la escala de VERDE según cobertura
      const ratio = covered / count;
      const minOpacity = 0.35;
      const opacity = minOpacity + (ratio * (1 - minOpacity));
      
      // Usamos el verde #66bb6a (102, 187, 106)
      return `rgba(102, 187, 106, ${opacity})`;
    }

    // Si NO hay actividades y es festivo/finde, mostrar en ROJO
    if (isWeekend || isHoliday) {
      return '#F04770'; // Rojo festivo
    }

    return 'rgba(255, 255, 255, 0.05)'; // Por defecto
  };

  const getTooltipContent = (day: Dayjs, stat?: HeatmapStat) => {
    const dateStr = day.format('YYYY-MM-DD');
    const isWeekend = day.day() === 0 || day.day() === 6;
    const isHoliday = holidays.has(dateStr);
    const fullDateStr = day.format('dddd, D [de] MMMM, YYYY');

    if (isWeekend || isHoliday) {
       // Si tiene actividad, mostrar detalles además de que es festivo
       if (stat && stat.count > 0) {
        return (
          <Box textAlign="center">
            <Typography variant="caption" color="inherit" fontWeight="bold" sx={{ display: 'block', mb: 0.5 }}>{fullDateStr}</Typography>
            <Typography variant="body2" sx={{ color: '#F04770', fontWeight: 'bold', mb: 0.5, display: 'block' }}>
              {isHoliday ? 'Día Festivo' : 'Fin de Semana'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#40B6D6', fontWeight: 'bold' }}>
              {stat.count} {stat.count === 1 ? 'actividad creada' : 'actividades creadas'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#66bb6a' }}>
              {stat.covered} {stat.covered === 1 ? 'cubierta' : 'cubiertas'}
            </Typography>
          </Box>
        );
       }

       return (
        <Box textAlign="center">
          <Typography variant="caption" color="inherit" fontWeight="bold">{fullDateStr}</Typography>
          <Typography variant="body2" sx={{ color: '#F04770', fontWeight: 'bold' }}>
            {isHoliday ? 'Día Festivo' : 'Fin de Semana'}
          </Typography>
        </Box>
      );
    }

    if (!stat || stat.count === 0) {
      return (
        <Box textAlign="center">
          <Typography variant="caption" color="inherit" fontWeight="bold">{fullDateStr}</Typography>
          <Typography variant="body2">Sin actividad</Typography>
        </Box>
      );
    }

    return (
      <Box textAlign="center">
        <Typography variant="caption" color="inherit" fontWeight="bold" sx={{ display: 'block', mb: 0.5 }}>{fullDateStr}</Typography>
        <Typography variant="body2" sx={{ color: '#40B6D6', fontWeight: 'bold' }}>
          {stat.count} {stat.count === 1 ? 'actividad creada' : 'actividades creadas'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#66bb6a' }}>
          {stat.covered} {stat.covered === 1 ? 'cubierta' : 'cubiertas'}
        </Typography>
      </Box>
    );
  };

  const handleDayClick = (day: Dayjs, count: number) => {
    if (count > 0) {
      setSelectedDate(day);
      setIsDialogOpen(true);
    }
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 4, 
        backgroundColor: 'background.paper',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <DayActivitiesDialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        date={selectedDate} 
      />

      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant={isSmallScreen ? "subtitle1" : "h6"} fontWeight="bold">Actividad del Curso</Typography>
        </Box>
        <Typography variant={isSmallScreen ? "body2" : "subtitle1"} fontWeight="bold" color="text.secondary">
          {startYear} - {startYear + 1}
        </Typography>
      </Box>

      {loading ? (
        <SkeletonWidget height={200} />
      ) : (
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
          {/* Heatmap Section */}
          <Box flex={1}>
            <Box 
              sx={{ 
                overflowX: 'auto', 
                pb: 1,
                width: '100%',
                // Ocultar scrollbar
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': { 
                  display: 'none' 
                }
              }}
            >
              {isSmallScreen ? (
                // LAYOUT VERTICAL PARA MÓVIL (Rotado 90 grados visualmente)
                <Box display="flex" gap={1} justifyContent="space-between" overflow="auto" width="100%">
                  {/* Meses en columnas verticales */}
                  {monthsData.map((monthData, i) => (
                    <Box key={i} display="flex" flexDirection="column" alignItems="center" gap="2px" flex={1}>
                      {/* Nombre del mes arriba */}
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          fontSize: '0.6rem',
                          mb: 0.5
                        }}
                      >
                        {monthData.name.charAt(0)} {/* Solo inicial en móvil */}
                      </Typography>

                      {/* Días del mes en vertical */}
                      <Box display="flex" flexDirection="column" gap="2px">
                        {monthData.days.map((day) => {
                          const dateStr = day.format('YYYY-MM-DD');
                          const stat = stats.get(dateStr);
                          const count = stat?.count || 0;
                          const covered = stat?.covered || 0;

                          return (
                            <Tooltip 
                              key={dateStr} 
                              title={getTooltipContent(day, stat)} 
                              arrow 
                              placement="right"
                            >
                              <Box
                                onClick={() => handleDayClick(day, count)}
                                sx={{
                                  width: 10, // Un poco más pequeño en móvil
                                  height: 10,
                                  borderRadius: '2px',
                                  backgroundColor: getDayColor(day, count, covered),
                                  border: covered > 0 && covered >= count 
                                    ? '1px solid #66bb6a' 
                                    : '1px solid transparent',
                                  opacity: 0.9,
                                  cursor: count > 0 ? 'pointer' : 'default',
                                }}
                              />
                            </Tooltip>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                // LAYOUT HORIZONTAL ORIGINAL
                <Box display="flex" flexDirection="column" gap="3px" sx={{ lineHeight: 0 }}>
                  {monthsData.map((monthData, i) => (
                    <Box key={i} display="flex" alignItems="center" gap="3px" sx={{ height: 12 }}>
                      {/* Nombre del mes - Ancho fijo para alinear */}
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          width: 25, 
                          fontWeight: 'bold', 
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          fontSize: '0.65rem',
                          lineHeight: 1
                        }}
                      >
                        {monthData.name}
                      </Typography>

                      {/* Días del mes */}
                      {monthData.days.map((day) => {
                        const dateStr = day.format('YYYY-MM-DD');
                        const stat = stats.get(dateStr);
                        const count = stat?.count || 0;
                        const covered = stat?.covered || 0;

                        return (
                          <Tooltip 
                            key={dateStr} 
                            title={getTooltipContent(day, stat)} 
                            arrow 
                            placement="top"
                          >
                             <Box
                              onClick={() => handleDayClick(day, count)}
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '2px',
                                backgroundColor: getDayColor(day, count, covered),
                                border: covered > 0 && covered >= count 
                                  ? '1px solid #66bb6a' 
                                  : '1px solid transparent',
                                cursor: count > 0 ? 'pointer' : 'default',
                                '&:hover': {
                                  opacity: 0.8,
                                  transform: 'scale(1.2)',
                                  zIndex: 1
                                },
                                transition: 'all 0.1s ease'
                              }}
                            />
                          </Tooltip>
                        );
                      })}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* Leyenda */}
            {!isSmallScreen && (
              <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1} mt={2}>
                 <Box display="flex" alignItems="center" gap={0.5} mr={2}>
                    <Box sx={{ width: 10, height: 10, bgcolor: '#F04770', borderRadius: '2px' }} />
                    <Typography variant="caption" color="text.secondary">Festivo</Typography>
                 </Box>

                 <Box display="flex" alignItems="center" gap={0.5} mr={2}>
                    <Box sx={{ width: 10, height: 10, bgcolor: '#108AB1', borderRadius: '2px' }} />
                    <Typography variant="caption" color="text.secondary">Festivo con Actividad</Typography>
                 </Box>
                 
                 <Typography variant="caption" color="text.secondary">Cobertura</Typography>
                 <Box display="flex" gap="2px" alignItems="center">
                    <Box sx={{ width: 10, height: 10, bgcolor: 'rgba(102, 187, 106, 0.35)', borderRadius: '2px' }} />
                    <Box sx={{ width: 10, height: 10, bgcolor: 'rgba(102, 187, 106, 0.65)', borderRadius: '2px' }} />
                    <Box sx={{ width: 10, height: 10, bgcolor: 'rgba(102, 187, 106, 1)', borderRadius: '2px' }} />
                 </Box>
                 
                 <Box display="flex" alignItems="center" gap={0.5} ml={2}>
                    <Box sx={{ width: 10, height: 10, bgcolor: 'transparent', border: '1px solid #66bb6a', borderRadius: '2px' }} />
                    <Typography variant="caption" color="text.secondary">100% Cubierto</Typography>
                 </Box>
              </Box>
            )}
          </Box>

          {/* Stats Section (Right Side) */}
          <Box 
            display="flex" 
            flexDirection={{ xs: 'row', md: 'column' }} 
            justifyContent="center" 
            alignItems="center"
            gap={4}
            minWidth={120}
            sx={{
              borderLeft: { md: '1px solid rgba(255,255,255,0.1)' },
              pl: { md: 4 },
              pt: { xs: 2, md: 0 },
              borderTop: { xs: '1px solid rgba(255,255,255,0.1)', md: 'none' }
            }}
          >
            <Box textAlign="center">
              <Typography variant="h3" color="primary.main" fontWeight="bold">
                {totalCreated}
              </Typography>
              <Typography variant="caption" fontWeight="bold" sx={{ letterSpacing: 1 }}>
                CREADAS
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h3" sx={{ color: '#66bb6a' }} fontWeight="bold">
                {totalCovered}
              </Typography>
              <Typography variant="caption" fontWeight="bold" sx={{ letterSpacing: 1 }}>
                CUBIERTAS
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default ActivityHeatmapWidget;
