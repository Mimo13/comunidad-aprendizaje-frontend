import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { authService } from '@/services/api';
import Asset1 from '@/assets/1x/Asset 1.png';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      if (res.success) {
        setSuccess(res.message || 'Si el email existe, recibirás instrucciones.');
        setEmail('');
      } else {
        setError(res.message || 'Error al procesar la solicitud');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de conexión. Inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ backgroundColor: 'background.default', px: 2 }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', borderRadius: 2 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <img src={Asset1} alt="Logo" style={{ height: 60, marginBottom: 16 }} />
          <Typography variant="h5" component="h1" gutterBottom align="center">
            Recuperar Contraseña
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Introduce tu email y te enviaremos instrucciones para restablecer tu contraseña.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            margin="normal"
            disabled={loading}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Enviar Instrucciones'}
          </Button>

          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/login')}
          >
            Volver al Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ForgotPasswordPage;