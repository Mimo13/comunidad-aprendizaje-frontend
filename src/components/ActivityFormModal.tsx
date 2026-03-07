import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { ActivityForm, ActivityWithEnrollments } from '@/types';
import { activityService } from '@/services/api';
import type { SelectChangeEvent } from '@mui/material/Select';

interface ActivityFormModalProps {
  open: boolean;
  onClose: () => void;
  activityToEdit?: ActivityWithEnrollments | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  masterData: {
    subjects: any[];
    classrooms: any[];
    classes: any[];
    timeSlots: any[];
    teachers: any[];
  };
}

const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
  open,
  onClose,
  activityToEdit,
  onSuccess,
  onError,
  masterData
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateValue, setDateValue] = useState<Dayjs | null>(null);
  
  const [form, setForm] = useState<ActivityForm>({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    subject: '',
    classroom: '',
    classGroup: '',
    maxHelpers: 1,
    teacherName: '',
  });

  // Reset form when opening or changing activity
  useEffect(() => {
    if (open) {
      if (activityToEdit) {
        // Edit mode
        const start = dayjs(activityToEdit.date);
        const end = activityToEdit.endDate ? dayjs(activityToEdit.endDate) : start.add(1, 'hour');
        
        setForm({
          title: activityToEdit.title,
          description: activityToEdit.description || '',
          date: start.toISOString(),
          startTime: start.format('HH:mm'),
          endTime: end.format('HH:mm'),
          subject: activityToEdit.subject,
          classroom: activityToEdit.classroom,
          classGroup: activityToEdit.classGroup || '',
          maxHelpers: activityToEdit.maxHelpers,
          teacherName: activityToEdit.teacherName || '',
        });
        setDateValue(start);
      } else {
        // Create mode
        setForm({
          title: '',
          description: '',
          date: '',
          startTime: '',
          endTime: '',
          subject: '',
          classroom: '',
          classGroup: '',
          maxHelpers: 1,
          teacherName: '',
        });
        setDateValue(null);
      }
    }
  }, [open, activityToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name as string]: name === 'maxHelpers' ? Number(value) : value,
    }));
  };

  const handleDateChange = (value: Dayjs | null) => {
    setDateValue(value);
    setForm((prev) => ({ ...prev, date: value ? value.toISOString() : '' }));
  };

  const validate = () => {
    if (!form.title.trim()) return 'El título es obligatorio';
    if (!form.date) return 'La fecha es obligatoria';
    if (!form.startTime) return 'La hora de inicio es obligatoria';
    if (!form.endTime) return 'La hora de fin es obligatoria';
    if (form.startTime >= form.endTime) return 'La hora de inicio debe ser anterior a la hora de fin';
    if (!form.subject.trim()) return 'La asignatura es obligatoria';
    if (!form.classroom.trim()) return 'El aula es obligatoria';
    if (!form.classGroup.trim()) return 'La clase es obligatoria';
    if (!form.maxHelpers || form.maxHelpers < 1) return 'El número de colaboradores debe ser al menos 1';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      onError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Combinar fecha con horas
      const dateStr = dayjs(form.date).format('YYYY-MM-DD');
      const startDateTime = dayjs(`${dateStr}T${form.startTime}`).toISOString();
      const endDateTime = dayjs(`${dateStr}T${form.endTime}`).toISOString();

      const payload: ActivityForm = {
        ...form,
        date: startDateTime,
        endDate: endDateTime,
        description: form.description?.trim() || undefined,
      };

      let res;
      if (activityToEdit) {
        res = await activityService.updateActivity(activityToEdit.id, payload);
      } else {
        res = await activityService.createActivity(payload);
      }

      if (res.success) {
        onSuccess(activityToEdit ? 'Actividad actualizada correctamente' : 'Actividad creada correctamente');
        onClose();
      } else {
        onError(res.message || (activityToEdit ? 'No se pudo actualizar la actividad' : 'No se pudo crear la actividad'));
      }
    } catch (e: any) {
      onError(e?.response?.data?.message || e?.message || 'Error al guardar la actividad');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{activityToEdit ? 'Editar Actividad' : 'Nueva Actividad'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              label="Título"
              name="title"
              value={form.title}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              freeSolo
              forcePopupIcon
              options={masterData.teachers.map((t) => t.name)}
              value={form.teacherName || ''}
              onChange={(_, newValue) => {
                setForm((prev) => ({ ...prev, teacherName: newValue || '' }));
              }}
              onInputChange={(_, newInputValue) => {
                setForm((prev) => ({ ...prev, teacherName: newInputValue }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Nombre del Profesor"
                  placeholder="Selecciona de la lista o escribe un nombre"
                  fullWidth
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Descripción"
              name="description"
              value={form.description || ''}
              onChange={handleChange}
              fullWidth
              multiline
              minRows={2}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <DatePicker
              label="Fecha"
              value={dateValue}
              onChange={handleDateChange}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required>
              <InputLabel id="startTime-label">Hora Inicio</InputLabel>
              <Select
                labelId="startTime-label"
                label="Hora Inicio"
                name="startTime"
                value={form.startTime || ''}
                onChange={handleChange}
              >
                {masterData.timeSlots.map((slot) => (
                  <MenuItem key={slot.id} value={slot.startTime}>
                    {slot.startTime}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required>
              <InputLabel id="endTime-label">Hora Fin</InputLabel>
              <Select
                labelId="endTime-label"
                label="Hora Fin"
                name="endTime"
                value={form.endTime || ''}
                onChange={handleChange}
              >
                {masterData.timeSlots.map((slot) => (
                  <MenuItem key={slot.id} value={slot.endTime}>
                    {slot.endTime}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="subject-label">Asignatura</InputLabel>
              <Select
                labelId="subject-label"
                label="Asignatura"
                name="subject"
                value={form.subject}
                onChange={handleChange}
              >
                {masterData.subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.name}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="classroom-label">Aula</InputLabel>
              <Select
                labelId="classroom-label"
                label="Aula"
                name="classroom"
                value={form.classroom}
                onChange={handleChange}
              >
                {masterData.classrooms.map((classroom) => (
                  <MenuItem key={classroom.id} value={classroom.name}>
                    {classroom.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="class-group-label">Clase</InputLabel>
              <Select
                labelId="class-group-label"
                label="Clase"
                name="classGroup"
                value={form.classGroup || ''}
                onChange={handleChange}
              >
                {masterData.classes.map((entry) => (
                  <MenuItem key={entry.id} value={entry.name}>
                    {entry.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="maxHelpers-label">Colaboradores máximos</InputLabel>
              <Select
                labelId="maxHelpers-label"
                label="Colaboradores máximos"
                name="maxHelpers"
                value={String(form.maxHelpers)}
                onChange={handleChange}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                  <MenuItem key={num} value={num}>
                    {num}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : (activityToEdit ? 'Actualizar' : 'Crear')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActivityFormModal;
