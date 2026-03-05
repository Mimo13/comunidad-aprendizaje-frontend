import { useState, useEffect } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { statsService } from '@/services/statsService';
import { SkeletonWidget } from '@/components/SkeletonLoader';

// Configurar locale
dayjs.locale('es');

const ActivityChartWidget = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Determinar inicio y fin del curso escolar actual (Sep - Jun)
    const now = dayjs();
    let startYear = now.year();
    
    // Si estamos antes de septiembre, el curso empezó el año anterior
    if (now.month() < 8) { // Enero es 0, Septiembre es 8
      startYear = now.year() - 1;
    }

    const startMonth = dayjs(`${startYear}-09-01`);
    const monthlyData = new Map();

    // Inicializar los meses de Septiembre a Junio (10 meses)
    for (let i = 0; i < 10; i++) {
      const date = startMonth.add(i, 'month');
      const key = date.format('YYYY-MM');
      const label = date.format('MMM');
      
      monthlyData.set(key, {
        name: label.charAt(0).toUpperCase() + label.slice(1),
        date: key,
        created: 0,
        covered: 0
      });
    }

    // Inicializar con estructura vacía por si falla la carga
    setChartData(Array.from(monthlyData.values()));

    try {
      const statsRes = await statsService.getHeatmapStats();

      if (statsRes.success) {
        // Rellenar con datos reales
        statsRes.data.forEach(stat => {
          const date = dayjs(stat.date);
          const key = date.format('YYYY-MM');
          
          if (monthlyData.has(key)) {
            const current = monthlyData.get(key);
            current.created += stat.count;
            current.covered += stat.covered;
          }
        });

        setChartData(Array.from(monthlyData.values()));
      }
    } catch (error) {
      console.error('Error loading chart stats', error);
      // Mantenemos la estructura vacía inicializada
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ bgcolor: 'background.paper', p: 2, border: '1px solid #eee', borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>{label}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2" sx={{ color: theme.palette.primary.main }}>
              Solicitadas: <strong>{payload[0].value}</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: '#66bb6a' }}>
              Cubiertas: <strong>{payload[1].value}</strong>
            </Typography>
          </Box>
        </Box>
      );
    }
    return null;
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 4, 
        backgroundColor: 'background.paper',
        width: '100%',
        // height: '100%' // Eliminar altura fija para que se ajuste al contenido
      }}
    >
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Evolución de Actividades
      </Typography>

      {loading ? (
        <SkeletonWidget height={300} />
      ) : (
        <Box height={300} mt={2}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCovered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#66bb6a" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#66bb6a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9e9e9e', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9e9e9e', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Area 
                type="monotone" 
                dataKey="created" 
                name="Solicitadas"
                stroke={theme.palette.primary.main} 
                fillOpacity={1} 
                fill="url(#colorCreated)" 
                strokeWidth={3}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Area 
                type="monotone" 
                dataKey="covered" 
                name="Cubiertas"
                stroke="#66bb6a" 
                fillOpacity={1} 
                fill="url(#colorCovered)" 
                strokeWidth={3}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
};

export default ActivityChartWidget;
