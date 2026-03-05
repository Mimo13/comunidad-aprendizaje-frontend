import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SnackbarProvider } from 'notistack';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

// Componentes
import AnimatedRoutes from '@/components/AnimatedRoutes';
import SplashScreen from '@/components/SplashScreen';

// Hooks y stores
import { useAuthStore } from '@/stores/authStore';

// Configurar dayjs en español
dayjs.locale('es');

// Crear cliente de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Tema personalizado para Material-UI (Solo modo oscuro)
const getTheme = () => createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#108AB1',
      light: '#40B6D6',
      dark: '#0B6B88',
    },
    secondary: {
      main: '#F78C6A',
      light: '#FAB48C',
      dark: '#D96C48',
    },
    background: {
      default: '#073A4B',
      paper: '#0A4D5A',
    },
    error: { main: '#F04770' },
    warning: { main: '#FFD167' },
    info: { main: '#108AB1' },
    success: { main: '#06D7A0' },
    text: {
      primary: '#E6F2F6',
      secondary: '#B6D5DE',
    },
    divider: 'rgba(255,255,255,0.12)',
  },
  typography: {
    fontFamily: '"SN Pro", Inter, Roboto, Helvetica, Arial, sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '1.75rem',
      '@media (min-width:600px)': { fontSize: '2rem' },
      '@media (min-width:900px)': { fontSize: '2.25rem' },
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.5rem',
      '@media (min-width:600px)': { fontSize: '1.75rem' },
      '@media (min-width:900px)': { fontSize: '2rem' },
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.375rem',
      '@media (min-width:600px)': { fontSize: '1.5rem' },
      '@media (min-width:900px)': { fontSize: '1.75rem' },
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 24,
          padding: '8px 16px',
          '@media (max-width:600px)': { padding: '8px 12px' },
          '@media (min-width:600px) and (max-width:900px)': { padding: '10px 16px' },
        },
        containedPrimary: {
          color: '#073A4B',
          backgroundColor: '#FFD167',
          '&:hover': { backgroundColor: '#F7C84E' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
          borderRadius: 16,
          backgroundColor: '#0A4D5A',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#073A4B',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#0A4D5A',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.04)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.15)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.25)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#108AB1',
          },
        },
        input: {
          color: '#E6F2F6',
          '::placeholder': {
            color: 'rgba(230,242,246,0.7)',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'rgba(230,242,246,0.8)',
          '&.Mui-focused': { color: '#FFD167' },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            padding: '6px 8px',
            fontSize: '0.8125rem',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.04)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0A4D5A',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0A4D5A',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(255,209,103,0.18)',
          },
          '&:hover': {
            backgroundColor: 'rgba(16,138,177,0.12)',
          },
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          color: '#E6F2F6',
        },
        page: {
          '&.Mui-selected': {
            backgroundColor: '#FFD167',
            color: '#073A4B',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0A4D5A',
          color: '#E6F2F6',
        },
        arrow: {
          color: '#0A4D5A',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255,255,255,0.12)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        colorDefault: {
          backgroundColor: '#108AB1',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.04)',
          color: '#E6F2F6',
          border: '1px solid rgba(255,255,255,0.12)',
          '&.MuiAlert-standardError': {
            backgroundColor: 'rgba(240,71,112,0.16)',
            color: '#F04770',
            borderColor: 'rgba(240,71,112,0.32)'
          },
          '&.MuiAlert-standardSuccess': {
            backgroundColor: 'rgba(6,215,160,0.16)',
            color: '#06D7A0',
            borderColor: 'rgba(6,215,160,0.32)'
          },
          '&.MuiAlert-standardInfo': {
            backgroundColor: 'rgba(16,138,177,0.16)',
            color: '#40B6D6',
            borderColor: 'rgba(16,138,177,0.32)'
          },
          '&.MuiAlert-standardWarning': {
            backgroundColor: 'rgba(255,209,103,0.16)',
            color: '#FFD167',
            borderColor: 'rgba(255,209,103,0.32)'
          },
          '&.MuiAlert-filledError': { backgroundColor: '#F04770', color: '#073A4B' },
          '&.MuiAlert-filledSuccess': { backgroundColor: '#06D7A0', color: '#073A4B' },
          '&.MuiAlert-filledInfo': { backgroundColor: '#108AB1', color: '#073A4B' },
          '&.MuiAlert-filledWarning': { backgroundColor: '#FFD167', color: '#073A4B' },
        },
        icon: { color: '#E6F2F6' },
        action: { color: '#E6F2F6' },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          backgroundColor: '#0A4D5A',
          color: '#E6F2F6',
          boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.12)'
        },
        message: { color: '#E6F2F6' },
        action: { color: '#FFD167' },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40 },
        indicator: { backgroundColor: '#FFD167', height: 3, borderRadius: 3 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          color: '#B6D5DE',
          minHeight: 40,
          '&.Mui-selected': { color: '#E6F2F6' },
          '@media (max-width:600px)': { padding: '8px 12px' },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 46,
          height: 28,
          padding: 0,
        },
        switchBase: {
          color: '#B6D5DE',
          padding: 4,
          '&.Mui-checked': {
            color: '#FFD167',
            transform: 'translateX(18px)',
            '& + .MuiSwitch-track': {
              backgroundColor: 'rgba(16,138,177,0.6)',
              opacity: 1,
            },
          },
          '&:hover': { backgroundColor: 'rgba(16,138,177,0.10)' },
        },
        thumb: {
          boxShadow: 'none',
          width: 20,
          height: 20,
        },
        track: {
          borderRadius: 28 / 2,
          backgroundColor: 'rgba(255,255,255,0.2)',
          opacity: 1,
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#B6D5DE',
          '&.Mui-checked': { color: '#FFD167' },
          '&:hover': { backgroundColor: 'rgba(16,138,177,0.08)' },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: '#B6D5DE',
          '&.Mui-checked': { color: '#108AB1' },
          '&:hover': { backgroundColor: 'rgba(16,138,177,0.08)' },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          color: '#E6F2F6',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          color: '#E6F2F6',
          '&:focus': { backgroundColor: 'transparent' },
        },
        icon: { color: '#B6D5DE' },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: { backgroundColor: '#0A4D5A' },
        listbox: { backgroundColor: '#0A4D5A', color: '#E6F2F6' },
        option: {
          '&[aria-selected="true"]': { backgroundColor: 'rgba(255,209,103,0.18)' },
          '&:hover': { backgroundColor: 'rgba(16,138,177,0.12)' },
        },
        popupIndicator: { color: '#B6D5DE' },
        clearIndicator: { color: '#B6D5DE' },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: { color: 'rgba(230,242,246,0.85)' },
      },
    },

  },
});

function App() {
  const { loadUser, login } = useAuthStore();
  // Eliminamos el estado de 'mode' y dejamos el tema estático
  const theme = useMemo(() => getTheme(), []);

  // Estado para splash
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashExit, setSplashExit] = useState(false);
  const [minDelayDone, setMinDelayDone] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Cargar usuario y/o hacer auto-login si está activado "recordar"
  useEffect(() => {
    const init = async () => {
      try {
        await loadUser();
        // Si no hay sesión pero hay credenciales guardadas, intentar auto-login
        // NOTA: Eliminada la lógica de auto-login inseguro por contraseña en texto plano.
        // Ahora "Recordar usuario" solo recuerda el email en el formulario de login.
        // La persistencia real debe hacerse vía cookies de sesión (httpOnly) o refresh tokens.
      } finally {
        setInitialLoadDone(true);
      }
    };
    init();
  }, [loadUser, login]);

  // Garantizar al menos 3 segundos de splash
  useEffect(() => {
    const t = setTimeout(() => setMinDelayDone(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Cuando ambos han terminado, lanzar salida animada y ocultar
  useEffect(() => {
    if (splashVisible && minDelayDone && initialLoadDone) {
      setSplashExit(true);
      const hide = setTimeout(() => setSplashVisible(false), 650);
      return () => clearTimeout(hide);
    }
  }, [splashVisible, minDelayDone, initialLoadDone]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          {/* Splash como capa superior */}
          <SplashScreen visible={splashVisible} exiting={splashExit} />
          <LocalizationProvider 
            dateAdapter={AdapterDayjs} 
            adapterLocale="es"
            localeText={{
              cancelButtonLabel: 'Cancelar',
              okButtonLabel: 'Aceptar',
              clearButtonLabel: 'Limpiar',
              todayButtonLabel: 'Hoy',
            }}
          >
            <Router>
              <AnimatedRoutes />
            </Router>
          </LocalizationProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
