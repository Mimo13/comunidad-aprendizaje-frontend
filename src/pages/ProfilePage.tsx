import { Typography, Paper, Box, TextField, Button, Avatar, Divider } from '@mui/material';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import NotificationSettings from '@/components/NotificationSettings';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

const ProfilePage = () => {
  const { user, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
        Mi Perfil
      </Typography>

      <Paper elevation={1} sx={{ p: { xs: 3, sm: 4 }, maxWidth: 720, width: '100%', backgroundColor: 'background.paper', borderRadius: 2, mx: 'auto' }}>
        <Box display="flex" alignItems="center" mb={3} flexDirection={{ xs: 'column', sm: 'row' }}>
          <Avatar sx={{ width: 64, height: 64, mr: { xs: 0, sm: 3 }, mb: { xs: 1.5, sm: 0 } }}>
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box textAlign={{ xs: 'center', sm: 'left' }}>
            <Typography variant="h6">{user?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.role}
            </Typography>
          </Box>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Nombre completo"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={!isEditing}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            value={user?.email}
            disabled
            margin="normal"
          />
          <TextField
            fullWidth
            label="Teléfono"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={!isEditing}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Rol"
            value={user?.role}
            disabled
            margin="normal"
          />

          {isEditing ? (
            <Box display="flex" gap={2} mt={3} flexDirection={{ xs: 'column', sm: 'row' }}>
              <Button variant="contained" type="submit" fullWidth={isMobile}>
                Guardar
              </Button>
              <Button variant="outlined" onClick={handleCancel} fullWidth={isMobile}>
                Cancelar
              </Button>
            </Box>
          ) : (
            <Button variant="contained" onClick={() => setIsEditing(true)} sx={{ mt: 3 }} fullWidth={isMobile}>
              Editar Perfil
            </Button>
          )}
        </form>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          Configuración de Notificaciones
        </Typography>
        <NotificationSettings />
      </Paper>
    </Box>
  );
};

export default ProfilePage;