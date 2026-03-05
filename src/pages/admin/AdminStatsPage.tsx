import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  CircularProgress,
  IconButton,
  Skeleton
} from '@mui/material';
import {
  People as PeopleIcon,
  EventAvailable as EventIcon,
  AssignmentTurnedIn as EnrollmentIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { statsService } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import ActivityHeatmapWidget from '@/components/ActivityHeatmapWidget';
import ActivityChartWidget from '@/components/ActivityChartWidget';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { stringToColor } from '@/utils/avatarUtils';
import { SkeletonWidget } from '@/components/SkeletonLoader';

const AdminStatsPage = () => {
  const navigate = useNavigate();
  const [generalStats, setGeneralStats] = useState<any>(null);
  const [topVolunteers, setTopVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [generalRes, topVolunteersRes] = await Promise.all([
        statsService.getGeneralStats(),
        statsService.getTopVolunteers()
      ]);

      if (generalRes.success) {
        setGeneralStats(generalRes.data);
      }
      if (topVolunteersRes.success) {
        setTopVolunteers(topVolunteersRes.data || []);
      }
    } catch (error) {
      console.error('Error loading stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box p={3}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => navigate('/settings')} sx={{ color: 'text.secondary' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            Estadísticas y Reportes
          </Typography>
        </Box>

        <Grid container spacing={3} mb={4}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card elevation={2}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box width="100%">
                      <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="40%" height={40} />
                    </Box>
                    <Skeleton variant="circular" width={40} height={40} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <SkeletonWidget height={400} />
          </Grid>
          <Grid item xs={12} md={4}>
            <SkeletonWidget height={400} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
          </Box>
          <Box 
            p={1} 
            bgcolor={`${color}20`} 
            borderRadius="50%" 
            color={color}
            display="flex"
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <motion.div layoutId="admin-card-stats" style={{ width: '100%' }}>
      <Box p={3} sx={{ bgcolor: 'background.paper', borderRadius: 4, minHeight: '80vh' }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => navigate('/settings')} sx={{ color: 'text.secondary' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            Estadísticas y Reportes
          </Typography>
        </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Usuarios Totales" 
            value={generalStats?.totalUsers || 0} 
            icon={<PeopleIcon />} 
            color="#1976d2" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Actividades Creadas" 
            value={generalStats?.totalActivities || 0} 
            icon={<EventIcon />} 
            color="#ed6c02" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Participaciones" 
            value={generalStats?.totalEnrollments || 0} 
            icon={<EnrollmentIcon />} 
            color="#2e7d32" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Tasa de Actividad" 
            value={`${generalStats?.activeUsers ? Math.round((generalStats.activeUsers / generalStats.totalUsers) * 100) : 0}%`} 
            icon={<TrendingUpIcon />} 
            color="#9c27b0" 
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Box display="flex" flexDirection="column" gap={3}>
            <ActivityHeatmapWidget />
            <ActivityChartWidget />
          </Box>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 0, borderRadius: 2, height: '100%', overflow: 'hidden' }} elevation={2}>
            <Box p={2} bgcolor="primary.main" color="white">
              <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                <TrophyIcon /> Top Voluntarios
              </Typography>
            </Box>
            <List sx={{ p: 0 }}>
              {topVolunteers.map((volunteer, index) => (
                <div key={volunteer.id}>
                  <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: index < 3 ? '#ffd700' : stringToColor(volunteer.name),
                          color: index < 3 ? '#000' : '#fff',
                          fontWeight: 'bold'
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight="bold">
                          {volunteer.name}
                        </Typography>
                      }
                      secondary={
                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(100, (volunteer.enrollmentsCount / (topVolunteers[0]?.enrollmentsCount || 1)) * 100)} 
                            sx={{ width: '100%', height: 6, borderRadius: 3, flex: 1 }}
                          />
                          <Typography variant="caption" fontWeight="bold" minWidth={30}>
                            {volunteer.enrollmentsCount}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < topVolunteers.length - 1 && <Divider component="li" />}
                </div>
              ))}
              {topVolunteers.length === 0 && (
                <Box p={3} textAlign="center">
                  <Typography color="text.secondary">No hay datos suficientes</Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
      </Box>
    </motion.div>
  );
};

export default AdminStatsPage;