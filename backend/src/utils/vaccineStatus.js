const DAY_MS = 24 * 60 * 60 * 1000;
export const DUE_SOON_DAYS = 30;

const STATUS_PRIORITY = { overdue: 3, due_soon: 2, up_to_date: 1, none: 0 };

function statusForDueDate(nextDueDate, now) {
  if (!nextDueDate) return 'up_to_date';
  const due = new Date(nextDueDate).getTime();
  if (due < now) return 'overdue';
  if (due - now <= DUE_SOON_DAYS * DAY_MS) return 'due_soon';
  return 'up_to_date';
}

// Annotates each vaccination with a status. Only the most recent dose of a
// given vaccine counts; older doses are marked "superseded" so a booster that
// has already been given doesn't keep showing the old due date as overdue.
export function annotateVaccinations(vaccinations, now = Date.now()) {
  const latestByName = new Map();
  for (const v of vaccinations) {
    const key = v.name.trim().toLowerCase();
    const current = latestByName.get(key);
    if (!current || new Date(v.dateGiven) > new Date(current.dateGiven)) {
      latestByName.set(key, v);
    }
  }

  return vaccinations
    .map((v) => {
      const plain = typeof v.toObject === 'function' ? v.toObject() : v;
      const isLatest = latestByName.get(v.name.trim().toLowerCase()) === v;
      return { ...plain, status: isLatest ? statusForDueDate(v.nextDueDate, now) : 'superseded' };
    })
    .sort((a, b) => new Date(b.dateGiven) - new Date(a.dateGiven));
}

// Rolls a pet's vaccinations up into one status plus the next due vaccine.
export function summarizeVaccinations(vaccinations, now = Date.now()) {
  const current = annotateVaccinations(vaccinations, now).filter((v) => v.status !== 'superseded');
  if (current.length === 0) return { status: 'none', nextDue: null };

  const status = current.reduce(
    (worst, v) => (STATUS_PRIORITY[v.status] > STATUS_PRIORITY[worst] ? v.status : worst),
    'up_to_date'
  );
  const nextDue =
    current
      .filter((v) => v.nextDueDate)
      .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))
      .map((v) => ({ name: v.name, date: v.nextDueDate }))[0] || null;

  return { status, nextDue };
}
