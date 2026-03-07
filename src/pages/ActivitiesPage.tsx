import { useEffect, useState } from 'react';
import { Typography, Paper, Box, Button, Alert, Grid, Table, TableBody, TableCell, TableHead, TableRow, Chip, CircularProgress, Select, MenuItem, FormControl, InputLabel, Pagination, useMediaQuery } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Add as AddIcon, Refresh as RefreshIcon, FilterAlt as FilterAltIcon, Clear as ClearIcon, ViewList as ViewListIcon, CalendarMonth as CalendarIcon, Download as DownloadIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { activityService, enrollmentService, subjectService, classroomService, classService, timeSlotService, holidayService, userService } from '@/services/api';
import { ActivityWithEnrollments, ACTIVITY_STATUS_LABELS, ActivityStatus, ActivityFilters, Holiday } from '@/types';
import { usePermissions } from '@/stores/authStore';
import EnrollmentDialog from '@/components/EnrollmentDialog';
import CalendarView from '@/components/CalendarView';
import { useTheme } from '@mui/material/styles';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

import ActivityDetailsModal from '@/components/ActivityDetailsModal';
import ActivityFormModal from '@/components/ActivityFormModal';
import { SkeletonTable } from '@/components/SkeletonLoader';
import BulkCalendarExport from '@/components/BulkCalendarExport';
import { activityDescriptionE2ee } from '@/services/e2ee/activityDescriptionE2ee';

const ActivitiesPage = () => {
  // ===== Estado para creación/edición =====
  const [createOpen, setCreateOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<ActivityWithEnrollments | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Datos maestros para desplegables
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [availableClassrooms, setAvailableClassrooms] = useState<any[]>([]);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  // ===== Estado para listado =====
  const [activities, setActivities] = useState<ActivityWithEnrollments[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [pagination, setPagination] = useState<{ currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number } | null>(null);

  // ===== Estado de filtros =====
  const [filters, setFilters] = useState<ActivityFilters>({ page: 1, limit: 10 });
  const [dateFilter, setDateFilter] = useState<Dayjs | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | ''>('');

  // ===== Estado para detalles/inscripción =====
  const [selectedActivity, setSelectedActivity] = useState<ActivityWithEnrollments | null>(null);
  const [adminEnrollLoading, setAdminEnrollLoading] = useState(false);
  const { user, hasAnyRole } = usePermissions();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isTablet = !isMobile && !isDesktop;

  // ===== Estado de vista (Lista/Calendario) =====
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());

  // ===== Estado para exportación múltiple =====
  const [bulkExportOpen, setBulkExportOpen] = useState(false);

  const openCreate = () => {
    // Cargar asignaturas y aulas al abrir el modal
    loadMasterData();
    setActivityToEdit(null);
    setCreateOpen(true);
  };
  const closeCreate = () => {
    setCreateOpen(false);
    setActivityToEdit(null);
  };

  const loadMasterData = async () => {
    try {
      const [subjectsRes, classroomsRes, classesRes, timeSlotsRes, holidaysRes, teachersRes] = await Promise.all([
        subjectService.getAllSubjects(),
        classroomService.getAllClassrooms(),
        classService.getAllClasses(),
        timeSlotService.getAllTimeSlots(),
        holidayService.getHolidays(),
        userService.getAllUsers({ roles: ['PROFESOR', 'DIRECTIVA'] })
      ]);
      
      if (subjectsRes.success && subjectsRes.data) {
        setAvailableSubjects(subjectsRes.data);
      }
      if (classroomsRes.success && classroomsRes.data) {
        setAvailableClassrooms(classroomsRes.data);
      }
      if (classesRes.success && classesRes.data) {
        setAvailableClasses(classesRes.data);
      }
      if (timeSlotsRes.success && timeSlotsRes.data) {
        setAvailableTimeSlots(timeSlotsRes.data);
      }
      if (holidaysRes.success && holidaysRes.data) {
        setHolidays(holidaysRes.data);
      }
      if (teachersRes.success && teachersRes.data) {
        setAvailableTeachers(teachersRes.data);
      }
    } catch (error) {
      console.error('Error loading master data', error);
    }
  };

  const openDetails = (a: ActivityWithEnrollments) => {
    setSelectedActivity(a);
  };
  const closeDetails = () => setSelectedActivity(null);

  const handleEdit = (activity: ActivityWithEnrollments) => {
    loadMasterData();
    setActivityToEdit(activity);
    
    setCreateOpen(true);
    setSelectedActivity(null); // Cerrar detalles
  };

  const loadActivities = async () => {
    setIsLoadingList(true);
    try {
      let queryFilters: ActivityFilters = { ...filters };

      // Si estamos en modo calendario, ajustamos el rango de fechas
      if (viewMode === 'calendar') {
        // Obtener desde el inicio de la semana del inicio del mes, hasta el fin de la semana del fin del mes
        // para cubrir todos los huecos del grid
        const start = currentMonth.startOf('month').startOf('week').toISOString();
        const end = currentMonth.endOf('month').endOf('week').toISOString();
        
        queryFilters = {
          ...queryFilters,
          fromDate: start,
          toDate: end,
          date: undefined, // Eliminar filtro de fecha específica si existe
          page: 1,
          limit: 1000 // Límite alto para traer todo el mes
        };
      }

      const res = await activityService.getActivities(queryFilters);
      if (res.success && res.data) {
        const serverActivities = res.data.activities || [];
        const decryptedActivities = await activityDescriptionE2ee.decryptActivities(serverActivities);
        setActivities(decryptedActivities);
        setPagination(res.data.pagination);

        // Run legacy migration in background to progressively eliminate plaintext descriptions.
        void activityDescriptionE2ee.migrateLegacyActivities(serverActivities);
      } else {
        setActivities([]);
        setPagination(null);
        setError(res.message || 'No se pudieron cargar las actividades');
      }
    } catch (e: any) {
      setActivities([]);
      setPagination(null);
      setError(e?.response?.data?.message || e?.message || 'Error al cargar las actividades');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadActivities();
    loadMasterData(); // Cargar datos maestros también al inicio para los filtros
  }, [viewMode, currentMonth]); // Recargar al cambiar vista o mes

  const applyFilters = () => {
    const next: ActivityFilters = {
      page: 1,
      limit: filters.limit || 10,
      subject: subjectFilter?.trim() ? subjectFilter.trim() : undefined,
      status: statusFilter || undefined,
      date: dateFilter ? dayjs(dateFilter).toISOString() : undefined,
    };
    setFilters(next);
    setTimeout(loadActivities, 0);
  };

  const clearFilters = () => {
    setSubjectFilter('');
    setStatusFilter('');
    setDateFilter(null);
    const next: ActivityFilters = { page: 1, limit: filters.limit || 10 };
    setFilters(next);
    setTimeout(loadActivities, 0);
  };

  const handlePageChange = (_: any, page: number) => {
    const next = { ...filters, page };
    setFilters(next);
    setTimeout(loadActivities, 0);
  };

  const handleLimitChange = (e: SelectChangeEvent) => {
    const limit = Number(e.target.value);
    const next = { ...filters, limit, page: 1 };
    setFilters(next);
    setTimeout(loadActivities, 0);
  };

  const handleFormSuccess = (message: string) => {
    setSuccess(message);
    
    // Si editamos, mantenemos página. Si creamos, vamos a la primera.
    // Usamos activityToEdit antes de cerrarlo (que lo pone a null)
    if (activityToEdit) {
      setTimeout(loadActivities, 0);
    } else {
      const next: ActivityFilters = { ...filters, page: 1 };
      setFilters(next);
      setTimeout(loadActivities, 0);
    }
    closeCreate();
  };

  const canEnroll = (a?: ActivityWithEnrollments | null) => {
    if (!a) return false;
    const notPast = dayjs(a.date).isAfter(dayjs());
    return a.status === ActivityStatus.ACTIVE && a.availableSpots > 0 && !a.isUserEnrolled && notPast;
  };

  const canUnenroll = (a?: ActivityWithEnrollments | null) => {
    if (!a) return false;
    if (!a.isUserEnrolled) return false;
    const minutesDiff = dayjs(a.date).diff(dayjs(), 'minute');
    if (minutesDiff <= 0) return false; // ya pasó
    return minutesDiff >= 120; // respetar restricción de 2 horas
  };

  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);

  const handleEnrollClick = () => {
    setEnrollmentDialogOpen(true);
  };

  const handleEnrollConfirm = async (userId?: string) => {
    // La lógica de inscripción ahora se maneja dentro de EnrollmentDialog para la parte de administradores
    // y ActivityDetailsModal para la parte de usuarios/detalles
    
    // Si es para uno mismo, redirigimos al modal de detalles
    if (!userId || userId === user?.id) {
       // Si ya tenemos selectedActivity, el modal de detalles ya debería tener la lógica
       return;
    }
    
    // Si es para otro usuario (admin inscribiendo a alguien), mantenemos la lógica aquí o la movemos
    // Por ahora, como ActivityDetailsModal no maneja inscripción de terceros (solo ver lista y cancelar),
    // mantenemos esto PERO necesitamos restaurar los estados si queremos usarlo.
    // O mejor, simplificamos y decimos que la inscripción manual se hace desde otro lado.
    
    // Vamos a dejar solo la lógica necesaria para EnrollmentDialog si se usa
    if (!selectedActivity) return;
    
    setAdminEnrollLoading(true);
    try {
      const res = await enrollmentService.enrollUserInActivity(selectedActivity.id, userId);
      if (res.success) {
        setSuccess('Usuario inscrito correctamente');
        setEnrollmentDialogOpen(false);
        setTimeout(loadActivities, 0);
      } else {
        setError(res.message || 'No se pudo realizar la inscripción');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Error al inscribirse');
    } finally {
      setAdminEnrollLoading(false);
    }
  };

  const renderStatusChip = (a: ActivityWithEnrollments) => {
    const isPast = dayjs(a.date).isBefore(dayjs());
    const isActiveNoSpots = a.status === ActivityStatus.ACTIVE && (a.availableSpots || 0) === 0;
    let chipColor: 'default' | 'success' | 'error' | 'info' = 'default';
    let sxStyles: any = { color: '#fff' };
    if (a.status === ActivityStatus.CANCELLED) chipColor = 'error';
    else if (a.status === ActivityStatus.COMPLETED || isPast) chipColor = 'info';
    else if (a.status === ActivityStatus.ACTIVE && a.availableSpots > 0) chipColor = 'success';
    if (isActiveNoSpots) {
      chipColor = 'default';
      sxStyles = { bgcolor: (theme: any) => theme.palette.warning.main, color: '#fff' };
    }
    const label = isActiveNoSpots ? 'Activa (sin plazas)' : ACTIVITY_STATUS_LABELS[a.status];
    return (
      <Chip
        label={label}
        color={chipColor}
        variant="filled"
        sx={sxStyles}
      />
    );
  };

  const handleViewModeChange = (_: any, newMode: 'list' | 'calendar' | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
      // Al cambiar a calendario, asegurar que cargamos el mes actual si no se ha navegado
      if (newMode === 'calendar') {
        // currentMonth ya tiene valor por defecto dayjs() o el último navegado
      }
    }
  };

  const handleMonthChange = (newMonth: Dayjs) => {
    setCurrentMonth(newMonth);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" component="h1">
          Actividades
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="modo de vista"
            size="small"
          >
            <ToggleButton value="list" aria-label="lista">
              <ViewListIcon />
            </ToggleButton>
            <ToggleButton value="calendar" aria-label="calendario">
              <CalendarIcon />
            </ToggleButton>
          </ToggleButtonGroup>

          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadActivities} disabled={isLoadingList}>
            {isLoadingList ? 'Cargando…' : 'Recargar'}
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            onClick={() => setBulkExportOpen(true)}
            disabled={isLoadingList || activities.length === 0}
          >
            Exportar Calendario
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nueva Actividad
          </Button>
        </Box>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filtros - Solo mostrar en modo lista o si queremos filtrar el calendario también */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={viewMode === 'list' ? 4 : 6}>
            <FormControl fullWidth>
              <InputLabel id="subject-filter-label">Asignatura</InputLabel>
              <Select
                labelId="subject-filter-label"
                label="Asignatura"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {availableSubjects.map((s) => (
                  <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {viewMode === 'list' && (
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Fecha"
                value={dateFilter}
                onChange={(v) => setDateFilter(v)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          )}
          <Grid item xs={12} md={viewMode === 'list' ? 4 : 6}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Estado</InputLabel>
              <Select
                labelId="status-filter-label"
                label="Estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter((e.target.value as ActivityStatus) || '')}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value={ActivityStatus.ACTIVE}>{ACTIVITY_STATUS_LABELS[ActivityStatus.ACTIVE]}</MenuItem>
                <MenuItem value={ActivityStatus.CANCELLED}>{ACTIVITY_STATUS_LABELS[ActivityStatus.CANCELLED]}</MenuItem>
                <MenuItem value={ActivityStatus.COMPLETED}>{ACTIVITY_STATUS_LABELS[ActivityStatus.COMPLETED]}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} display="flex" justifyContent="flex-end" gap={1}>
            <Button variant="outlined" startIcon={<ClearIcon />} onClick={clearFilters}>Limpiar</Button>
            <Button variant="contained" startIcon={<FilterAltIcon />} onClick={applyFilters}>Aplicar filtros</Button>
          </Grid>
        </Grid>
      </Paper>

      {viewMode === 'calendar' ? (
        <CalendarView 
          currentDate={currentMonth}
          onMonthChange={handleMonthChange}
          activities={activities}
          onActivityClick={openDetails}
          loading={isLoadingList}
          holidays={holidays}
        />
      ) : (
        <Paper elevation={1} sx={{ p: 0, overflowX: 'auto' }}>
          {isLoadingList ? (
            <Box p={2}>
              <SkeletonTable rows={10} columns={isMobile ? 3 : 6} />
            </Box>
          ) : activities.length === 0 ? (
            <Box p={3}>
              <Typography variant="body1" color="text.secondary" align="center">
                No hay actividades disponibles actualmente.
              </Typography>
            </Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Título</TableCell>
                    <TableCell>Fecha</TableCell>
                    {!isMobile && <TableCell>Asignatura</TableCell>}
                    {isDesktop && <TableCell>Aula</TableCell>}
                    {!isMobile && <TableCell>Plazas disp.</TableCell>}
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activities.map((a) => (
                    <TableRow key={a.id} hover onClick={() => openDetails(a)} sx={{ cursor: 'pointer' }}>
                      <TableCell>{a.title}</TableCell>
                      <TableCell>
                      <Box display="flex" flexDirection="column">
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
                          {dayjs(a.date).format('DD/MM/YYYY')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {dayjs(a.date).format('HH:mm')} - {a.endDate ? dayjs(a.endDate).format('HH:mm') : ''}
                        </Typography>
                      </Box>
                    </TableCell>
                      {!isMobile && (
                        <TableCell>
                          <Box display="flex" flexDirection="column">
                            <Typography variant="body2">{a.subject}</Typography>
                            {a.teacherName && (
                              <Typography variant="caption" color="text.secondary">
                                Prof: {a.teacherName}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      )}
                      {isDesktop && <TableCell>{a.classroom}</TableCell>}
                      {!isMobile && <TableCell>{a.availableSpots}</TableCell>}
                      <TableCell>
                        {renderStatusChip(a)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box display="flex" justifyContent="space-between" alignItems="center" p={2} flexDirection={{ xs: 'column', sm: 'row' }} gap={{ xs: 1, sm: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  {pagination ? `Página ${pagination.currentPage} de ${pagination.totalPages} — ${pagination.totalItems} actividades` : ''}
                </Typography>
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" justifyContent={{ xs: 'center', sm: 'flex-end' }}>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel id="page-size-label">Items por página</InputLabel>
                    <Select
                      labelId="page-size-label"
                      label="Items por página"
                      value={String(filters.limit || 10)}
                      onChange={handleLimitChange}
                    >
                      <MenuItem value={"5"}>5</MenuItem>
                      <MenuItem value={"10"}>10</MenuItem>
                      <MenuItem value={"20"}>20</MenuItem>
                      <MenuItem value={"50"}>50</MenuItem>
                    </Select>
                  </FormControl>
                  <Pagination
                    count={pagination?.totalPages || 1}
                    page={filters.page || 1}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              </Box>
            </>
          )}
        </Paper>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Aquí podrás ver y gestionar las actividades escolares disponibles.
        </Typography>
      </Box>

      <ActivityFormModal
        open={createOpen}
        onClose={closeCreate}
        activityToEdit={activityToEdit}
        onSuccess={handleFormSuccess}
        onError={(msg) => setError(msg)}
        masterData={{
          subjects: availableSubjects,
          classrooms: availableClassrooms,
          classes: availableClasses,
          timeSlots: availableTimeSlots,
          teachers: availableTeachers
        }}
      />

      {/* Modal de detalle e inscripción */}
      <ActivityDetailsModal 
        open={!!selectedActivity} 
        onClose={closeDetails} 
        activity={selectedActivity}
        onEdit={handleEdit}
        onEnrollUser={handleEnrollClick}
        onEnrollSuccess={() => {
          setTimeout(loadActivities, 0);
        }}
      />

      <EnrollmentDialog
        open={enrollmentDialogOpen}
        onClose={() => setEnrollmentDialogOpen(false)}
        activity={selectedActivity}
        onConfirm={handleEnrollConfirm}
        loading={adminEnrollLoading}
      />

      {/* Diálogo de exportación múltiple */}
      <BulkCalendarExport
        activities={activities}
        open={bulkExportOpen}
        onClose={() => setBulkExportOpen(false)}
      />
    </Box>
  );
};

export default ActivitiesPage;
