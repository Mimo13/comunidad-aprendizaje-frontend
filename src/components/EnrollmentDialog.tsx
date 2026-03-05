import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { ActivityWithEnrollments, User } from '@/types';
import { usePermissions } from '@/stores/authStore';
import { userService } from '@/services/api';
import dayjs from 'dayjs';

interface EnrollmentDialogProps {
  open: boolean;
  onClose: () => void;
  activity: ActivityWithEnrollments | null;
  onConfirm: (userId?: string) => Promise<void>;
  loading?: boolean;
}

const EnrollmentDialog: React.FC<EnrollmentDialogProps> = ({
  open,
  onClose,
  activity,
  onConfirm,
  loading = false
}) => {
  const { user, hasAnyRole } = usePermissions();
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Reset state when opening/closing
  useEffect(() => {
    if (open) {
      setShowUserSelect(false);
      setSelectedUserId('');
    }
  }, [open]);

  // Load users when "Apuntar otra persona" is clicked
  const handleShowUserSelect = async () => {
    setShowUserSelect(true);
    setLoadingUsers(true);
    try {
      const res = await userService.getAllUsers();
      if (res.success && res.data) {
        // Filter out users already enrolled
        const enrolledIds = activity?.enrollments?.map(e => e.user.id) || [];
        const filteredUsers = res.data.filter((u: any) => !enrolledIds.includes(u.id));
        setAvailableUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error loading users', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleConfirm = () => {
    if (showUserSelect) {
      if (selectedUserId) {
        onConfirm(selectedUserId);
      }
    } else {
      onConfirm(user?.id); // Enroll current user
    }
  };

  if (!activity) return null;

  const canEnrollOthers = hasAnyRole(['ADMIN', 'DIRECTIVA', 'AMPA']) || activity.createdById === user?.id;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirmar Inscripción</DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Typography variant="body1" gutterBottom>
            {showUserSelect 
              ? 'Selecciona al usuario que deseas inscribir:' 
              : `¿Quieres apuntarte a la actividad "${activity.title}"?`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {dayjs(activity.date).format('DD/MM/YYYY')} • {dayjs(activity.date).format('HH:mm')} - {activity.endDate ? dayjs(activity.endDate).format('HH:mm') : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activity.subject} • {activity.classroom}
          </Typography>
        </Box>

        {showUserSelect && (
          <Box mt={2}>
            {loadingUsers ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <FormControl fullWidth>
                <InputLabel id="user-select-label">Usuario</InputLabel>
                <Select
                  labelId="user-select-label"
                  value={selectedUserId}
                  label="Usuario"
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  {availableUsers.length > 0 ? (
                    availableUsers.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">
                      No hay usuarios disponibles
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, p: 2 }}>
        {!showUserSelect ? (
          <>
            <Button onClick={onClose} disabled={loading} fullWidth>
              No
            </Button>
            {canEnrollOthers && (
              <Button onClick={handleShowUserSelect} disabled={loading} fullWidth>
                Apuntar otra persona
              </Button>
            )}
            <Button 
              onClick={handleConfirm} 
              variant="contained" 
              color="primary" 
              disabled={loading}
              fullWidth
            >
              {loading ? 'Procesando...' : 'Sí'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setShowUserSelect(false)} disabled={loading} fullWidth>
              Atrás
            </Button>
            <Button 
              onClick={handleConfirm} 
              variant="contained" 
              color="primary" 
              disabled={loading || !selectedUserId}
              fullWidth
            >
              {loading ? 'Procesando...' : 'Confirmar'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EnrollmentDialog;
