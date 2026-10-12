import { formatAge } from '../../lib/format';

export const VACCINE_STATUS = {
  overdue: { label: 'Vaccine Overdue', className: 'badge-danger' },
  due_soon: { label: 'Vaccine Due Soon', className: 'badge-warning' },
  up_to_date: { label: 'Up to Date', className: 'badge-success' },
  none: { label: 'No Vaccines Logged', className: 'badge-neutral' },
  superseded: { label: 'Superseded', className: 'badge-neutral' },
};

export const SPECIES_LABELS = {
  dog: 'Dog',
  cat: 'Cat',
  bird: 'Bird',
  rabbit: 'Rabbit',
  fish: 'Fish',
  other: 'Other',
};

export function isUpcoming(appointment) {
  return appointment.status === 'booked' && new Date(appointment.scheduledAt).getTime() >= Date.now();
}

export function petSubtitle(pet) {
  return [pet.breed || SPECIES_LABELS[pet.species], formatAge(pet.birthDate)].filter(Boolean).join(' • ');
}
