import { env } from '../config/env.js';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function money(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

// Calendar dates are stored as UTC midnight.
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function layout(title, bodyHtml) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr><td style="background:#0D9488;color:#ffffff;padding:20px 24px;font-size:20px;font-weight:bold;">PawMart</td></tr>
          <tr><td style="padding:24px;">
            <h1 style="font-size:20px;margin:0 0 16px;">${escapeHtml(title)}</h1>
            ${bodyHtml}
          </td></tr>
          <tr><td style="padding:16px 24px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
            You are receiving this email because you have a PawMart account.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function button(href, label) {
  return `<p style="margin:24px 0 0;"><a href="${escapeHtml(href)}" style="background:#0D9488;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">${escapeHtml(label)}</a></p>`;
}

export function orderConfirmationEmail(user, order) {
  const orderNo = order._id.toString().slice(-6).toUpperCase();
  const dashboardUrl = `${env.frontendUrl}/dashboard?tab=orders`;
  const totals = [
    ['Subtotal', order.subtotalCents],
    ['Shipping', order.shippingCents],
    ['Tax', order.taxCents],
  ];
  const address = order.shippingAddress;

  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${escapeHtml(item.name)} × ${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;">${money(item.priceCents * item.quantity)}</td>
      </tr>`
    )
    .join('');
  const totalRows = totals
    .map(([label, cents]) => `<tr><td style="padding:4px 0;color:#6b7280;">${label}</td><td style="padding:4px 0;text-align:right;color:#6b7280;">${cents === 0 ? 'Free' : money(cents)}</td></tr>`)
    .join('');

  const html = layout(
    `Thanks for your order, ${user.name}!`,
    `<p style="margin:0 0 16px;">Your order <strong>#${orderNo}</strong> has been confirmed.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      ${rows}
      ${totalRows}
      <tr><td style="padding:8px 0;font-weight:bold;">Total</td><td style="padding:8px 0;text-align:right;font-weight:bold;">${money(order.totalCents)}</td></tr>
    </table>
    ${
      address?.address
        ? `<p style="margin:16px 0 0;font-size:14px;color:#374151;"><strong>Shipping to:</strong><br>${escapeHtml(`${address.firstName} ${address.lastName}`)}<br>${escapeHtml(address.address)}<br>${escapeHtml(`${address.city} ${address.postalCode}`)}</p>`
        : ''
    }
    <p style="margin:16px 0 0;font-size:14px;color:#374151;">Payment: ${order.paymentMethod === 'cash_on_delivery' ? 'Cash on delivery' : 'Credit card (simulated)'}</p>
    ${button(dashboardUrl, 'View your orders')}`
  );

  const text = [
    `Thanks for your order, ${user.name}!`,
    `Order #${orderNo} has been confirmed.`,
    '',
    ...order.items.map((item) => `- ${item.name} x ${item.quantity}: ${money(item.priceCents * item.quantity)}`),
    '',
    ...totals.map(([label, cents]) => `${label}: ${cents === 0 ? 'Free' : money(cents)}`),
    `Total: ${money(order.totalCents)}`,
    '',
    `View your orders: ${dashboardUrl}`,
  ].join('\n');

  return { subject: `PawMart order #${orderNo} confirmed`, html, text };
}

export function vaccinationReminderEmail(user, pet, vaccinations, now = Date.now()) {
  const petUrl = `${env.frontendUrl}/dashboard?tab=pets&pet=${pet._id}`;
  const lines = vaccinations.map((v) => {
    const overdue = new Date(v.nextDueDate).getTime() < now;
    return { name: v.name, date: formatDate(v.nextDueDate), overdue };
  });
  const anyOverdue = lines.some((l) => l.overdue);
  const headline = `${pet.name}'s ${lines.length > 1 ? 'vaccinations are' : 'vaccination is'} ${anyOverdue ? 'overdue' : 'due soon'}`;

  const items = lines
    .map(
      (l) => `<li style="margin:0 0 8px;"><strong>${escapeHtml(l.name)}</strong> — ${l.overdue ? `<span style="color:#b91c1c;">overdue since ${l.date}</span>` : `due ${l.date}`}</li>`
    )
    .join('');

  const html = layout(
    headline,
    `<p style="margin:0 0 16px;">Hi ${escapeHtml(user.name)}, this is a reminder about ${escapeHtml(pet.name)}'s vaccinations:</p>
    <ul style="padding-left:20px;margin:0 0 16px;">${items}</ul>
    <p style="margin:0;font-size:14px;color:#374151;">Book a visit with a vet, and log the new dose in PawMart afterwards so we can remind you next time.</p>
    ${button(`${env.frontendUrl}/book-appointment`, 'Book a vet appointment')}
    <p style="margin:16px 0 0;font-size:13px;"><a href="${escapeHtml(petUrl)}" style="color:#0D9488;">View ${escapeHtml(pet.name)}'s health record</a></p>`
  );

  const text = [
    `Hi ${user.name}, this is a reminder about ${pet.name}'s vaccinations:`,
    '',
    ...lines.map((l) => `- ${l.name}: ${l.overdue ? `OVERDUE since ${l.date}` : `due ${l.date}`}`),
    '',
    `Book a vet appointment: ${env.frontendUrl}/book-appointment`,
    `Health record: ${petUrl}`,
  ].join('\n');

  return {
    subject: `Reminder: ${headline}`,
    html,
    text,
  };
}
