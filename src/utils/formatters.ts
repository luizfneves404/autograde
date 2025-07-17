import type { Schedule } from '@/types';

export const formatTime = (hour: number): string =>
  `${hour.toString().padStart(2, '0')}:00`;

export const formatSchedule = (schedule: Schedule): string => {
  if (!schedule || schedule.length === 0) return 'Nenhum horário definido';
  return schedule
    .map(
      (ct) =>
        `${ct.day} ${formatTime(ct.slot.startHour)}-${formatTime(ct.slot.endHour)}`,
    )
    .join(', ');
};
