import cron from 'node-cron';
import { env } from '../config/env.js';
import { PetHealthRecord } from '../models/PetHealthRecord.js';
import { sendMail } from '../services/mailer.js';
import { vaccinationReminderEmail } from '../services/emailTemplates.js';
import { annotateVaccinations } from '../utils/vaccineStatus.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Emails each owner about vaccinations that are due within the reminder
// window (or already overdue) and haven't been reminded for that due date.
// One email per pet. Returns a summary for logging / the admin endpoint.
export async function runVaccinationReminders({ now = Date.now() } = {}) {
  const cutoff = new Date(now + env.reminders.daysBefore * DAY_MS);
  const records = await PetHealthRecord.find({ 'vaccinations.nextDueDate': { $lte: cutoff } })
    .populate('petId', 'name')
    .populate('ownerId', 'name email');

  const summary = { checked: records.length, emailsSent: 0, emailsFailed: 0, vaccinations: 0 };

  for (const record of records) {
    const pet = record.petId;
    const owner = record.ownerId;
    if (!pet || !owner?.email) continue;

    const due = annotateVaccinations(record.vaccinations, now).filter(
      (v) =>
        v.status !== 'superseded' &&
        v.nextDueDate &&
        new Date(v.nextDueDate) <= cutoff &&
        (!v.reminderSentFor || new Date(v.reminderSentFor).getTime() !== new Date(v.nextDueDate).getTime())
    );
    if (due.length === 0) continue;

    const result = await sendMail({ to: owner.email, ...vaccinationReminderEmail(owner, pet, due, now) });
    if (!result.ok) {
      summary.emailsFailed += 1;
      continue; // not marked, so it's retried on the next run
    }

    for (const v of due) {
      record.vaccinations.id(v._id).reminderSentFor = v.nextDueDate;
    }
    await record.save();
    summary.emailsSent += 1;
    summary.vaccinations += due.length;
  }

  return summary;
}

export function scheduleVaccinationReminders() {
  if (!env.reminders.enabled) {
    console.info('[reminders] disabled (REMINDERS_ENABLED=false)');
    return null;
  }

  const task = cron.schedule(
    env.reminders.cron,
    async () => {
      try {
        const summary = await runVaccinationReminders();
        console.info('[reminders] run complete:', summary);
      } catch (err) {
        console.error('[reminders] run failed:', err);
      }
    },
    { timezone: env.reminders.timezone, name: 'vaccination-reminders', noOverlap: true }
  );

  console.info(`[reminders] scheduled "${env.reminders.cron}" (${env.reminders.timezone})`);
  return task;
}
