import { format, parseISO, formatISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Europe/Istanbul';

export const toLocalDate = (date: Date | string): Date => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(parsedDate, TIMEZONE);
};

export const toUTCDate = (date: Date): Date => {
  // Convert to UTC by using the ISO string
  return new Date(date.toISOString());
};

export const formatToYYYYMMDD = (date: Date | string): string => {
  const localDate = toLocalDate(date);
  return format(localDate, 'yyyy-MM-dd');
};

export const formatToHHMM = (date: Date | string): string => {
  const localDate = toLocalDate(date);
  return format(localDate, 'HH:mm');
};

export const formatToLocaleDateString = (date: Date | string): string => {
  const localDate = toLocalDate(date);
  return format(localDate, 'dd/MM/yyyy');
};

export const formatToISOString = (date: Date | string): string => {
  const utcDate = toUTCDate(typeof date === 'string' ? parseISO(date) : date);
  return formatISO(utcDate);
};

export const getCurrentDate = (): Date => {
  return toLocalDate(new Date());
};

export const combineDateTime = (date: string, time: string): Date => {
  const [hours, minutes] = time.split(':');
  const combinedDate = new Date(date);
  combinedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  return toUTCDate(combinedDate);
}; 