/**
 * Compute consecutive learning days (streak) from daily seconds data.
 * Counts backwards from today; if today has no activity, starts from yesterday (grace period).
 */
export function computeStreak(dailySeconds: Record<string, number>): number {
  let streak = 0;
  const d = new Date();
  const todayKey = formatDate(d);
  if (!dailySeconds[todayKey] || dailySeconds[todayKey] <= 0) {
    d.setDate(d.getDate() - 1);
  }
  while (true) {
    const key = formatDate(d);
    if (!dailySeconds[key] || dailySeconds[key] <= 0) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
