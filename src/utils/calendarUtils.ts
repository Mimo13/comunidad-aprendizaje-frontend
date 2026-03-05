import dayjs from 'dayjs';
import { ActivityWithEnrollments } from '@/types';

/**
 * Genera la URL para añadir el evento a Google Calendar
 */
export const getGoogleCalendarUrl = (activity: ActivityWithEnrollments) => {
  const start = dayjs(activity.date);
  // Si no hay fecha fin, asumimos 1 hora de duración
  const end = activity.endDate ? dayjs(activity.endDate) : start.add(1, 'hour');

  // Google Calendar usa formato YYYYMMDDTHHmmssZ para UTC o local sin Z
  const format = 'YYYYMMDDTHHmmss';
  
  const details = [
    activity.description || '',
    '',
    `Asignatura: ${activity.subject}`,
    `Profesor: ${activity.teacherName || 'No especificado'}`,
    `Plazas: ${activity.availableSpots} / ${activity.maxHelpers}`
  ].join('\n').trim();

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: activity.title,
    dates: `${start.format(format)}/${end.format(format)}`,
    details: details,
    location: `Aula: ${activity.classroom}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Genera y descarga un archivo .ics para Outlook, Apple Calendar, etc.
 */
export const downloadIcsFile = (activity: ActivityWithEnrollments) => {
  const start = dayjs(activity.date);
  const end = activity.endDate ? dayjs(activity.endDate) : start.add(1, 'hour');
  const format = 'YYYYMMDDTHHmmss';

  const description = [
    activity.description || '',
    `Asignatura: ${activity.subject}`,
    `Profesor: ${activity.teacherName || 'No especificado'}`
  ].join('\\n');

  // Construir contenido del archivo ICS línea por línea
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Familias Colaboradoras//Cartima//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${activity.id}@cartima.app`,
    `DTSTAMP:${dayjs().format(format)}`,
    `DTSTART:${start.format(format)}`,
    `DTEND:${end.format(format)}`,
    `SUMMARY:${activity.title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:Aula ${activity.classroom}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const icsContent = icsLines.join('\r\n');

  // Crear Blob y descargar
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${activity.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};