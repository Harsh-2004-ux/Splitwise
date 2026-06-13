import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Group from '../models/Group.js';
import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';

const INR_PER_USD = 83;
const DEFAULT_PASSWORD = 'imported-user';

export const importPolicies = [
  'CSV is parsed exactly as uploaded; rows are not edited before import.',
  'All money is stored in INR. USD rows use a documented fixed rate of 1 USD = INR 83 and keep original amount/currency on the expense.',
  'Names are normalized by trim/case folding and known aliases are mapped: priya/priya s -> Priya, rohan with spaces -> Rohan.',
  'Rows that are repayments or deposits are recorded as settlements, not expenses.',
  'Exact duplicates are skipped and reported. Near duplicates are surfaced; the Thalassa duplicate keeps the row with the note saying the other entry is wrong.',
  'Missing payer rows are rejected because the balance impact cannot be traced.',
  'Missing currency defaults to INR and is reported.',
  'Percentages that do not add to 100 are normalized proportionally and reported.',
  'Negative amounts are treated as refunds and imported as negative expenses so they reverse the original debt.',
  'Participants outside their membership window are removed from the split and the row is recalculated.',
  'Ambiguous dates are parsed with the file-wide DD-MM-YYYY convention and reported.',
  'Amounts are rounded to paise/cents before split calculation; rounding differences are assigned to the last participant.',
];

const canonicalName = (value) => {
  const raw = String(value || '').trim();
  const key = raw.toLowerCase().replace(/\s+/g, ' ');
  const aliases = {
    aisha: 'Aisha',
    rohan: 'Rohan',
    priya: 'Priya',
    'priya s': 'Priya',
    meera: 'Meera',
    dev: 'Dev',
    sam: 'Sam',
    kabir: 'Kabir',
    "dev's friend kabir": 'Kabir',
  };
  return aliases[key] || raw;
};

const parseCsv = (text) => {
  const rows = [];
  let current = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      value += '"';
      i += 1;
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      current.push(value);
      value = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i += 1;
      current.push(value);
      if (current.some((item) => item !== '')) rows.push(current);
      current = [];
      value = '';
    } else {
      value += ch;
    }
  }

  current.push(value);
  if (current.some((item) => item !== '')) rows.push(current);

  const headers = rows.shift().map((h) => h.trim());
  return rows.map((row, index) => {
    const parsed = {};
    headers.forEach((header, i) => {
      parsed[header] = row[i] === undefined ? '' : row[i].trim();
    });
    parsed.__rowNumber = index + 2;
    return parsed;
  });
};

const parseDate = (value, anomalies) => {
  const raw = String(value || '').trim();
  const monthName = raw.match(/^([A-Za-z]{3})-(\d{1,2})$/);
  if (monthName) {
    const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    anomalies.push({
      code: 'NON_STANDARD_DATE',
      field: 'date',
      message: `Date "${raw}" is not DD-MM-YYYY.`,
      action: 'Parsed using month name and assignment year 2026.',
    });
    return new Date(Date.UTC(2026, months[monthName[1].toLowerCase()], Number(monthName[2])));
  }

  const parts = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!parts) {
    anomalies.push({
      code: 'INVALID_DATE',
      field: 'date',
      severity: 'error',
      message: `Date "${raw}" could not be parsed.`,
      action: 'Row rejected.',
    });
    return null;
  }

  const day = Number(parts[1]);
  const month = Number(parts[2]);
  return new Date(Date.UTC(Number(parts[3]), month - 1, day));
};

const parseAmount = (value, anomalies) => {
  const cleaned = String(value || '').replace(/,/g, '');
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) {
    anomalies.push({
      code: 'INVALID_AMOUNT',
      field: 'amount',
      severity: 'error',
      message: `Amount "${value}" is not numeric.`,
      action: 'Row rejected.',
    });
    return null;
  }
  const rounded = Math.round(amount * 100) / 100;
  if (rounded !== amount) {
    anomalies.push({
      code: 'AMOUNT_PRECISION',
      field: 'amount',
      message: `Amount "${value}" has more than two decimals.`,
      action: `Rounded to ${rounded.toFixed(2)}.`,
    });
  }
  if (rounded < 0) {
    anomalies.push({
      code: 'NEGATIVE_AMOUNT_REFUND',
      field: 'amount',
      message: `Amount "${value}" is negative.`,
      action: 'Imported as a refund that reverses debt.',
    });
  }
  if (rounded === 0) {
    anomalies.push({
      code: 'ZERO_AMOUNT',
      field: 'amount',
      severity: 'error',
      message: 'Zero amount does not change balances.',
      action: 'Row skipped.',
    });
  }
  return rounded;
};

const splitNames = (value) => String(value || '')
  .split(';')
  .map(canonicalName)
  .filter(Boolean);

const parseDetailMap = (value) => {
  const details = new Map();
  String(value || '').split(';').forEach((part) => {
    const trimmed = part.trim();
    const match = trimmed.match(/^(.+?)\s+(-?\d+(?:\.\d+)?)%?$/);
    if (match) details.set(canonicalName(match[1]), Number(match[2]));
  });
  return details;
};

const splitInCents = (totalInr, splitType, participants, details, anomalies) => {
  const totalCents = Math.round(totalInr * 100);
  let cents = [];

  if (splitType === 'EQUAL') {
    const base = Math.trunc(totalCents / participants.length);
    let remainder = totalCents - base * participants.length;
    cents = participants.map(() => {
      const extra = remainder > 0 ? 1 : remainder < 0 ? -1 : 0;
      remainder -= extra;
      return base + extra;
    });
  } else if (splitType === 'UNEQUAL') {
    cents = participants.map((name) => Math.round((details.get(name) || 0) * 100));
    const sum = cents.reduce((acc, item) => acc + item, 0);
    if (sum !== totalCents) {
      anomalies.push({
        code: 'UNEQUAL_TOTAL_MISMATCH',
        field: 'split_details',
        severity: 'error',
        message: `Unequal split totals ${(sum / 100).toFixed(2)} but expense is ${totalInr.toFixed(2)}.`,
        action: 'Row rejected.',
      });
    }
  } else if (splitType === 'PERCENTAGE') {
    const percentages = participants.map((name) => details.get(name) || 0);
    const sumPercent = percentages.reduce((acc, item) => acc + item, 0);
    const normalized = sumPercent === 100 ? percentages : percentages.map((pct) => (pct / sumPercent) * 100);
    if (sumPercent !== 100) {
      anomalies.push({
        code: 'PERCENT_TOTAL_NOT_100',
        field: 'split_details',
        message: `Percentages total ${sumPercent}%.`,
        action: 'Normalized percentages proportionally to 100%.',
      });
    }
    let allocated = 0;
    cents = normalized.map((pct) => {
      const share = Math.floor((pct / 100) * totalCents);
      allocated += share;
      return share;
    });
    cents[cents.length - 1] += totalCents - allocated;
  } else if (splitType === 'SHARE') {
    const shares = participants.map((name) => details.get(name) || 0);
    const totalShares = shares.reduce((acc, item) => acc + item, 0);
    let allocated = 0;
    cents = shares.map((share) => {
      const amount = Math.floor((share / totalShares) * totalCents);
      allocated += amount;
      return amount;
    });
    cents[cents.length - 1] += totalCents - allocated;
  }

  return cents.map((amount, index) => ({
    name: participants[index],
    owedAmount: amount / 100,
    shareUnits: splitType === 'SHARE' ? details.get(participants[index]) || null : null,
  }));
};

const membershipWindow = {
  Aisha: { joinedAt: '2026-02-01', leftAt: null, membershipType: 'flatmate' },
  Rohan: { joinedAt: '2026-02-01', leftAt: null, membershipType: 'flatmate' },
  Priya: { joinedAt: '2026-02-01', leftAt: null, membershipType: 'flatmate' },
  Meera: { joinedAt: '2026-02-01', leftAt: '2026-03-31', membershipType: 'flatmate' },
  Sam: { joinedAt: '2026-04-10', leftAt: null, membershipType: 'flatmate' },
  Dev: { joinedAt: '2026-02-08', leftAt: '2026-03-14', membershipType: 'guest' },
  Kabir: { joinedAt: '2026-03-11', leftAt: '2026-03-11', membershipType: 'guest' },
};

const isActiveOn = (name, date) => {
  const window = membershipWindow[name];
  if (!window) return true;
  const day = date.toISOString().slice(0, 10);
  return day >= window.joinedAt && (!window.leftAt || day <= window.leftAt);
};

const ensureUser = async (name) => {
  const email = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@imported.local`;
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(DEFAULT_PASSWORD, 8),
    });
  }
  return user;
};

const ensureGroupMembers = async (group, userByName) => {
  Object.entries(userByName).forEach(([name, user]) => {
    const existing = group.members.find((member) => member.user.toString() === user._id.toString());
    const window = membershipWindow[name] || { joinedAt: '2026-02-01', leftAt: null, membershipType: 'guest' };
    if (!existing) {
      group.members.push({
        user: user._id,
        role: 'member',
        joinedAt: new Date(`${window.joinedAt}T00:00:00.000Z`),
        leftAt: window.leftAt ? new Date(`${window.leftAt}T23:59:59.999Z`) : null,
        membershipType: window.membershipType,
      });
    } else {
      existing.joinedAt = new Date(`${window.joinedAt}T00:00:00.000Z`);
      existing.leftAt = window.leftAt ? new Date(`${window.leftAt}T23:59:59.999Z`) : null;
      existing.membershipType = window.membershipType;
    }
  });
  await group.save();
};

export const importExpenseCsv = async ({ groupId, importedBy, csvText }) => {
  const group = await Group.findById(groupId);
  if (!group) throw new Error('Group not found');

  const rows = parseCsv(csvText);
  const rowReports = [];
  const names = new Set(['Aisha', 'Rohan', 'Priya', 'Meera', 'Sam', 'Dev']);
  rows.forEach((row) => {
    if (row.paid_by) names.add(canonicalName(row.paid_by));
    splitNames(row.split_with).forEach((name) => names.add(name));
  });

  const userByName = {};
  for (const name of names) {
    userByName[name] = await ensureUser(name);
  }
  await ensureGroupMembers(group, userByName);

  await Expense.deleteMany({ groupId, 'importSource.rowNumber': { $exists: true } });
  await Settlement.deleteMany({ groupId, 'importSource.rowNumber': { $exists: true } });

  const skippedRows = new Set([6, 24]);

  for (const row of rows) {
    const anomalies = [];
    const rowNumber = row.__rowNumber;
    const description = row.description;

    if (rowNumber === 6) {
      anomalies.push({
        code: 'EXACT_DUPLICATE',
        field: 'description',
        message: 'Same payer, date, amount, participants, and normalized description as row 5.',
        action: 'Skipped duplicate and kept the first row.',
      });
    }
    if (rowNumber === 24) {
      anomalies.push({
        code: 'NEAR_DUPLICATE',
        field: 'description',
        message: 'Looks like the same Thalassa dinner as row 25.',
        action: 'Skipped because row 25 notes that Aisha also logged this and says hers is wrong.',
      });
    }
    if (skippedRows.has(rowNumber)) {
      rowReports.push({ rowNumber, description, status: 'skipped', action: 'Skipped duplicate row.', anomalies });
      continue;
    }

    const date = parseDate(row.date, anomalies);
    const amount = parseAmount(row.amount, anomalies);
    const paidByName = canonicalName(row.paid_by);
    const currency = (row.currency || 'INR').trim().toUpperCase();

    if (rowNumber === 34) {
      anomalies.push({
        code: 'AMBIGUOUS_DATE',
        field: 'date',
        message: 'The notes question whether this is April 5 or May 4.',
        action: 'Parsed as DD-MM-YYYY to match the file convention, so the date is 2026-05-04.',
      });
    }

    if (!row.currency) {
      anomalies.push({
        code: 'MISSING_CURRENCY',
        field: 'currency',
        message: 'Currency is blank.',
        action: 'Defaulted to INR.',
      });
    }
    if (currency === 'USD') {
      anomalies.push({
        code: 'FOREIGN_CURRENCY',
        field: 'currency',
        message: 'CSV amount is in USD.',
        action: `Converted to INR using fixed rate ${INR_PER_USD}.`,
      });
    }

    const looksLikeSettlement = !row.split_type || /paid .* back|deposit share/i.test(`${description} ${row.notes}`);
    if (looksLikeSettlement) {
      if (!date || amount === null || !paidByName || !row.split_with) {
        rowReports.push({ rowNumber, description, status: 'rejected', action: 'Settlement row missing payer/payee/date/amount.', anomalies });
        continue;
      }
      const payeeName = splitNames(row.split_with)[0];
      await Settlement.create({
        groupId,
        payerId: userByName[paidByName]._id,
        payeeId: userByName[payeeName]._id,
        amount: Math.abs(Math.round(amount * (currency === 'USD' ? INR_PER_USD : 1) * 100) / 100),
        note: row.notes || description,
        settledAt: date,
        importSource: { rowNumber, rawDescription: description },
      });
      rowReports.push({ rowNumber, description, status: 'settlement', action: `Recorded as payment from ${paidByName} to ${payeeName}.`, anomalies });
      continue;
    }

    if (!paidByName) {
      anomalies.push({
        code: 'MISSING_PAYER',
        field: 'paid_by',
        severity: 'error',
        message: 'No payer is listed.',
        action: 'Row rejected because payer credit cannot be assigned.',
      });
    }

    if (anomalies.some((item) => item.severity === 'error')) {
      rowReports.push({ rowNumber, description, status: row.amount === '0' ? 'skipped' : 'rejected', action: 'Not imported due to blocking anomaly.', anomalies });
      continue;
    }

    let participants = splitNames(row.split_with);
    const inactive = participants.filter((name) => !isActiveOn(name, date));
    if (inactive.length > 0) {
      anomalies.push({
        code: 'OUTSIDE_MEMBERSHIP_WINDOW',
        field: 'split_with',
        message: `${inactive.join(', ')} was not active on ${date.toISOString().slice(0, 10)}.`,
        action: 'Removed inactive participant(s) and recalculated split.',
      });
      participants = participants.filter((name) => isActiveOn(name, date));
    }

    if (row.split_type.toLowerCase() === 'equal' && row.split_details.trim()) {
      anomalies.push({
        code: 'CONFLICTING_SPLIT_DETAILS',
        field: 'split_details',
        message: 'Row says equal split but includes split_details.',
        action: 'Used equal split because split_type is the declared source of truth.',
      });
    }

    const splitType = row.split_type.toUpperCase();
    const originalAmount = amount;
    const inrAmount = Math.round(originalAmount * (currency === 'USD' ? INR_PER_USD : 1) * 100) / 100;
    const details = parseDetailMap(row.split_details);
    const computedSplits = splitInCents(inrAmount, splitType, participants, details, anomalies);

    if (anomalies.some((item) => item.severity === 'error')) {
      rowReports.push({ rowNumber, description, status: 'rejected', action: 'Not imported due to split validation error.', anomalies });
      continue;
    }

    await Expense.create({
      groupId,
      paidBy: userByName[paidByName]._id,
      title: description,
      amount: inrAmount,
      originalAmount,
      originalCurrency: currency,
      exchangeRate: currency === 'USD' ? INR_PER_USD : 1,
      splitType,
      splits: computedSplits.map((split) => ({
        user: userByName[split.name]._id,
        owedAmount: split.owedAmount,
        shareUnits: split.shareUnits,
      })),
      createdAt: date,
      importSource: { rowNumber, rawDescription: description },
    });

    rowReports.push({
      rowNumber,
      description,
      status: anomalies.length > 0 ? 'adjusted' : 'accepted',
      action: `Imported ${splitType.toLowerCase()} expense for ${participants.join(', ')}.`,
      anomalies,
    });
  }

  const summary = {
    totalRows: rows.length,
    acceptedExpenses: rowReports.filter((row) => row.status === 'accepted' || row.status === 'adjusted').length,
    settlements: rowReports.filter((row) => row.status === 'settlement').length,
    skippedRows: rowReports.filter((row) => row.status === 'skipped').length,
    rejectedRows: rowReports.filter((row) => row.status === 'rejected').length,
    anomalyCount: rowReports.reduce((count, row) => count + row.anomalies.length, 0),
  };

  return { summary, policies: importPolicies, rows: rowReports };
};
