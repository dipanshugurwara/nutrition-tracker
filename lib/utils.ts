export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

export function formatDateDisplay(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

export function getTodayDate(): string {
  return formatDate(new Date());
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function getStatusColor(
  current: number,
  target: number,
  type: 'calories' | 'protein'
): 'green' | 'yellow' | 'red' {
  const percentage = (current / target) * 100;
  
  if (percentage <= 100) return 'green';
  if (percentage <= 110) return 'yellow';
  return 'red';
}

export function getCombinedStatusColor(
  caloriesCurrent: number,
  caloriesTarget: number,
  proteinCurrent: number,
  proteinTarget: number
): 'green' | 'yellow' | 'red' {
  const caloriesStatus = getStatusColor(caloriesCurrent, caloriesTarget, 'calories');
  const proteinStatus = getStatusColor(proteinCurrent, proteinTarget, 'protein');
  
  if (caloriesStatus === 'green' && proteinStatus === 'green') return 'green';
  if (caloriesStatus === 'red' && proteinStatus === 'red') return 'red';
  return 'yellow';
}
