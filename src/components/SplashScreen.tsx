import { Box, Typography, LinearProgress } from '@mui/material';
import React, { useEffect } from 'react';

import asset1x from '@/assets/1x/Asset 1.png';
import asset12x from '@/assets/2x/Asset 1@2x.png';
import asset13x from '@/assets/3x/Asset 1@3x.png';
import asset2x from '@/assets/1x/Asset 2.png';
import asset22x from '@/assets/2x/Asset 2@2x.png';
import asset23x from '@/assets/3x/Asset 2@3x.png';

interface SplashScreenProps {
  visible: boolean;
  exiting: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ visible, exiting }) => {
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  if (!visible) return null;

  return (
    // Contenedor overlay sin fondo para permitir ver la base detrás
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Base inferior (verde) con pico a la derecha y curva a la izquierda */}
      <Box sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50vh',
        bgcolor: '#06D7A0',
        borderTopLeftRadius: 'clamp(140px, 20vw, 240px)', // Curva a la izquierda
        borderTopRightRadius: 0, // Pico a la derecha
        transform: exiting ? 'translateY(100%)' : 'translateY(0)',
        willChange: 'transform',
        transition: 'transform 800ms ease-in-out',
        zIndex: 0,
      }} />

      {/* Capa superior (rosa) con curva a la derecha */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 'clamp(100px, 14vh, 160px)',
          bgcolor: '#f04770',
          borderBottomLeftRadius: 0, // Recto a la izquierda
          borderBottomRightRadius: 'clamp(140px, 20vw, 240px)', // Curva a la derecha
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          transform: exiting ? 'translateY(-100%)' : 'translateY(0)',
          willChange: 'transform',
          transition: 'transform 800ms ease-in-out',
          zIndex: 1,
        }}
      >
        {/* Contenedor de logos */}
        <Box sx={{ textAlign: 'center' }}>
          <Box component="img"
            src={asset1x}
            srcSet={`${asset1x} 1x, ${asset12x} 2x, ${asset13x} 3x`}
            alt="IES Cártima"
            sx={{ width: { xs: 120, sm: 140 }, height: 'auto', mb: 2, position: 'relative', transform: 'translate(calc(clamp(4px, 0.7vw, 10px) + 5px), calc(-1 * clamp(50px, 6vh, 100px)))' }}
          />
          <Box component="img"
            src={asset2x}
            srcSet={`${asset2x} 1x, ${asset22x} 2x, ${asset23x} 3x`}
            alt="Familias Colaboradoras"
            sx={{ width: { xs: 110, sm: 130 }, height: 'auto', position: 'relative', transform: 'translate(calc(-1 * clamp(4px, 0.7vw, 10px) - 5px), 0)' }}
          />
          <Typography
            sx={{
              fontFamily: '"SN Pro", sans-serif',
              fontWeight: 800,
              color: 'white',
              fontSize: { xs: 'clamp(40px, 16vw, 80px)', sm: 'clamp(100px, 18vw, 100px)' },
              lineHeight: 1,
              mt: 4, // Aumentado margen superior para bajar el texto
              whiteSpace: 'nowrap',
              textAlign: 'center',
              width: '100%',
              textShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          >
            IES CARTIMA
          </Typography>
          <Typography
            sx={{
              fontFamily: '"SN Pro", sans-serif',
              fontWeight: 500,
              color: 'white',
              fontSize: { xs: 'clamp(20px, 8vw, 40px)', sm: 'clamp(50px, 9vw, 50px)' }, // 50% of IES CARTIMA size
              lineHeight: 1,
              mt: 1,
              whiteSpace: 'nowrap',
              textAlign: 'center',
              width: '100%',
              textShadow: '0 2px 10px rgba(0,0,0,0.1)',
              letterSpacing: '0.2em', // Aumentado el espaciado entre letras
            }}
          >
            A.M.P.A. EL NOGAL
          </Typography>

          {/* Módulo de carga */}
          <Box sx={{ mt: 4, width: '240px', mx: 'auto', textAlign: 'center' }}>
            <Typography 
              sx={{ 
                color: 'white', 
                fontFamily: '"SN Pro", sans-serif', 
                mb: 1, 
                fontSize: '1rem',
                fontWeight: 500
              }}
            >
              Cargando...
            </Typography>
            <LinearProgress 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'white',
                  borderRadius: 4
                }
              }} 
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SplashScreen;