/** UTC-день `YYYY-MM-DD` для квот и daily stats */
export function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
