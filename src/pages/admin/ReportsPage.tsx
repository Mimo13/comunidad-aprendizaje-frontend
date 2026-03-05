import { Box, Typography, Grid, Paper, Button, useTheme, Divider, Chip } from '@mui/material';
import { 
  PictureAsPdf as PdfIcon, 
  Print as PrintIcon, 
  Email as EmailIcon,
  Assessment as AssessmentIcon,
  PeopleAlt as PeopleIcon,
  EventAvailable as AttendanceIcon,
  ArrowBack as ArrowBackIcon,
  RecentActors as CensusIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ReportsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const reportTypes = [
    {
      id: 'activities',
      title: 'Informe de Actividades',
      description: 'Resumen detallado de todas las actividades del curso, incluyendo estado, profesores y ubicación.',
      icon: <AssessmentIcon fontSize="large" />,
      color: theme.palette.primary.main,
      tags: ['Mensual', 'Trimestral']
    },
    {
      id: 'users',
      title: 'Informe de Familias',
      description: 'Listado completo de familias colaboradoras, datos de contacto y estado de participación.',
      icon: <PeopleIcon fontSize="large" />,
      color: theme.palette.secondary.main,
      tags: ['Datos Personales', 'GDPR']
    },
    {
      id: 'attendance',
      title: 'Registro de Asistencia',
      description: 'Estadísticas de asistencia y cobertura de plazas en las actividades ofertadas.',
      icon: <AttendanceIcon fontSize="large" />,
      color: theme.palette.success.main,
      tags: ['Estadísticas']
    },
    {
      id: 'census',
      title: 'Listado de Familias Participantes',
      description: 'Relación completa de familias y miembros del AMPA que están dados de alta en la web.',
      icon: <CensusIcon fontSize="large" />,
      color: theme.palette.info.main,
      tags: ['Censo', 'Usuarios']
    }
  ];

  const handleAction = (action: string, reportTitle: string) => {
    // Aquí iría la lógica real de generación de PDF, impresión o envío
    console.log(`${action} para ${reportTitle}`);
    // Por ahora solo un alert o log
    alert(`Acción: ${action} - ${reportTitle}\n\nEsta funcionalidad generará el documento correspondiente.`);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/settings')}
          sx={{ color: 'text.secondary' }}
        >
          Volver
        </Button>
        <Typography variant="h4" fontWeight="bold">
          Informes y Documentación
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" mb={4} sx={{ maxWidth: 800 }}>
        Genera, descarga o envía informes detallados sobre la actividad del centro. 
        Los documentos se generan en formato PDF optimizado para impresión.
      </Typography>

      <Grid container spacing={3}>
        {reportTypes.map((report) => (
          <Grid item xs={12} lg={6} key={report.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      borderRadius: 3, 
                      bgcolor: `${report.color}22`, 
                      color: report.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {report.icon}
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {report.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {report.description}
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {report.tags.map(tag => (
                        <Chip 
                          key={tag} 
                          label={tag} 
                          size="small" 
                          sx={{ 
                            bgcolor: 'rgba(255,255,255,0.05)', 
                            color: 'text.secondary',
                            fontSize: '0.7rem' 
                          }} 
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box display="flex" gap={1} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    size="small"
                    onClick={() => handleAction('Imprimir', report.title)}
                    sx={{ borderColor: 'divider', color: 'text.primary' }}
                  >
                    Imprimir
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<EmailIcon />}
                    size="small"
                    onClick={() => handleAction('Enviar por Email', report.title)}
                    sx={{ borderColor: 'divider', color: 'text.primary' }}
                  >
                    Enviar
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PdfIcon />}
                    size="small"
                    onClick={() => handleAction('Descargar PDF', report.title)}
                    sx={{ 
                      bgcolor: report.color, 
                      color: theme.palette.getContrastText(report.color),
                      '&:hover': { bgcolor: report.color, opacity: 0.9 }
                    }}
                  >
                    Descargar
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ReportsPage;
