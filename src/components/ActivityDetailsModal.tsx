import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  Chip,
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Slide,
  IconButton
} from '@mui/material';
import { AccessTime as TimeIcon, LocationOn as LocationIcon, School as SchoolIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import { ActivityWithEnrollments, ActivityStatus, ACTIVITY_STATUS_LABELS, FileAttachment } from '@/types';
import { enrollmentService, activityService } from '@/services/api';
import { usePermissions } from '@/stores/authStore';
import { TransitionProps } from '@mui/material/transitions';
import FileUpload from './FileUpload';
import CalendarExportButton from './CalendarExportButton';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

interface ActivityDetailsModalProps {
  activity: ActivityWithEnrollments | null;
  open: boolean;
  onClose: () => void;
  onEnrollSuccess?: () => void;
  onEdit?: (activity: ActivityWithEnrollments) => void;
  onEnrollUser?: () => void;
}

const ActivityDetailsModal: React.FC<ActivityDetailsModalProps> = ({ 
  activity, 
  open, 
  onClose,
  onEnrollSuccess,
  onEdit,
  onEnrollUser
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = usePermissions();
  
  const [localActivity, setLocalActivity] = useState<ActivityWithEnrollments | null>(null);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);
  const [adminActionLoading, setAdminActionLoading] = useState<string | null>(null);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  useEffect(() => {
    setLocalActivity(activity);
    setEnrollError(null);
    setEnrollSuccess(null);
    
    // Cargar archivos adjuntos si hay actividad
    if (activity) {
      loadActivityFiles(activity.id);
    }
  }, [activity, open]);

  const renderStatusChip = (a: ActivityWithEnrollments) => {
    const isPast = dayjs(a.date).isBefore(dayjs());
    const isActiveNoSpots = a.status === ActivityStatus.ACTIVE && (a.availableSpots || 0) === 0;
    let chipColor: 'default' | 'success' | 'error' | 'info' = 'default';
    let sxStyles: any = { color: '#fff' };
    
    if (a.status === ActivityStatus.CANCELLED) chipColor = 'error';
    else if (a.status === ActivityStatus.COMPLETED || isPast) chipColor = 'info';
    else if (a.status === ActivityStatus.ACTIVE && a.availableSpots > 0) chipColor = 'success';
    
    if (isActiveNoSpots) {
      chipColor = 'default';
      sxStyles = { bgcolor: (theme: any) => theme.palette.warning.main, color: '#fff' };
    }
    
    const label = isActiveNoSpots ? 'Activa (sin plazas)' : ACTIVITY_STATUS_LABELS[a.status];
    
    return (
      <Chip
        label={label}
        color={chipColor}
        variant="filled"
        sx={sxStyles}
      />
    );
  };

  const canEnroll = (a?: ActivityWithEnrollments | null) => {
    if (!a) return false;
    const notPast = dayjs(a.date).isAfter(dayjs());
    return a.status === ActivityStatus.ACTIVE && a.availableSpots > 0 && !a.isUserEnrolled && notPast;
  };

  const canUnenroll = (a?: ActivityWithEnrollments | null) => {
    if (!a) return false;
    if (!a.isUserEnrolled) return false;
    const minutesDiff = dayjs(a.date).diff(dayjs(), 'minute');
    if (minutesDiff <= 0) return false; // ya pasó
    return minutesDiff >= 120; // respetar restricción de 2 horas
  };

  const handleEnroll = async () => {
    if (!localActivity) return;
    setEnrollLoading(true);
    setEnrollError(null);
    try {
      const res = await enrollmentService.enrollInActivity(localActivity.id);
      if (res.success) {
        setEnrollSuccess('Te has inscrito correctamente');
        setLocalActivity(prev => prev ? {
          ...prev,
          availableSpots: Math.max(0, (prev.availableSpots || 0) - 1),
          isUserEnrolled: true
        } : null);
        if (onEnrollSuccess) onEnrollSuccess();
      } else {
        setEnrollError(res.message || 'No se pudo realizar la inscripción');
      }
    } catch (e: any) {
      setEnrollError(e?.response?.data?.message || e?.message || 'Error al inscribirse');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!localActivity) return;
    setEnrollLoading(true);
    setEnrollError(null);
    try {
      const res = await enrollmentService.unenrollFromActivity(localActivity.id);
      if (res.success) {
        setEnrollSuccess('Has cancelado tu inscripción');
        setLocalActivity(prev => prev ? {
          ...prev,
          availableSpots: (prev.availableSpots || 0) + 1,
          isUserEnrolled: false
        } : null);
        if (onEnrollSuccess) onEnrollSuccess();
      } else {
        setEnrollError(res.message || 'No se pudo cancelar la inscripción');
      }
    } catch (e: any) {
      setEnrollError(e?.response?.data?.message || e?.message || 'Error al cancelar la inscripción');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleAdminCancel = async (enrollmentId: string) => {
    if (!localActivity) return;
    setAdminActionLoading(enrollmentId);
    setEnrollError(null);
    try {
      const res = await enrollmentService.cancelEnrollment(enrollmentId);
      if (res.success) {
        setEnrollSuccess('Inscripción cancelada correctamente');
        setLocalActivity(prev => prev ? {
          ...prev,
          availableSpots: (prev.availableSpots || 0) + 1,
          enrollments: (prev.enrollments || []).filter(e => e.id !== enrollmentId)
        } : null);
        if (onEnrollSuccess) onEnrollSuccess();
      } else {
        setEnrollError(res.message || 'No se pudo cancelar la inscripción');
      }
    } catch (e: any) {
      setEnrollError(e?.response?.data?.message || e?.message || 'Error al cancelar la inscripción');
    } finally {
      setAdminActionLoading(null);
    }
  };

  const loadActivityFiles = async (activityId: string) => {
    setFilesLoading(true);
    try {
      const response = await activityService.getActivityFiles(activityId);
      if (response.success) {
        setFiles(response.data || []);
      }
    } catch (error) {
      console.error('Error al cargar archivos:', error);
    } finally {
      setFilesLoading(false);
    }
  };

  if (!localActivity && !activity) return null;
  const displayActivity = localActivity || activity;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth 
      fullScreen={isMobile}
      TransitionComponent={Transition}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton edge="start" color="inherit" onClick={onClose} aria-label="back">
          <ArrowBackIcon />
        </IconButton>
        {displayActivity ? displayActivity.title : 'Actividad'}
      </DialogTitle>
      <DialogContent>
        {enrollSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setEnrollSuccess(null)}>
            {enrollSuccess}
          </Alert>
        )}
        {enrollError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setEnrollError(null)}>
            {enrollError}
          </Alert>
        )}

        {displayActivity && (
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Fecha y Hora</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <TimeIcon fontSize="small" color="action" />
                <Typography>
                  {dayjs(displayActivity.date).format('DD/MM/YYYY')} <br/>
                  {dayjs(displayActivity.date).format('HH:mm')} - {displayActivity.endDate ? dayjs(displayActivity.endDate).format('HH:mm') : ''}
                </Typography>
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Asignatura</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <SchoolIcon fontSize="small" color="action" />
                <Box>
                  <Typography>{displayActivity.subject}</Typography>
                  {displayActivity.teacherName && (
                    <Typography variant="body2" color="text.secondary">
                      Prof: {displayActivity.teacherName}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Aula</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <LocationIcon fontSize="small" color="action" />
                <Typography>{displayActivity.classroom}</Typography>
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Estado</Typography>
              {renderStatusChip(displayActivity)}
            </Box>
            <Box gridColumn={{ xs: '1', sm: '1 / span 2' }}>
              <Typography variant="subtitle2" color="text.secondary">Descripción</Typography>
              <Typography>{displayActivity.description || 'Sin descripción'}</Typography>
            </Box>

            {/* Archivos adjuntos */}
            <Box gridColumn={{ xs: '1', sm: '1 / span 2' }} mt={2}>
              <FileUpload
                activityId={displayActivity.id}
                files={files}
                onFilesChange={setFiles}
                canUpload={user?.role === 'ADMIN' || user?.role === 'DIRECTIVA' || displayActivity.createdById === user?.id}
                canDelete={user?.role === 'ADMIN' || user?.role === 'DIRECTIVA' || displayActivity.createdById === user?.id}
              />
            </Box>

            {/* Listado de inscritos para admin */}
            {(user?.role === 'ADMIN' || user?.role === 'DIRECTIVA' || user?.role === 'PROFESOR') && displayActivity.enrollments && displayActivity.enrollments.length > 0 && (
              <Box gridColumn={{ xs: '1', sm: '1 / span 2' }} mt={2}>
                <Typography variant="h6" fontSize="1rem" gutterBottom>
                  Inscritos ({displayActivity.enrollments.length})
                </Typography>
                <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider', p: 1 }}>
                  {displayActivity.enrollments.map((en) => (
                    <Box key={en.id} display="flex" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }} flexDirection={{ xs: 'column', sm: 'row' }} gap={{ xs: 0.5, sm: 0 }}>
                      <Typography variant="body2" sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                        {en.user.name} ({en.user.role})
                      </Typography>
                      <Button 
                        size="small" 
                        color="error" 
                        onClick={() => handleAdminCancel(en.id)}
                        disabled={!!adminActionLoading}
                      >
                        {adminActionLoading === en.id ? 'Cancelando...' : 'Cancelar'}
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button onClick={onClose} color="inherit" fullWidth={isMobile}>
            Cerrar
          </Button>
          {onEdit && (user?.role === 'ADMIN' || user?.role === 'DIRECTIVA' || (displayActivity && user && displayActivity.createdById === user.id)) && (
             <Button
               onClick={() => displayActivity && onEdit(displayActivity)}
               color="primary"
               sx={{ ml: { sm: 1 } }}
               fullWidth={isMobile}
             >
               Editar
             </Button>
          )}
          {onEnrollUser && (user?.role === 'ADMIN' || user?.role === 'DIRECTIVA') && (
            <Button
              onClick={onEnrollUser}
              color="primary"
              sx={{ ml: { sm: 1 } }}
              fullWidth={isMobile}
            >
              Inscribir usuario
            </Button>
          )}
          {/* Botón de exportación de calendario */}
          {displayActivity && (
            <Box sx={{ mt: { xs: 1, sm: 0 }, ml: { sm: 1 } }}>
              <CalendarExportButton
                activityId={displayActivity.id}
                activityTitle={displayActivity.title}
                variant="button"
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          )}
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'auto' }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          {canUnenroll(displayActivity) && (
            <Button 
              variant="outlined" 
              color="error" 
              onClick={handleUnenroll}
              disabled={enrollLoading}
              fullWidth={isMobile}
            >
              {enrollLoading ? 'Cancelando...' : 'Cancelar inscripción'}
            </Button>
          )}
          {canEnroll(displayActivity) && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleEnroll}
              disabled={enrollLoading}
              fullWidth={isMobile}
            >
              {enrollLoading ? 'Inscribiendo...' : 'Inscribirse'}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ActivityDetailsModal;