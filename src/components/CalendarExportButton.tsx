/**
 * Componente para exportar actividades a calendarios externos
 * Google Calendar, Outlook, Apple Calendar (.ics)
 */

import React, { useState } from 'react';
import { 
  Button, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  CalendarToday as CalendarIcon,
  MoreVert as MoreIcon,
  Event as EventIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { activityService } from '../services/api';

interface CalendarExportButtonProps {
  activityId: string;
  activityTitle: string;
  variant?: 'button' | 'icon' | 'menu';
  size?: 'small' | 'medium' | 'large';
}

const CalendarExportButton: React.FC<CalendarExportButtonProps> = ({
  activityId,
  activityTitle,
  variant = 'button',
  size = 'medium'
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const downloadICS = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/activities/${activityId}/ics`);
      
      if (!response.ok) {
        throw new Error('Error al descargar el archivo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `actividad-${activityTitle.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess('Calendario descargado exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al descargar el archivo de calendario');
      console.error('Error al descargar ICS:', err);
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  const openGoogleCalendar = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await activityService.getGoogleCalendarUrl(activityId);
      if (response.success && response.data?.url) {
        window.open(response.data.url, '_blank', 'noopener,noreferrer');
        setSuccess('Abriendo Google Calendar...');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Error al abrir Google Calendar');
      console.error('Error al abrir Google Calendar:', err);
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  const openOutlookCalendar = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await activityService.getOutlookCalendarUrl(activityId);
      if (response.success && response.data?.url) {
        window.open(response.data.url, '_blank', 'noopener,noreferrer');
        setSuccess('Abriendo Outlook Calendar...');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Error al abrir Outlook Calendar');
      console.error('Error al abrir Outlook Calendar:', err);
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  const menuItems = [
    {
      label: 'Descargar archivo (.ics)',
      icon: <DownloadIcon fontSize="small" />,
      onClick: downloadICS
    },
    {
      label: 'Agregar a Google Calendar',
      icon: <EventIcon fontSize="small" />,
      onClick: openGoogleCalendar
    },
    {
      label: 'Agregar a Outlook Calendar',
      icon: <CalendarIcon fontSize="small" />,
      onClick: openOutlookCalendar
    }
  ];

  if (variant === 'button') {
    return (
      <>
        <Button
          variant="outlined"
          size={size}
          startIcon={<CalendarIcon />}
          onClick={handleClick}
          disabled={loading}
        >
          Exportar a Calendario
        </Button>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          {menuItems.map((item, index) => (
            <MenuItem key={index} onClick={item.onClick}>
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </MenuItem>
          ))}
        </Menu>

        {loading && (
          <CircularProgress size={20} style={{ marginLeft: 8 }} />
        )}
        
        {error && (
          <Alert severity="error" style={{ marginTop: 8 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" style={{ marginTop: 8 }}>
            {success}
          </Alert>
        )}
      </>
    );
  }

  if (variant === 'icon') {
    return (
      <>
        <Tooltip title="Exportar a calendario">
          <Button
            size={size}
            onClick={handleClick}
            disabled={loading}
            sx={{ minWidth: 'auto', padding: '8px' }}
          >
            <CalendarIcon />
          </Button>
        </Tooltip>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {menuItems.map((item, index) => (
            <MenuItem key={index} onClick={item.onClick}>
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }

  return null;
};

export default CalendarExportButton;
