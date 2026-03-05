/**
 * Componente para exportar múltiples actividades a calendarios externos
 * Google Calendar, Outlook, Apple Calendar (.ics)
 */

import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import { 
  CalendarToday as CalendarIcon,
  Download as DownloadIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { ActivityWithEnrollments } from '@/types';
import dayjs from 'dayjs';

interface BulkCalendarExportProps {
  activities: ActivityWithEnrollments[];
  open: boolean;
  onClose: () => void;
}

const BulkCalendarExport: React.FC<BulkCalendarExportProps> = ({
  activities,
  open,
  onClose
}) => {
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSelectActivity = (activityId: string) => {
    setSelectedActivities(prev => 
      prev.includes(activityId) 
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleSelectAll = () => {
    if (selectedActivities.length === activities.length) {
      setSelectedActivities([]);
    } else {
      setSelectedActivities(activities.map(activity => activity.id));
    }
  };

  const downloadSelectedICS = async () => {
    if (selectedActivities.length === 0) {
      setError('Por favor selecciona al menos una actividad');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/activities/ics/export?ids=${selectedActivities.join(',')}`);
      
      if (!response.ok) {
        throw new Error('Error al descargar el archivo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `actividades-familias-colaboradoras-${dayjs().format('YYYY-MM-DD')}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess(`Calendario exportado con ${selectedActivities.length} actividad(es)`);
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 2000);
    } catch (err) {
      setError('Error al descargar el archivo de calendario');
      console.error('Error al descargar ICS:', err);
    } finally {
      setLoading(false);
    }
  };

  const upcomingActivities = activities
    .filter(activity => new Date(activity.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 20); // Limitar a 20 actividades para mejor rendimiento

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '80vh',
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CalendarIcon color="primary" />
          <Typography variant="h6">
            Exportar Actividades a Calendario
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Selecciona las actividades que quieres exportar a tu calendario:
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
          <ListItem button onClick={handleSelectAll}>
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={selectedActivities.length === upcomingActivities.length && upcomingActivities.length > 0}
                indeterminate={selectedActivities.length > 0 && selectedActivities.length < upcomingActivities.length}
                tabIndex={-1}
                disableRipple
              />
            </ListItemIcon>
            <ListItemText 
              primary="Seleccionar todas"
              secondary={`${upcomingActivities.length} actividad(es) disponible(s)`}
            />
          </ListItem>

          {upcomingActivities.map((activity) => {
            const isSelected = selectedActivities.includes(activity.id);
            const activityDate = dayjs(activity.date);
            
            return (
              <ListItem 
                key={activity.id} 
                button 
                onClick={() => handleSelectActivity(activity.id)}
                selected={isSelected}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={isSelected}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText
                  primary={activity.title}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        {activityDate.format('DD/MM/YYYY HH:mm')}
                      </Typography>
                      {activity.classroom && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Aula: {activity.classroom}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>

        {upcomingActivities.length === 0 && (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
            No hay actividades futuras para exportar
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={downloadSelectedICS}
          disabled={loading || selectedActivities.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
        >
          {loading ? 'Exportando...' : `Exportar (${selectedActivities.length})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkCalendarExport;