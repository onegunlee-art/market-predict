import {
  format,
  formatDistanceToNow,
  formatRelative,
  isAfter,
  isBefore,
  addDays,
  addHours,
  addMinutes,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  parseISO,
} from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatDate(date: Date | string, formatStr = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: ko });
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm');
}

export function formatDateTimeFull(date: Date | string): string {
  return formatDate(date, 'yyyy년 M월 d일 HH:mm');
}

export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ko });
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatRelative(d, new Date(), { locale: ko });
}

export function isExpired(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(d, new Date());
}

export function isFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(d, new Date());
}

export function getTimeRemaining(endDate: Date | string): {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
} {
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  const now = new Date();

  if (isBefore(end, now)) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true };
  }

  const days = differenceInDays(end, now);
  const hours = differenceInHours(end, now) % 24;
  const minutes = differenceInMinutes(end, now) % 60;

  return { days, hours, minutes, isExpired: false };
}

export function formatTimeRemaining(endDate: Date | string): string {
  const { days, hours, minutes, isExpired } = getTimeRemaining(endDate);

  if (isExpired) return '종료됨';

  if (days > 0) {
    return `${days}일 ${hours}시간 남음`;
  }
  if (hours > 0) {
    return `${hours}시간 ${minutes}분 남음`;
  }
  return `${minutes}분 남음`;
}

export { addDays, addHours, addMinutes, parseISO };
