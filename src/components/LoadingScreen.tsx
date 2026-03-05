import { CircularProgress, Box, Typography } from '@mui/material';

const LoadingScreen = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      gap={2}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" color="text.secondary">
        Cargando Familias Colaboradoras...
      </Typography>
    </Box>
  );
};

export default LoadingScreen;