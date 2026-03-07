import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Chip, LinearProgress, Paper, Typography } from '@mui/material';
import { availabilityService } from '@/services/api';
import {
  AvailabilityDashboardDaySummary,
  AvailabilityDashboardOverview,
  DayOfWeek,
  DAY_OF_WEEK_LABELS,
} from '@/types';
import { SkeletonWidget } from '@/components/SkeletonLoader';

const DAY_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

const AvailabilityOverviewWidget = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<AvailabilityDashboardOverview | null>(null);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await availabilityService.getDashboardOverview();
        if (response.success && response.data) {
          setOverview(response.data);
        } else {
          setError(response.message || 'No se pudo cargar la disponibilidad');
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'No se pudo cargar la disponibilidad');
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  const byDay = useMemo(() => {
    const mapped = new Map<DayOfWeek, AvailabilityDashboardDaySummary>();
    (overview?.byDay || []).forEach((row) => mapped.set(row.dayOfWeek, row));
    return DAY_ORDER.map((day) => {
      const row = mapped.get(day);
      return {
        dayOfWeek: day,
        slotsCount: row?.slotsCount || 0,
        usersCount: row?.usersCount || 0,
        weeklySlots: row?.weeklySlots || 0,
        monthlySlots: row?.monthlySlots || 0,
      };
    });
  }, [overview]);

  const maxUsersCount = Math.max(1, ...byDay.map((item) => item.usersCount));

  if (loading) return <SkeletonWidget height={280} />;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        backgroundColor: 'background.paper',
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h6" fontWeight="bold">
          Disponibilidad de Usuarios
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip size="small" color="primary" label={`${overview?.totals.totalUsers || 0} usuarios`} />
          <Chip size="small" variant="outlined" label={`${overview?.totals.totalSlots || 0} tramos activos`} />
          <Chip size="small" variant="outlined" label={`Semanal: ${overview?.totals.weeklySlots || 0}`} />
          <Chip size="small" variant="outlined" label={`Mensual: ${overview?.totals.monthlySlots || 0}`} />
        </Box>
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Box display="flex" flexDirection="column" gap={1.5}>
        {byDay.map((item) => {
          const progress = Math.round((item.usersCount / maxUsersCount) * 100);
          return (
            <Box key={item.dayOfWeek}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2" fontWeight="bold">
                  {DAY_OF_WEEK_LABELS[item.dayOfWeek]}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.usersCount} usuarios · {item.slotsCount} tramos
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: 'action.hover',
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

export default AvailabilityOverviewWidget;
