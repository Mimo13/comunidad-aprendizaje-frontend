import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  MenuItem,
  useMediaQuery,
} from '@mui/material';
import { useAuthStore } from '@/stores/authStore';
import { RegisterForm, UserRole } from '@/types';
import { useTheme } from '@mui/material/styles';

const ROLES = [
  { value: UserRole.FAMILIA, label: 'Familia' },
  { value: UserRole.AMPA, label: 'AMPA' },
  { value: UserRole.PROFESOR, label: 'Profesor' },
  { value: UserRole.DIRECTIVA, label: 'Directiva' },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [formData, setFormData] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: UserRole.FAMILIA,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'role' ? (value as UserRole) : value,
    });
    // Limpiar errores al escribir
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    if (name === 'password' || name === 'confirmPassword') {
       if (errors.password) setErrors({ ...errors, password: '' });
       if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: { [key: string]: string } = {};

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone,
        role: formData.role,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setErrors({ general: err.message || 'Error al registrar. El email ya puede estar en uso.' });
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ backgroundColor: 'background.default', px: { xs: 2, sm: 0 } }}
    >
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, maxWidth: 520, width: '100%', backgroundColor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Registrarse
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Familias Colaboradoras - Cártama
        </Typography>

        {errors.general && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.general}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Nombre completo"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            margin="normal"
            autoComplete="name"
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            margin="normal"
            autoComplete="email"
            error={!!errors.email}
            helperText={errors.email}
          />
          <TextField
            fullWidth
            label="Teléfono (opcional)"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            margin="normal"
            autoComplete="tel"
          />
          <TextField
            fullWidth
            select
            label="Rol"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            margin="normal"
          >
            {ROLES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Contraseña"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            margin="normal"
            autoComplete="new-password"
            error={!!errors.password}
            helperText={errors.password}
          />
          <TextField
            fullWidth
            label="Confirmar contraseña"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            margin="normal"
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
          />
          <Button
            type="submit"
            fullWidth={isMobile}
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Registrarse'}
          </Button>
        </form>

        <Box textAlign="center">
          <Typography variant="body2">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" style={{ textDecoration: 'none' }}>
              Inicia sesión aquí
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterPage;