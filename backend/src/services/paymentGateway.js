import crypto from 'node:crypto';

// A simulated card processor (the proposal uses simulated payments instead of
// a real gateway). Card numbers that pass the Luhn check are approved, except
// these test numbers, which mirror common real-world decline reasons:
export const TEST_DECLINE_CARDS = {
  '4000000000000002': { code: 'card_declined', message: 'Your card was declined.' },
  '4000000000009995': { code: 'insufficient_funds', message: 'Your card has insufficient funds.' },
  '4000000000000069': { code: 'expired_card', message: 'Your card has expired.' },
  '4000000000000127': { code: 'incorrect_cvc', message: "Your card's security code is incorrect." },
};

export function luhnValid(number) {
  let sum = 0;
  let double = false;
  for (let i = number.length - 1; i >= 0; i -= 1) {
    let digit = Number(number[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

export function cardBrand(number) {
  if (/^4/.test(number)) return 'visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  return 'card';
}

// Checks the card details are well-formed. Returns a list of
// { field, message } problems (empty when valid).
export function validateCard({ number, expiry, cvc }, now = new Date()) {
  const problems = [];
  const digits = number.replace(/[\s-]/g, '');

  if (!/^\d{12,19}$/.test(digits) || !luhnValid(digits)) {
    problems.push({ field: 'card.number', message: 'Card number is invalid' });
  }

  const match = expiry.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  const month = match ? Number(match[1]) : 0;
  const year = match ? 2000 + Number(match[2]) : 0;
  if (!match || month < 1 || month > 12) {
    problems.push({ field: 'card.expiry', message: 'Expiry must be MM/YY' });
  } else if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
    problems.push({ field: 'card.expiry', message: 'Card has expired' });
  }

  const cvcLength = cardBrand(digits) === 'amex' ? 4 : 3;
  if (!new RegExp(`^\\d{${cvcLength}}$`).test(cvc)) {
    problems.push({ field: 'card.cvc', message: `Security code must be ${cvcLength} digits` });
  }

  return problems;
}

export function cardSummary({ number, expiry }) {
  const digits = number.replace(/[\s-]/g, '');
  const [month, year] = expiry.split('/').map((part) => Number(part.trim()));
  return { brand: cardBrand(digits), last4: digits.slice(-4), expMonth: month, expYear: 2000 + year };
}

// Simulates charging a card. Assumes validateCard() already passed.
export function charge({ number }) {
  const digits = number.replace(/[\s-]/g, '');
  const decline = TEST_DECLINE_CARDS[digits];
  if (decline) {
    return { ok: false, ...decline };
  }
  return { ok: true, transactionRef: `SIM-${crypto.randomBytes(6).toString('hex').toUpperCase()}` };
}
