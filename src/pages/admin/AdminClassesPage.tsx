import { useEffect, useState } from 'react';
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
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { classService } from '@/services/api';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SkeletonTable } from '@/components/SkeletonLoader';

const AdminClassesPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<{ id?: string; name: string }>({ name: '' });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await classService.getAllClasses();
      if (response.success && response.data) {
        setClasses(response.data);
      }
    } catch (error) {
      console.error('Error loading classes', error);
      enqueueSnackbar('Error al cargar clases', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!editingClass.name.trim()) {
        enqueueSnackbar('El nombre es obligatorio', { variant: 'warning' });
        return;
      }

      if (editingClass.id) {
        await classService.updateClass(editingClass.id, { name: editingClass.name.trim() });
        enqueueSnackbar('Clase actualizada', { variant: 'success' });
      } else {
        await classService.createClass({ name: editingClass.name.trim() });
        enqueueSnackbar('Clase creada', { variant: 'success' });
      }

      setOpen(false);
      setEditingClass({ name: '' });
      loadClasses();
    } catch (error) {
      enqueueSnackbar('Error al guardar clase', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar clase?')) return;

    try {
      await classService.deleteClass(id);
      enqueueSnackbar('Clase eliminada', { variant: 'success' });
      loadClasses();
    } catch (error) {
      enqueueSnackbar('Error al eliminar clase', { variant: 'error' });
    }
  };

  const handleCreate = () => {
    setEditingClass({ name: '' });
    setOpen(true);
  };

  const handleEdit = (entry: any) => {
    setEditingClass({ id: entry.id, name: entry.name });
    setOpen(true);
  };

  return (
    <motion.div layoutId="admin-card-classes" style={{ width: '100%' }}>
      <Box p={3} sx={{ bgcolor: 'background.paper', borderRadius: 4, minHeight: '80vh' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/settings')} sx={{ color: 'text.secondary' }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold">Administración de Clases</Typography>
          </Box>

          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Nueva Clase
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ borderRadius: 2, maxWidth: 700 }}>
          {loading ? (
            <Box p={2}>
              <SkeletonTable rows={6} columns={2} />
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
                {classes.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleEdit(entry)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(entry.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {classes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No hay clases registradas</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>{editingClass.id ? 'Editar Clase' : 'Nueva Clase'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nombre de la clase"
              fullWidth
              variant="outlined"
              value={editingClass.name}
              onChange={(e) => setEditingClass((prev) => ({ ...prev, name: e.target.value }))}
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

export default AdminClassesPage;
