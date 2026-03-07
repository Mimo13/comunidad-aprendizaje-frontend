import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  AvailabilityDashboardUserDetail,
  AvailabilityRecurrenceType,
  DAY_OF_WEEK_LABELS,
} from '@/types';

interface AvailabilityDetailDialogProps {
  open: boolean;
  onClose: () => void;
  users: AvailabilityDashboardUserDetail[];
}

const weekLabel = (value?: number | null): string => {
  if (value === 1) return 'Primera semana';
  if (value === 2) return 'Segunda semana';
  if (value === 3) return 'Tercera semana';
  if (value === 4) return 'Cuarta semana';
  return 'Quinta semana';
};

const recurrenceLabel = (
  recurrenceType: AvailabilityRecurrenceType,
  weekOfMonth: number | null | undefined,
  repeatInterval: number
): string => {
  if (recurrenceType === AvailabilityRecurrenceType.MONTHLY) {
    return `${weekLabel(weekOfMonth)} · cada ${repeatInterval} mes(es)`;
  }
  return `Semanal · cada ${repeatInterval} semana(s)`;
};

const AvailabilityDetailDialog = ({ open, onClose, users }: AvailabilityDetailDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pr: 6 }}>
        Disponibilidad completa
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }} aria-label="cerrar">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {users.length === 0 ? (
          <Typography color="text.secondary">No hay tramos de disponibilidad activos.</Typography>
        ) : (
          <Stack spacing={2}>
            {users.map((user) => (
              <Box key={user.userId}>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {user.name}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {user.role ? <Chip size="small" label={user.role} variant="outlined" /> : null}
                    <Chip size="small" label={`${user.slots.length} tramo(s)`} color="primary" />
                  </Stack>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {user.email}
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {user.slots.map((slot) => (
                    <Chip
                      key={slot.id}
                      variant="outlined"
                      label={`${DAY_OF_WEEK_LABELS[slot.dayOfWeek]} ${slot.startTime}-${slot.endTime} · ${recurrenceLabel(
                        slot.recurrenceType,
                        slot.weekOfMonth,
                        slot.repeatInterval
                      )}`}
                    />
                  ))}
                </Stack>
                <Divider sx={{ mt: 2 }} />
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AvailabilityDetailDialog;
