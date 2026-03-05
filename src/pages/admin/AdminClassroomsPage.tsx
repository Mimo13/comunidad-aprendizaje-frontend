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
  TextField
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { classroomService } from '@/services/api';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SkeletonTable } from '@/components/SkeletonLoader';

const AdminClassroomsPage = () => {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [newClassroom, setNewClassroom] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    try {
      setLoading(true);
      const response = await classroomService.getAllClassrooms();
      if (response.success && response.data) {
        setClassrooms(response.data);
      }
    } catch (error) {
      console.error('Error loading classrooms', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await classroomService.createClassroom({ name: newClassroom });
      enqueueSnackbar('Aula creada', { variant: 'success' });
      setOpen(false);
      setNewClassroom('');
      loadClassrooms();
    } catch (error) {
      enqueueSnackbar('Error al crear aula', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar aula?')) {
      try {
        await classroomService.deleteClassroom(id);
        enqueueSnackbar('Aula eliminada', { variant: 'success' });
        loadClassrooms();
      } catch (error) {
        enqueueSnackbar('Error al eliminar', { variant: 'error' });
      }
    }
  };

  return (
    <motion.div layoutId="admin-card-classrooms" style={{ width: '100%' }}>
      <Box p={3} sx={{ bgcolor: 'background.paper', borderRadius: 4, minHeight: '80vh' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/settings')} sx={{ color: 'text.secondary' }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold">Administración de Aulas</Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Nueva Aula
          </Button>
        </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, maxWidth: 600 }}>
        {loading ? (
          <Box p={2}>
            <SkeletonTable rows={5} columns={2} />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classrooms.map((classroom) => (
                <TableRow key={classroom.id} hover>
                  <TableCell>{classroom.name}</TableCell>
                  <TableCell align="right">
                    <IconButton color="error" onClick={() => handleDelete(classroom.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {classrooms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No hay aulas registradas</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Nueva Aula</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre del aula"
            fullWidth
            variant="outlined"
            value={newClassroom}
            onChange={(e) => setNewClassroom(e.target.value)}
          />
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

export default AdminClassroomsPage;
