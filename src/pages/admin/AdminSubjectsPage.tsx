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
  TextField,
  Stack
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { subjectService } from '@/services/api';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SkeletonTable } from '@/components/SkeletonLoader';

const AdminSubjectsPage = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<{id?: string, name: string, color: string}>({ name: '', color: '#108AB1' });
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await subjectService.getAllSubjects();
      if (response.success && response.data) {
        setSubjects(response.data);
      }
    } catch (error) {
      console.error('Error loading subjects', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingSubject.id) {
        await subjectService.updateSubject(editingSubject.id, { 
          name: editingSubject.name,
          color: editingSubject.color
        });
        enqueueSnackbar('Asignatura actualizada', { variant: 'success' });
      } else {
        await subjectService.createSubject({ 
          name: editingSubject.name,
          color: editingSubject.color
        });
        enqueueSnackbar('Asignatura creada', { variant: 'success' });
      }
      setOpen(false);
      setEditingSubject({ name: '', color: '#108AB1' });
      loadSubjects();
    } catch (error) {
      enqueueSnackbar('Error al guardar asignatura', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar asignatura?')) {
      try {
        await subjectService.deleteSubject(id);
        enqueueSnackbar('Asignatura eliminada', { variant: 'success' });
        loadSubjects();
      } catch (error) {
        enqueueSnackbar('Error al eliminar', { variant: 'error' });
      }
    }
  };

  const handleEdit = (subject: any) => {
    setEditingSubject({
      id: subject.id,
      name: subject.name,
      color: subject.color || '#108AB1'
    });
    setOpen(true);
  };

  const handleCreate = () => {
    setEditingSubject({ name: '', color: '#108AB1' });
    setOpen(true);
  };

  return (
    <motion.div layoutId="admin-card-subjects" style={{ width: '100%' }}>
      <Box p={3} sx={{ maxWidth: '100%', mx: 'auto', bgcolor: 'background.paper', borderRadius: 4, minHeight: '80vh' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/settings')} sx={{ color: 'text.secondary' }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold">Administración de Asignaturas</Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Nueva Asignatura
          </Button>
        </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, width: '100%' }}>
        {loading ? (
          <Box p={2}>
            <SkeletonTable rows={6} columns={3} />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Color</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell width={80}>
                    <Box 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%', 
                        bgcolor: subject.color || '#ccc',
                        border: '1px solid rgba(0,0,0,0.1)'
                      }} 
                    />
                  </TableCell>
                  <TableCell>{subject.name}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(subject)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(subject.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {subjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No hay asignaturas registradas</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editingSubject.id ? 'Editar Asignatura' : 'Nueva Asignatura'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1, minWidth: 300 }}>
            <TextField
              autoFocus
              label="Nombre de la asignatura"
              fullWidth
              variant="outlined"
              value={editingSubject.name}
              onChange={(e) => setEditingSubject({...editingSubject, name: e.target.value})}
            />
            
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography>Color:</Typography>
              <input 
                type="color" 
                value={editingSubject.color} 
                onChange={(e) => setEditingSubject({...editingSubject, color: e.target.value})}
                style={{ width: 60, height: 40, cursor: 'pointer', border: 'none', background: 'transparent' }}
              />
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                {editingSubject.color}
              </Typography>
            </Stack>
          </Stack>
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

export default AdminSubjectsPage;
