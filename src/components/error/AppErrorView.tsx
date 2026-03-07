import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface AppErrorViewProps {
  code: string;
  title: string;
  description: string;
  showBackHome?: boolean;
  primaryLabel?: string;
  primaryTo?: string;
}

const AppErrorView = ({
  code,
  title,
  description,
  showBackHome = true,
  primaryLabel,
  primaryTo,
}: AppErrorViewProps) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 640,
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Stack spacing={2}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
            ERROR {code}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {description}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
            {primaryLabel && primaryTo ? (
              <Button variant="contained" onClick={() => navigate(primaryTo)}>
                {primaryLabel}
              </Button>
            ) : null}
            {showBackHome ? (
              <Button variant="outlined" onClick={() => navigate('/dashboard')}>
                Volver al inicio
              </Button>
            ) : null}
            <Button variant="text" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default AppErrorView;
