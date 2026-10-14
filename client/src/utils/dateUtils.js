export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function startOfWeekISO() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

export function endOfWeekISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + 6;
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

export function startOfMonthISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export function endOfMonthISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export function formatDate(dateStr, locale = 'en-GB') {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr, locale = 'en-GB') {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString(locale, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}