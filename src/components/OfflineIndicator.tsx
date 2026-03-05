import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';
import { WifiOff } from '@mui/icons-material';

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Snackbar
      open={isOffline}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 90, md: 24 } }} // Adjust for bottom navigation on mobile
      TransitionComponent={Slide}
    >
      <Alert 
        severity="warning" 
        variant="filled" 
        icon={<WifiOff />}
        sx={{ width: '100%', boxShadow: 3 }}
      >
        Modo sin conexión activado
      </Alert>
    </Snackbar>
  );
};

export default OfflineIndicator;
