const millisecondsPerDay = 86400000;
export const dateAt = (value: string) => new Date(`${value}T12:00:00Z`);
export const dateKey = (date: Date) => date.toISOString().slice(0, 10);
export const todayKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};
export const addDays = (value: string, days: number) =>
  dateKey(new Date(dateAt(value).getTime() + days * millisecondsPerDay));
export const rangeDays = (start: string, end: string) =>
  Math.round((dateAt(end).getTime() - dateAt(start).getTime()) / millisecondsPerDay) + 1;
export const monthStart = (value: string) => `${value.slice(0, 7)}-01`;
export const changeMonth = (value: string, offset: number) => {
  const date = dateAt(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + offset);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return dateKey(date);
};
export const rangeLabel = (start: string, end: string) => {
  if (!start) {
    return 'Choose your dates';
  }
  const format = (value: string) =>
    new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(dateAt(value));
  if (!end) {
    return `${format(start)} · Choose an end date`;
  }
  return `${format(start)} – ${format(end)} · ${rangeDays(start, end)} days`;
};
