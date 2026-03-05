import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  TextField
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { holidayService } from '@/services/api';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import { SkeletonTable } from '@/components/SkeletonLoader';

const HOLIDAY_TYPES = {
  NATIONAL: { label: 'Nacional', color: '#D32F2F' },
  REGIONAL: { label: 'Autonómico', color: '#2E7D32' },
  LOCAL: { label: 'Local', color: '#1976D2' }
};

const AdminHolidaysPage = () => {
  const navigate = useNavigate();
  const [holidays, setHolidays] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState<{ name: string, date: string, description: string, type: 'NATIONAL' | 'REGIONAL' | 'LOCAL' }>({ 
    name: '', date: '', description: '', type: 'NATIONAL' 
  });
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const response = await holidayService.getHolidays();
      if (response.success && response.data) {
        setHolidays(response.data);
      }
    } catch (error) {
      console.error('Error loading holidays', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await holidayService.createHoliday(newHoliday);
      enqueueSnackbar('Festivo creado', { variant: 'success' });
      setOpen(false);
      setNewHoliday({ name: '', date: '', description: '', type: 'NATIONAL' });
      loadHolidays();
    } catch (error) {
      enqueueSnackbar('Error al crear festivo', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar festivo?')) {
      try {
        await holidayService.deleteHoliday(id);
        enqueueSnackbar('Festivo eliminado', { variant: 'success' });
        loadHolidays();
      } catch (error) {
        enqueueSnackbar('Error al eliminar', { variant: 'error' });
      }
    }
  };

  return (
    <motion.div layoutId="admin-card-holidays" style={{ width: '100%' }}>
      <Box p={3} sx={{ bgcolor: 'background.paper', borderRadius: 4, minHeight: '80vh' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/settings')} sx={{ color: 'text.secondary' }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold">Administración de Festivos</Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Nuevo Festivo
          </Button>
        </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        {loading ? (
          <Box p={2}>
            <SkeletonTable rows={5} columns={5} />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holidays.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell>{dayjs(holiday.date).format('DD/MM/YYYY')}</TableCell>
                  <TableCell>{holiday.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={HOLIDAY_TYPES[holiday.type as keyof typeof HOLIDAY_TYPES]?.label || holiday.type}
                      sx={{ 
                        backgroundColor: HOLIDAY_TYPES[holiday.type as keyof typeof HOLIDAY_TYPES]?.color || '#ccc',
                        color: '#fff',
                        fontWeight: 'bold'
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{holiday.description || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton color="error" onClick={() => handleDelete(holiday.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Nuevo Festivo</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Nombre"
              fullWidth
              value={newHoliday.name}
              onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
            />
            <TextField
              label="Fecha"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newHoliday.date}
              onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
            />
            <TextField
              select
              label="Tipo de Festivo"
              fullWidth
              value={newHoliday.type}
              onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value as any })}
            >
              {Object.entries(HOLIDAY_TYPES).map(([key, value]) => (
                <MenuItem key={key} value={key}>
                  {value.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Descripción (Opcional)"
              fullWidth
              value={newHoliday.description}
              onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>
      </Box>
    </motion.div>
  );
};

export default AdminHolidaysPage;
