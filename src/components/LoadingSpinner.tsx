import { CircularProgress, Box } from '@mui/material';

const LoadingSpinner = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    sx={{ backgroundColor: '#073A4B' }}
  >
    <CircularProgress color="secondary" />
  </Box>
);

export default LoadingSpinner;