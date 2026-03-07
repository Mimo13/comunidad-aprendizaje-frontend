import {
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import NotificationSettings from '@/components/NotificationSettings';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { availabilityService } from '@/services/api';
import { Availability, DayOfWeek, DAY_OF_WEEK_LABELS } from '@/types';

type AvailabilityPattern = 'single' | 'weekdays' | 'all-days';

const WEEKDAY_VALUES: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

const ALL_DAY_VALUES: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

const toErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as any).response;
    if (response?.data?.message) return String(response.data.message);
  }
  if (error instanceof Error) return error.message;
  return 'No se pudo completar la operación';
};

const ProfilePage = () => {
  const { user, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availabilitySuccess, setAvailabilitySuccess] = useState<string | null>(null);
  const [editingAvailabilityId, setEditingAvailabilityId] = useState<string | null>(null);
  const [availabilityPattern, setAvailabilityPattern] = useState<AvailabilityPattern>('single');
  const [availabilityForm, setAvailabilityForm] = useState({
    dayOfWeek: DayOfWeek.MONDAY,
    startTime: '09:00',
    endTime: '10:00',
    isActive: true,
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const orderedAvailability = useMemo(() => {
    const dayOrder: Record<DayOfWeek, number> = {
      [DayOfWeek.MONDAY]: 1,
      [DayOfWeek.TUESDAY]: 2,
      [DayOfWeek.WEDNESDAY]: 3,
      [DayOfWeek.THURSDAY]: 4,
      [DayOfWeek.FRIDAY]: 5,
      [DayOfWeek.SATURDAY]: 6,
      [DayOfWeek.SUNDAY]: 7,
    };
    return [...availability].sort((a, b) => {
      const daySort = dayOrder[a.dayOfWeek] - dayOrder[b.dayOfWeek];
      if (daySort !== 0) return daySort;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [availability]);

  useEffect(() => {
    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      setAvailabilityError(null);
      try {
        const response = await availabilityService.getMyAvailability();
        setAvailability(response.data || []);
      } catch (error) {
        setAvailabilityError(toErrorMessage(error));
      } finally {
        setAvailabilityLoading(false);
      }
    };

    loadAvailability();
  }, []);

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

  const handleAvailabilityFieldChange = (
    field: 'dayOfWeek' | 'startTime' | 'endTime' | 'isActive',
    value: string | boolean
  ) => {
    setAvailabilityForm((prev) => ({ ...prev, [field]: value }));
  };

  const targetDaysForPattern = (): DayOfWeek[] => {
    if (availabilityPattern === 'weekdays') return WEEKDAY_VALUES;
    if (availabilityPattern === 'all-days') return ALL_DAY_VALUES;
    return [availabilityForm.dayOfWeek];
  };

  const resetAvailabilityForm = () => {
    setEditingAvailabilityId(null);
    setAvailabilityPattern('single');
    setAvailabilityForm({
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '09:00',
      endTime: '10:00',
      isActive: true,
    });
  };

  const handleEditAvailability = (item: Availability) => {
    setEditingAvailabilityId(item.id);
    setAvailabilityPattern('single');
    setAvailabilityForm({
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      isActive: item.isActive,
    });
    setAvailabilityError(null);
    setAvailabilitySuccess(null);
  };

  const handleDeleteAvailability = async (id: string) => {
    setAvailabilitySaving(true);
    setAvailabilityError(null);
    setAvailabilitySuccess(null);
    try {
      await availabilityService.deleteAvailability(id);
      setAvailability((prev) => prev.filter((item) => item.id !== id));
      if (editingAvailabilityId === id) {
        resetAvailabilityForm();
      }
      setAvailabilitySuccess('Disponibilidad eliminada correctamente');
    } catch (error) {
      setAvailabilityError(toErrorMessage(error));
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const handleSubmitAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvailabilityError(null);
    setAvailabilitySuccess(null);

    if (availabilityForm.startTime >= availabilityForm.endTime) {
      setAvailabilityError('La hora de inicio debe ser menor que la hora de fin');
      return;
    }

    setAvailabilitySaving(true);
    try {
      if (editingAvailabilityId) {
        const response = await availabilityService.updateAvailability(editingAvailabilityId, availabilityForm);
        if (response.data) {
          setAvailability((prev) => prev.map((item) => (item.id === editingAvailabilityId ? response.data! : item)));
        }
        setAvailabilitySuccess('Disponibilidad actualizada correctamente');
        resetAvailabilityForm();
      } else {
        const targetDays = targetDaysForPattern();
        const createdItems: Availability[] = [];
        const errors: string[] = [];

        for (const day of targetDays) {
          try {
            const response = await availabilityService.createAvailability({
              dayOfWeek: day,
              startTime: availabilityForm.startTime,
              endTime: availabilityForm.endTime,
              isActive: availabilityForm.isActive,
            });
            if (response.data) createdItems.push(response.data);
          } catch (error) {
            const message = toErrorMessage(error);
            errors.push(`${DAY_OF_WEEK_LABELS[day]}: ${message}`);
          }
        }

        if (createdItems.length > 0) {
          setAvailability((prev) => [...prev, ...createdItems]);
        }

        if (errors.length > 0) {
          setAvailabilityError(errors.join(' | '));
        } else {
          setAvailabilitySuccess(
            targetDays.length > 1
              ? 'Disponibilidades creadas correctamente para el patrón seleccionado'
              : 'Disponibilidad creada correctamente'
          );
        }

        if (errors.length === 0 || createdItems.length > 0) {
          resetAvailabilityForm();
        }
      }
    } finally {
      setAvailabilitySaving(false);
    }
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

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          Mi disponibilidad semanal
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Define tramos horarios por día. Puedes aplicar el mismo tramo a un día, a lunes-viernes o a toda la semana.
        </Typography>

        {availabilityError && <Alert severity="error" sx={{ mb: 2 }}>{availabilityError}</Alert>}
        {availabilitySuccess && <Alert severity="success" sx={{ mb: 2 }}>{availabilitySuccess}</Alert>}

        <Box component="form" onSubmit={handleSubmitAvailability} sx={{ mb: 3 }}>
          <Stack spacing={2}>
            {!editingAvailabilityId && (
              <FormControl fullWidth>
                <InputLabel id="availability-pattern-label">Patrón rápido</InputLabel>
                <Select
                  labelId="availability-pattern-label"
                  label="Patrón rápido"
                  value={availabilityPattern}
                  onChange={(event) => setAvailabilityPattern(event.target.value as AvailabilityPattern)}
                >
                  <MenuItem value="single">Un solo día</MenuItem>
                  <MenuItem value="weekdays">Lunes a viernes</MenuItem>
                  <MenuItem value="all-days">Toda la semana</MenuItem>
                </Select>
              </FormControl>
            )}

            {(availabilityPattern === 'single' || editingAvailabilityId) && (
              <FormControl fullWidth>
                <InputLabel id="availability-day-label">Día de la semana</InputLabel>
                <Select
                  labelId="availability-day-label"
                  label="Día de la semana"
                  value={availabilityForm.dayOfWeek}
                  onChange={(event) => handleAvailabilityFieldChange('dayOfWeek', event.target.value as DayOfWeek)}
                >
                  {ALL_DAY_VALUES.map((day) => (
                    <MenuItem key={day} value={day}>{DAY_OF_WEEK_LABELS[day]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Hora inicio"
                type="time"
                value={availabilityForm.startTime}
                onChange={(event) => handleAvailabilityFieldChange('startTime', event.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
              />
              <TextField
                label="Hora fin"
                type="time"
                value={availabilityForm.endTime}
                onChange={(event) => handleAvailabilityFieldChange('endTime', event.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
              />
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={availabilityForm.isActive}
                  onChange={(event) => handleAvailabilityFieldChange('isActive', event.target.checked)}
                />
              }
              label="Disponibilidad activa"
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button type="submit" variant="contained" disabled={availabilitySaving}>
                {editingAvailabilityId ? 'Actualizar tramo' : 'Agregar tramo'}
              </Button>
              {(editingAvailabilityId || availabilityPattern !== 'single') && (
                <Button type="button" variant="outlined" onClick={resetAvailabilityForm} disabled={availabilitySaving}>
                  Restablecer
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>

        {availabilityLoading ? (
          <Typography variant="body2" color="text.secondary">Cargando disponibilidad...</Typography>
        ) : orderedAvailability.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Aún no has añadido disponibilidad. Empieza creando tu primer tramo.
          </Typography>
        ) : (
          <List disablePadding>
            {orderedAvailability.map((item) => (
              <ListItem
                key={item.id}
                divider
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" onClick={() => handleEditAvailability(item)}>
                      Editar
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() => handleDeleteAvailability(item.id)}
                      disabled={availabilitySaving}
                    >
                      Eliminar
                    </Button>
                  </Stack>
                }
              >
                <ListItemText
                  primary={`${DAY_OF_WEEK_LABELS[item.dayOfWeek]} · ${item.startTime} - ${item.endTime}`}
                  secondary={
                    <Chip
                      size="small"
                      label={item.isActive ? 'Activo' : 'Inactivo'}
                      color={item.isActive ? 'success' : 'default'}
                      sx={{ mt: 1 }}
                    />
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default ProfilePage;