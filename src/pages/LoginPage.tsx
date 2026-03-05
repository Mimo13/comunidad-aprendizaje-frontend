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
  useMediaQuery,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@mui/material/styles';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const rememberedEmail = typeof localStorage !== 'undefined' ? (localStorage.getItem('rememberEmail') || '') : '';
  // Eliminada la carga de password insegura
  const remembered = typeof localStorage !== 'undefined' ? (localStorage.getItem('rememberMe') === 'true') : false;
  const [formData, setFormData] = useState({
    email: rememberedEmail,
    password: '',
  });
  const [remember, setRemember] = useState(remembered);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Limpiar error específico al escribir
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors({ ...errors, [e.target.name]: undefined, general: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Trim spaces from email to avoid copy-paste errors
    const cleanEmail = formData.email.trim();

    try {
      await login({ email: cleanEmail, password: formData.password });
      // Guardar email si "Recordar usuario" está marcado, pero NUNCA la contraseña
      if (remember) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberEmail', cleanEmail);
        // Eliminamos la contraseña del localStorage por seguridad
        localStorage.removeItem('rememberPassword');
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberEmail');
        localStorage.removeItem('rememberPassword');
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      // Asignar errores específicos si el backend los devuelve, sino general
      const message = err.message || 'Error al iniciar sesión';
      if (message.toLowerCase().includes('usuario') || message.toLowerCase().includes('email')) {
         setErrors({ email: message });
      } else if (message.toLowerCase().includes('contraseña')) {
         setErrors({ password: message });
      } else {
         setErrors({ general: 'Credenciales inválidas. Por favor, inténtalo de nuevo.' });
      }
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ 
        backgroundColor: 'background.default', 
        px: { xs: 2, sm: 0 },
        pb: '250px' // Subir el módulo visualmente (padding bottom aumentado)
      }}
    >
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, maxWidth: 480, width: '100%', backgroundColor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Iniciar Sesión
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
            label="Contraseña"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            margin="normal"
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password}
          />
          <FormControlLabel
            control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
            label="Recordar mi email"
          />
          <Box display="flex" justifyContent="flex-start" mb={2}>
            <Link to="/forgot-password" style={{ textDecoration: 'none', fontSize: '0.875rem', color: theme.palette.warning.main }}>
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>
          <Box display="flex" justifyContent="center">
            <Button
              type="submit"
              fullWidth={isMobile}
              variant="contained"
              color="warning"
              sx={{ mt: 1, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
            </Button>
          </Box>
        </form>

        <Box textAlign="center">
            <Typography variant="body2">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" style={{ textDecoration: 'none', color: theme.palette.warning.main }}>
                Regístrate aquí
              </Link>
            </Typography>
          </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;