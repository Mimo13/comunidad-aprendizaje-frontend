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
  Chip,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Grid,
  Tooltip,
  InputAdornment,
  Card,
  CardContent
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Palette as PaletteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { roleService } from '@/services/api';
import { useSnackbar } from 'notistack';
import { APP_MODULES } from '@/constants/modules';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SkeletonTable } from '@/components/SkeletonLoader';

// Colores predefinidos para roles
const PRESET_COLORS = [
  '#1976d2', // Azul
  '#d32f2f', // Rojo
  '#2e7d32', // Verde
  '#ed6c02', // Naranja
  '#9c27b0', // Púrpura
  '#0288d1', // Azul claro
  '#7b1fa2', // Violeta
  '#388e3c', // Verde oscuro
  '#fbc02d', // Amarillo
  '#455a64', // Gris azulado
  '#000000', // Negro
  '#5d4037', // Marrón
];

interface Role {
  id: string;
  name: string;
  description?: string;
  color?: string;
  permissions?: string[];
  _count?: {
    users: number;
  };
}

const AdminRolesPage = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<{ name: string; description: string; color: string; permissions: string[] }>({ 
    name: '', description: '', color: '#1976d2', permissions: [] 
  });
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredRoles(roles.filter(role => 
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    } else {
      setFilteredRoles(roles);
    }
  }, [roles, searchTerm]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await roleService.getAllRoles();
      if (response.success && response.data) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error('Error loading roles', error);
      enqueueSnackbar('Error al cargar roles', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({ 
        name: role.name, 
        description: role.description || '', 
        color: role.color || '#1976d2',
        permissions: role.permissions || []
      });
    } else {
      setEditingRole(null);
      setFormData({ name: '', description: '', color: '#1976d2', permissions: [] });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingRole(null);
    setFormData({ name: '', description: '', color: '#1976d2', permissions: [] });
  };

  const handleTogglePermission = (moduleKey: string) => {
    setFormData(prev => {
      const currentPermissions = prev.permissions || [];
      if (currentPermissions.includes(moduleKey)) {
        return { ...prev, permissions: currentPermissions.filter(p => p !== moduleKey) };
      } else {
        return { ...prev, permissions: [...currentPermissions, moduleKey] };
      }
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        enqueueSnackbar('El nombre del perfil es obligatorio', { variant: 'warning' });
        return;
      }

      if (editingRole) {
        await roleService.updateRole(editingRole.id, formData);
        enqueueSnackbar('Perfil actualizado', { variant: 'success' });
      } else {
        await roleService.createRole(formData);
        enqueueSnackbar('Perfil creado', { variant: 'success' });
      }
      handleClose();
      loadRoles();
    } catch (error: any) {
      console.error('Error saving role', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error al guardar perfil', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string, userCount: number = 0) => {
    if (userCount > 0) {
      enqueueSnackbar(`No se puede eliminar: hay ${userCount} usuarios con este perfil`, { variant: 'warning' });
      return;
    }

    if (window.confirm('¿Estás seguro de que quieres eliminar este perfil?')) {
      try {
        await roleService.deleteRole(id);
        enqueueSnackbar('Perfil eliminado', { variant: 'success' });
        loadRoles();
      } catch (error: any) {
        console.error('Error deleting role', error);
        enqueueSnackbar(error?.response?.data?.message || 'Error al eliminar', { variant: 'error' });
      }
    }
  };

  return (
    <motion.div layoutId="admin-card-roles" style={{ width: '100%' }}>
      <Box p={3} sx={{ bgcolor: 'background.paper', borderRadius: 4, minHeight: '80vh' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/settings')} sx={{ color: 'text.secondary' }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold">Administración de Perfiles</Typography>
            <Chip 
              label={`${roles.length} Roles`} 
              color="primary" 
              size="small" 
              variant="outlined" 
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Buscar perfil..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Nuevo Perfil
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
        {loading ? (
          <Box p={2}>
            <SkeletonTable rows={6} columns={6} />
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Color</TableCell>
                <TableCell align="center">Permisos</TableCell>
                <TableCell align="center">Usuarios</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.id} hover>
                  <TableCell>
                    <Chip 
                      label={role.name} 
                      size="small" 
                      sx={{ 
                        bgcolor: role.color || '#e0e0e0', 
                        color: role.color ? '#fff' : 'inherit',
                        fontWeight: 'bold',
                        minWidth: 80
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {role.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {role.color && (
                      <Tooltip title={role.color}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              borderRadius: '50%', 
                              bgcolor: role.color,
                              border: '2px solid rgba(0,0,0,0.1)',
                              cursor: 'help'
                            }} 
                          />
                        </Box>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={role.permissions?.join(', ') || 'Sin permisos'}>
                      <Chip 
                        icon={<SecurityIcon style={{ fontSize: 16 }} />}
                        label={role.name === 'ADMIN' ? 'Acceso Total' : `${role.permissions?.length || 0} Módulos`}
                        variant="outlined"
                        size="small"
                        color={role.name === 'ADMIN' ? 'success' : 'default'}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Usuarios asignados">
                      <Chip 
                        icon={<GroupIcon style={{ fontSize: 16 }} />}
                        label={role._count?.users || 0}
                        variant={role._count?.users ? 'filled' : 'outlined'}
                        color={role._count?.users ? 'primary' : 'default'}
                        size="small"
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpen(role)} size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton color="error" onClick={() => handleDelete(role.id, role._count?.users)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', pb: 2 }}>
          {editingRole ? 'Editar Perfil' : 'Nuevo Perfil'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box display="flex" flexDirection="column" gap={3} mt={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  autoFocus
                  label="Nombre del Perfil"
                  fullWidth
                  variant="outlined"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  helperText="El nombre se guardará en mayúsculas (ej. COORDINADOR)"
                  required
                />
                <Box mt={2}>
                   <TextField
                    label="Descripción"
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe brevemente las responsabilidades de este rol..."
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
                      <PaletteIcon fontSize="small" /> Color Identificativo
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      {PRESET_COLORS.map(color => (
                        <Box
                          key={color}
                          onClick={() => setFormData({ ...formData, color })}
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: color,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            border: formData.color === color ? '3px solid #000' : '1px solid #ddd',
                            transition: 'all 0.2s',
                            '&:hover': { transform: 'scale(1.1)' }
                          }}
                        />
                      ))}
                    </Box>
                    <TextField
                      label="Color Hex"
                      fullWidth
                      size="small"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      type="color"
                      sx={{ '& input': { height: 40, cursor: 'pointer' } }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider>
              <Chip label="Permisos de Acceso" size="small" />
            </Divider>
            
            <Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Selecciona los módulos a los que tendrán acceso los usuarios con este perfil.
                {formData.name === 'ADMIN' && (
                  <Typography component="span" color="error" fontWeight="bold" ml={1}>
                    * El rol ADMIN tiene acceso total por defecto.
                  </Typography>
                )}
              </Typography>
              
              <Grid container spacing={2}>
                {APP_MODULES.map((module) => {
                  const isAdmin = formData.name === 'ADMIN';
                  const isChecked = isAdmin || formData.permissions.includes(module.key);
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={module.key}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          height: '100%',
                          bgcolor: isChecked ? 'action.hover' : 'background.paper',
                          border: isChecked ? '1px solid #1976d2' : '1px solid #ddd'
                        }}
                      >
                        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                          <FormControlLabel
                            control={
                              <Checkbox 
                                checked={isChecked} 
                                onChange={() => handleTogglePermission(module.key)} 
                                name={module.key}
                                disabled={isAdmin}
                                color="primary"
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {module.label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block' }}>
                                  {module.description}
                                </Typography>
                              </Box>
                            }
                            sx={{ width: '100%', m: 0, alignItems: 'flex-start' }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: 'background.default' }}>
          <Button onClick={handleClose} variant="outlined">Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formData.name.trim()}>
            {editingRole ? 'Actualizar Perfil' : 'Crear Perfil'}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </motion.div>
  );
};

export default AdminRolesPage;
