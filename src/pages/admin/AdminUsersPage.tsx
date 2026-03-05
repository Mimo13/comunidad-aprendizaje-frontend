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
  MenuItem,
  Chip,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Tooltip,
  Switch
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { userService, roleService } from '@/services/api';
import { notificationService } from '@/services/notificationService';
import { User, UserRole } from '@/types';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SkeletonTable } from '@/components/SkeletonLoader';

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> & { password?: string } | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);

  // Estado para el diálogo de notificaciones
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [sendToAll, setSendToAll] = useState(true);
  const [sendingNotification, setSendingNotification] = useState(false);

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredUsers(users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    } else {
      setFilteredUsers(users);
    }
  }, [users, searchTerm]);

  const loadRoles = async () => {
    try {
      const response = await roleService.getAllRoles();
      if (response.success && response.data) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error('Error loading roles', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading users', error);
      enqueueSnackbar('Error al cargar usuarios', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!editingUser) return;

      if (editingUser.id) {
        await userService.updateUser(editingUser.id, editingUser);
        enqueueSnackbar('Usuario actualizado', { variant: 'success' });
      } else {
        if (!editingUser.password) {
          enqueueSnackbar('La contraseña es obligatoria', { variant: 'warning' });
          return;
        }
        await userService.createUser(editingUser as any);
        enqueueSnackbar('Usuario creado', { variant: 'success' });
      }
      setOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Error saving user', error);
      enqueueSnackbar('Error al guardar usuario', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await userService.deleteUser(id);
        enqueueSnackbar('Usuario eliminado', { variant: 'success' });
        loadUsers();
      } catch (error) {
        console.error('Error deleting user', error);
        enqueueSnackbar('Error al eliminar usuario', { variant: 'error' });
      }
    }
  };

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationBody.trim()) {
      enqueueSnackbar('Título y mensaje son obligatorios', { variant: 'warning' });
      return;
    }

    setSendingNotification(true);
    try {
      // Si sendToAll es true, enviamos a todos los usuarios cargados
      // Idealmente el backend debería tener un flag 'sendToAll', pero por ahora usaremos los IDs visibles
      const userIds = sendToAll ? users.map(u => u.id) : []; // TODO: Implementar selección manual si es false
      
      if (userIds.length === 0) {
        enqueueSnackbar('No hay destinatarios seleccionados', { variant: 'warning' });
        setSendingNotification(false);
        return;
      }

      const response = await notificationService.sendToMultipleUsers(userIds, notificationTitle, notificationBody);
      
      if (response.success) {
        enqueueSnackbar('Notificación enviada correctamente', { variant: 'success' });
        setNotificationOpen(false);
        setNotificationTitle('');
        setNotificationBody('');
      } else {
        enqueueSnackbar(response.message || 'Error al enviar notificación', { variant: 'error' });
      }
    } catch (error: any) {
      console.error('Error sending notification', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error al enviar notificación', { variant: 'error' });
    } finally {
      setSendingNotification(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await userService.updateUser(user.id, { isActive: !user.isActive });
      enqueueSnackbar(`Usuario ${!user.isActive ? 'activado' : 'bloqueado'}`, { 
        variant: !user.isActive ? 'success' : 'warning' 
      });
      loadUsers();
    } catch (error) {
      console.error('Error updating user status', error);
      enqueueSnackbar('Error al actualizar estado', { variant: 'error' });
    }
  };

  const handleDisableTwoFactor = async (user: User) => {
    if (!window.confirm(`¿Desactivar 2FA para ${user.name}?`)) return;
    try {
      const response = await userService.disableUserTwoFactor(user.id);
      if (response.success) {
        enqueueSnackbar('2FA desactivado correctamente', { variant: 'success' });
        loadUsers();
      } else {
        enqueueSnackbar(response.message || 'No se pudo desactivar 2FA', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error disabling 2FA', error);
      enqueueSnackbar('Error al desactivar 2FA', { variant: 'error' });
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { bgcolor: '#d32f2f', color: '#ffffff' }; // Rojo oscuro - Texto blanco
      case 'DIRECTIVA':
        return { bgcolor: '#ed6c02', color: '#ffffff' }; // Naranja - Texto blanco
      case 'PROFESOR':
        return { bgcolor: '#1976d2', color: '#ffffff' }; // Azul - Texto blanco
      case 'AMPA':
        return { bgcolor: '#2e7d32', color: '#ffffff' }; // Verde oscuro - Texto blanco
      case 'FAMILIA':
        return { bgcolor: '#00bcd4', color: '#000000' }; // Cyan - Texto negro
      default:
        return { bgcolor: '#757575', color: '#ffffff' }; // Gris oscuro - Texto blanco
    }
  };

  return (
    <motion.div layoutId="admin-card-users" style={{ width: '100%' }}>
      <Box p={3} sx={{ bgcolor: 'background.paper', borderRadius: 4, minHeight: '80vh' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/settings')} sx={{ color: 'text.secondary' }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold">Administración de Usuarios</Typography>
            <Chip 
              label={`${users.length} Usuarios`} 
              color="primary" 
              size="small" 
              variant="outlined" 
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Buscar usuario..."
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
            variant="outlined" 
            startIcon={<NotificationsIcon />}
            onClick={() => setNotificationOpen(true)}
          >
            Notificar
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => { setEditingUser({}); setOpen(true); }}
          >
            Nuevo Usuario
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
        {loading ? (
          <Box p={2}>
            <SkeletonTable rows={10} columns={6} />
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} hover sx={{ opacity: user.isActive ? 1 : 0.6 }}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {user.name}
                      {!user.isActive && (
                         <Chip label="Bloqueado" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                      )}
                      {user.hasTwoFactor && (
                        <Chip label="2FA" size="small" color="info" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {(() => {
                      const style = getRoleStyle(user.role);
                      return (
                        <Chip 
                          label={user.role} 
                          sx={{ 
                            backgroundColor: style.bgcolor,
                            color: style.color,
                            fontWeight: 'bold',
                            minWidth: 80
                          }}
                          size="small"
                        />
                      );
                    })()}
                  </TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={user.isActive}
                          onChange={() => handleToggleStatus(user)}
                          color="success"
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2" color={user.isActive ? 'text.primary' : 'text.disabled'}>
                          {user.isActive ? 'Activo' : 'Bloqueado'}
                        </Typography>
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => { setEditingUser(user); setOpen(true); }} size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    {user.hasTwoFactor && (
                      <Tooltip title="Desactivar 2FA">
                        <IconButton onClick={() => handleDisableTwoFactor(user)} size="small" color="warning">
                          <SecurityIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Eliminar">
                      <IconButton color="error" onClick={() => handleDelete(user.id)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No se encontraron usuarios</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser?.id ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Nombre Completo"
              fullWidth
              value={editingUser?.name || ''}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
            />
            <TextField
              label="Email"
              fullWidth
              value={editingUser?.email || ''}
              onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
            />
            {!editingUser?.id && (
              <TextField
                label="Contraseña"
                type="password"
                fullWidth
                value={editingUser?.password || ''}
                onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
              />
            )}
             {editingUser?.id && (
              <TextField
                label="Nueva Contraseña (dejar en blanco para no cambiar)"
                type="password"
                fullWidth
                value={editingUser?.password || ''}
                onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
              />
            )}
            <TextField
              select
              label="Rol"
              fullWidth
              value={editingUser?.role || ''}
              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.name}>{role.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Teléfono"
              fullWidth
              value={editingUser?.phone || ''}
              onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
            />
            {editingUser?.id && (
                <TextField
                select
                label="Estado"
                fullWidth
                value={editingUser?.isActive ? 'true' : 'false'}
                onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.value === 'true' })}
              >
                <MenuItem value="true">Activo</MenuItem>
                <MenuItem value="false">Inactivo</MenuItem>
              </TextField>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de envío de notificaciones */}
      <Dialog open={notificationOpen} onClose={() => setNotificationOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enviar Notificación Push</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Título"
              fullWidth
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
              placeholder="Ej: Nueva actividad disponible"
            />
            <TextField
              label="Mensaje"
              fullWidth
              multiline
              rows={3}
              value={notificationBody}
              onChange={(e) => setNotificationBody(e.target.value)}
              placeholder="Ej: Se ha publicado una nueva actividad en el centro..."
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={sendToAll}
                  onChange={(e) => setSendToAll(e.target.checked)}
                  color="primary"
                />
              }
              label={`Enviar a todos los usuarios (${users.length})`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationOpen(false)} disabled={sendingNotification}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSendNotification}
            disabled={sendingNotification || !notificationTitle || !notificationBody}
          >
            {sendingNotification ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </motion.div>
  );
};

export default AdminUsersPage;
