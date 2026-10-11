import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { sendMail, isMailerConfigured } from "../services/mailer.js";
import { birthdayTemplate } from "../services/mailTemplate.js";
import {
  enqueueBirthdayEmail,
  enqueueTestEmail,
  getQueueMetrics,
  scheduleContactBirthdayJob,
  removeContactBirthdayJob
} from "../services/queueService.js";
import {
  isBirthdayToday,
  getNextBirthday,
  daysUntil,
  calculateAge,
  getZodiacSign,
  formatDOBReadable,
  formatDateYYYYMMDD,
  parseDOB
} from "../utils/dateUtils.js";
import {
  dbGetContacts,
  dbGetContactById,
  dbInsertContact,
  dbUpdateContact,
  dbDeleteContact,
  dbGetDeliveryLogs,
  dbRecordDeliveryLog,
  checkRateLimit,
  consumeRateLimit,
  isDatabaseConnected
} from "../services/db.js";
import {
  stripDangerousContent,
  sanitizeString,
  validateEmail,
  validateName,
  validateDobFormat
} from "../utils/security.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const USERS_FILE = path.join(DATA_DIR, "birthdays.json");
const LOGS_FILE = path.join(DATA_DIR, "logs.json");

// Ensure data folder and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const safeRead = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "[]", "utf-8");
      return [];
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[Storage] Error reading ${filePath}:`, err.message);
    return [];
  }
};

const safeWrite = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`[Storage] Error writing ${filePath}:`, err.message);
    throw err;
  }
};

/**
 * Appends or updates delivery log entries in data/logs.json
 */
/**
 * Appends or updates delivery log entries in PostgreSQL and data/logs.json mirror
 */
export const recordDeliveryLog = ({
  name,
  email,
  status,
  type = "automatic",
  turningAge,
  messageId = null,
  error = null
}) => {
  return dbRecordDeliveryLog({
    name,
    email,
    status,
    type,
    turningAge,
    messageId,
    error
  });
};

/**
 * Extracts client IP safely across proxies and direct connections
 */
export const getClientIp = (req) => {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (forwarded) {
    const first = String(forwarded).split(",")[0].trim();
    if (first) return first;
  }
  return req.headers?.["x-real-ip"] || req.socket?.remoteAddress || req.ip || "127.0.0.1";
};

/**
 * Extracts optional user Passkey from request header or query
 */
export const getUserPasskey = (req) => {
  const headerKey = req.headers?.["x-passkey"] || req.headers?.["x-user-key"];
  const queryKey = req.query?.passkey || req.query?.user_key;
  const rawKey = headerKey || queryKey;
  if (!rawKey || typeof rawKey !== "string") return null;
  return sanitizeString(rawKey.trim(), 128);
};

/**
 * GET /api/v1/birthdays/quota
 * Returns remaining daily and weekly addition limits for caller IP
 */
export const getQuota = async (req, res) => {
  const clientIp = getClientIp(req);
  const quota = await checkRateLimit(clientIp);
  res.json({ success: true, quota });
};

/**
 * Migration helper to ensure every record has a unique ID and trimmed fields
 */
const normalizeUsers = () => {
  const users = safeRead(USERS_FILE);
  let updated = false;
  const normalized = users.map((u) => {
    if (!u.id) {
      updated = true;
      return { id: crypto.randomUUID(), ...u };
    }
    return u;
  });
  if (updated) {
    safeWrite(USERS_FILE, normalized);
  }
  return normalized;
};

// Initial normalization run
normalizeUsers();

/**
 * Returns all contacts normalized
 */
export const getAllContacts = () => normalizeUsers();

/**
 * Retrieves a single contact by ID
 */
export const getContactById = (id) => {
  const users = normalizeUsers();
  return users.find((u) => u.id === id) || null;
};

/**
 * Checks if a birthday celebration email has already been recorded for this recipient today
 */
export const isBirthdayAlreadySentToday = (email) => {
  if (!email) return false;
  const logs = safeRead(LOGS_FILE);
  const todayDateStr = new Date().toISOString().split("T")[0];
  const targetEmail = String(email).trim().toLowerCase();

  return logs.some((log) => {
    if (log.email && log.email.trim().toLowerCase() === targetEmail) {
      const logDateStr = (log.date || log.timestamp || "").split("T")[0];
      return logDateStr === todayDateStr && (log.status === "sent" || log.status === "simulated");
    }
    return false;
  });
};

/**
 * Enriches a user object with computed birthday metrics
 */
export const enrichUser = (user, now = new Date()) => {
  const isToday = isBirthdayToday(user.dob, now);
  const nextDate = getNextBirthday(user.dob, now);
  const daysLeft = daysUntil(user.dob, now);
  const ages = calculateAge(user.dob, now);
  const zodiac = getZodiacSign(user.dob);
  const readableDOB = formatDOBReadable(user.dob);

  const untilYear = user.untilYear ? parseInt(user.untilYear, 10) : null;
  const repeatSummary = untilYear
    ? `Repeats yearly until ${untilYear}`
    : "Repeats yearly forever";

  return {
    ...user,
    untilYear,
    repeatSummary,
    isToday,
    daysLeft,
    nextBirthday: formatDateYYYYMMDD(nextDate),
    currentAge: ages.currentAge,
    turningAge: ages.turningAge,
    zodiac,
    readableDOB
  };
};

/**
 * Validates birthday creation / update payload
 */
export const validateBirthday = ({ name, email, dob, untilYear }) => {
  if (!name || typeof name !== "string" || !name.trim()) {
    return "Name is required and cannot be empty.";
  }
  if (!validateName(name)) {
    return "Name contains invalid characters or dangerous HTML/script tags.";
  }
  const cleanName = stripDangerousContent(name).trim();
  if (cleanName.length < 1 || cleanName.length > 100) {
    return "Name must be between 1 and 100 characters.";
  }

  if (!email || typeof email !== "string" || !validateEmail(email)) {
    return "A valid email address is required (max 254 chars).";
  }

  if (!dob || typeof dob !== "string" || !validateDobFormat(dob)) {
    return "DOB must be in YYYY-MM-DD format.";
  }

  const parsed = parseDOB(dob);
  if (!parsed || parsed.month < 1 || parsed.month > 12 || parsed.day < 1 || parsed.day > 31) {
    return "DOB contains an invalid calendar date.";
  }

  if (parsed.year < 1900) {
    return "Year of birth must be 1900 or later.";
  }

  const dateObj = new Date(parsed.year, parsed.month - 1, parsed.day);
  if (
    dateObj.getFullYear() !== parsed.year ||
    dateObj.getMonth() !== parsed.month - 1 ||
    dateObj.getDate() !== parsed.day
  ) {
    return "DOB is not a valid date on the calendar.";
  }

  const today = new Date();
  if (dateObj > today) {
    return "Date of birth cannot be in the future.";
  }

  if (untilYear !== undefined && untilYear !== null && untilYear !== "") {
    const parsedUntil = parseInt(untilYear, 10);
    if (isNaN(parsedUntil) || !Number.isInteger(parsedUntil) || parsedUntil < today.getFullYear() || parsedUntil > 2150) {
      return `Repeat until year must be a valid year (${today.getFullYear()} or later).`;
    }
  }

  return null;
};

/**
 * POST /api/v1/add-dob
 */
export const addDOB = async (req, res) => {
  const clientIp = getClientIp(req);
  const quota = await checkRateLimit(clientIp);

  if (!quota.allowed) {
    return res.status(429).json({
      success: false,
      error: "Rate limit exceeded",
      message: `Addition limit reached: You can add at most ${quota.dailyLimit} birthdays per day (and ${quota.weeklyLimit} per week) to prevent spam. Quota resets at ${new Date(quota.dailyReset).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
      quota
    });
  }

  const { name, email, dob, untilYear } = req.body || {};

  const error = validateBirthday({ name, email, dob, untilYear });
  if (error) {
    return res.status(400).json({ success: false, error });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();
  const trimmedDob = dob.trim();
  const parsedUntilYear = untilYear ? parseInt(untilYear, 10) : null;
  const userKey = getUserPasskey(req);

  const users = await dbGetContacts(userKey);

  // Check if identical contact exists for this user
  const existing = users.find(
    (u) => u.email.toLowerCase() === trimmedEmail && u.dob === trimmedDob
  );
  if (existing) {
    return res.status(409).json({
      success: false,
      error: "A contact with this email and birthday already exists."
    });
  }

  const newId = crypto.randomUUID();
  const newUser = await dbInsertContact({
    id: newId,
    name: trimmedName,
    email: trimmedEmail,
    dob: trimmedDob,
    untilYear: parsedUntilYear,
    ip: clientIp,
    userKey
  });

  // Consume rate limit quota for client IP
  await consumeRateLimit(clientIp);
  const updatedQuota = await checkRateLimit(clientIp);

  // Event-driven: Schedule delayed birthday job at 23:59:55 on eve of their birthday
  let scheduleInfo = null;
  try {
    scheduleInfo = await scheduleContactBirthdayJob(newUser);
  } catch (schedErr) {
    console.warn(`[BullMQ] Notice scheduling new contact: ${schedErr.message}`);
  }

  res.status(201).json({
    success: true,
    message: `Birthday added for ${trimmedName}!`,
    user: enrichUser(newUser),
    schedule: scheduleInfo,
    quota: updatedQuota
  });
};

/**
 * PUT /api/v1/birthdays/:id
 */
export const updateDOB = async (req, res) => {
  const { id } = req.params;
  const { name, email, dob, untilYear } = req.body || {};
  const userKey = getUserPasskey(req);

  const error = validateBirthday({ name, email, dob, untilYear });
  if (error) {
    return res.status(400).json({ success: false, error });
  }

  const existing = await dbGetContactById(id, userKey);
  if (!existing) {
    return res.status(404).json({ success: false, error: "Contact not found." });
  }

  const parsedUntilYear = untilYear !== undefined && untilYear !== ""
    ? (untilYear ? parseInt(untilYear, 10) : null)
    : (existing.untilYear || null);

  const updated = await dbUpdateContact(id, {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    dob: dob.trim(),
    untilYear: parsedUntilYear
  }, userKey);

  // Reschedule delayed job for updated contact
  let scheduleInfo = null;
  try {
    await removeContactBirthdayJob(id);
    scheduleInfo = await scheduleContactBirthdayJob(updated);
  } catch (schedErr) {
    console.warn(`[BullMQ] Notice rescheduling contact: ${schedErr.message}`);
  }

  res.json({
    success: true,
    message: "Contact updated successfully.",
    user: enrichUser(updated),
    schedule: scheduleInfo
  });
};

/**
 * DELETE /api/v1/birthdays/:id
 */
export const deleteDOB = async (req, res) => {
  const { id } = req.params;
  const userKey = getUserPasskey(req);
  const deleted = await dbDeleteContact(id, userKey);

  if (!deleted) {
    return res.status(404).json({ success: false, error: "Contact not found." });
  }

  // Remove scheduled job from BullMQ queue
  try {
    await removeContactBirthdayJob(id);
  } catch (schedErr) {
    console.warn(`[BullMQ] Notice removing job: ${schedErr.message}`);
  }

  res.json({ success: true, message: "Contact deleted successfully.", deletedId: id });
};

/**
 * GET /api/v1/birthdays/today
 */
export const getToday = async (req, res) => {
  const userKey = getUserPasskey(req);
  const users = await dbGetContacts(userKey);
  const now = new Date();
  const todayUsers = users
    .filter((u) => isBirthdayToday(u.dob, now))
    .map((u) => enrichUser(u, now));

  res.json(todayUsers);
};

/**
 * GET /api/v1/birthdays/upcoming
 * Returns all contacts enriched and sorted by days remaining until their next birthday
 */
export const getUpcoming = async (req, res) => {
  const userKey = getUserPasskey(req);
  const users = await dbGetContacts(userKey);
  const now = new Date();
  const enriched = users
    .map((u) => enrichUser(u, now))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  res.json(enriched);
};

/**
 * GET /api/v1/logs
 */
export const getLogs = (req, res) => {
  const logs = safeRead(LOGS_FILE);
  // Sort logs newest first
  logs.sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp));
  res.json(logs);
};

/**
 * DELETE /api/v1/logs
 */
export const clearLogs = (req, res) => {
  safeWrite(LOGS_FILE, []);
  res.json({ success: true, message: "Delivery logs cleared." });
};

/**
 * POST /api/v1/send-test-mail
 */
export const sendTestMail = async (req, res) => {
  const {
    email,
    name = "Valued Friend",
    turningAge: explicitAge = null,
    customMessage = null,
    senderName: explicitSender = null
  } = req.body || {};

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ success: false, error: "Valid email is required to send test email." });
  }

  const cleanName = sanitizeString(name, 100) || "Valued Friend";
  const cleanEmail = String(email).trim().toLowerCase();
  const senderName = sanitizeString(explicitSender || req.headers?.["x-sender-name"] || req.query?.senderName || "", 100) || null;

  // Derive turningAge if not provided
  let turningAge = explicitAge ? parseInt(explicitAge, 10) : null;
  if (!turningAge) {
    const users = normalizeUsers();
    const matched = users.find((u) => u.email && u.email.toLowerCase() === cleanEmail);
    if (matched && matched.dob) {
      const computed = calculateAge(matched.dob, new Date());
      turningAge = computed.turningAge;
    }
  }

  const enqueued = await enqueueTestEmail(cleanName, cleanEmail, {
    turningAge,
    customMessage,
    senderName
  });
  if (enqueued.queued) {
    recordDeliveryLog({
      name: name.trim(),
      email: email.trim(),
      status: "queued",
      type: "test",
      turningAge,
      messageId: `job_${enqueued.jobId}`
    });
    return res.json({
      sent: true,
      queued: true,
      jobId: enqueued.jobId,
      message: `Test email successfully queued in BullMQ (Job ID: ${enqueued.jobId}).`
    });
  }

  const sendResult = enqueued.result || { success: false, error: "Queue dispatch failed" };
  const logStatus = sendResult.success ? (sendResult.simulated ? "simulated" : "sent") : "failed";
  recordDeliveryLog({
    name: name.trim(),
    email: email.trim(),
    status: logStatus,
    type: "test",
    turningAge,
    messageId: sendResult.messageId || null,
    error: sendResult.error || null
  });

  res.json({
    sent: sendResult.success,
    simulated: !!sendResult.simulated,
    messageId: sendResult.messageId,
    error: sendResult.error,
    note: sendResult.note || null
  });
};

/**
 * Core daily processor logic.
 * Avoids sending duplicate emails to the same user on the same date.
 */
export const processTodaysBirthdays = async () => {
  const users = normalizeUsers();
  const logs = safeRead(LOGS_FILE);
  const today = new Date();
  const todayDateStr = today.toISOString().split("T")[0];

  const todaysBirthdays = users.filter((u) => isBirthdayToday(u.dob, today));
  const results = {
    totalFound: todaysBirthdays.length,
    sentCount: 0,
    simulatedCount: 0,
    skippedAlreadySent: 0,
    failedCount: 0,
    details: []
  };

  for (const u of todaysBirthdays) {
    const ageInfo = calculateAge(u.dob, today);
    const turningAge = ageInfo.turningAge;

    // Check if already sent today
    const alreadySentToday = logs.some((log) => {
      if (log.email && log.email.toLowerCase() === u.email.toLowerCase()) {
        const logDateStr = (log.date || log.timestamp || "").split("T")[0];
        return logDateStr === todayDateStr && (log.status === "sent" || log.status === "simulated" || log.status === "queued");
      }
      return false;
    });

    if (alreadySentToday) {
      results.skippedAlreadySent += 1;
      results.details.push({
        name: u.name,
        email: u.email,
        status: "skipped_already_sent"
      });
      continue;
    }

    const queueRes = await enqueueBirthdayEmail(u, turningAge);
    if (queueRes.queued) {
      results.sentCount += 1;
      recordDeliveryLog({
        name: u.name,
        email: u.email,
        status: "queued",
        type: "automatic",
        turningAge,
        messageId: `job_${queueRes.jobId}`
      });
      results.details.push({
        name: u.name,
        email: u.email,
        status: "queued",
        jobId: queueRes.jobId
      });
      continue;
    }

    const sendResult = queueRes.result || { success: false, error: "Send failed" };
    const logStatus = sendResult.success
      ? sendResult.simulated
        ? "simulated"
        : "sent"
      : "failed";

    if (sendResult.success) {
      if (sendResult.simulated) results.simulatedCount += 1;
      else results.sentCount += 1;
    } else {
      results.failedCount += 1;
    }

    recordDeliveryLog({
      name: u.name,
      email: u.email,
      status: logStatus,
      type: "automatic",
      turningAge,
      messageId: sendResult.messageId || null,
      error: sendResult.error || null
    });

    results.details.push({
      name: u.name,
      email: u.email,
      status: logStatus,
      error: sendResult.error
    });
  }

  console.log(
    `[Processor] Processed today's birthdays: ${results.sentCount} sent/queued, ${results.simulatedCount} simulated, ${results.skippedAlreadySent} skipped, ${results.failedCount} failed.`
  );
  return results;
};

/**
 * POST /api/v1/trigger-check
 * Manually trigger the birthday check immediately
 */
export const triggerManualCheck = async (req, res) => {
  try {
    const summary = await processTodaysBirthdays();
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/v1/stats
 */
export const getStats = async (req, res) => {
  const userKey = getUserPasskey(req);
  const users = await dbGetContacts(userKey);
  const logs = await dbGetDeliveryLogs();
  const now = new Date();

  const todayCount = users.filter((u) => isBirthdayToday(u.dob, now)).length;
  const upcomingCount30Days = users.filter((u) => {
    const d = daysUntil(u.dob, now);
    return d > 0 && d <= 30;
  }).length;

  const emailsSent = logs.filter((l) => l.status === "sent" || l.status === "simulated" || l.status === "queued").length;
  const queueMetrics = await getQueueMetrics();

  res.json({
    totalUsers: users.length,
    todayBirthdays: todayCount,
    upcomingIn30Days: upcomingCount30Days,
    emailsDispatched: emailsSent,
    mailerConfigured: isMailerConfigured(),
    databaseConnected: isDatabaseConnected(),
    databaseType: isDatabaseConnected() ? "PostgreSQL / Supabase" : "Local JSON Storage",
    queue: queueMetrics,
    serverTime: now.toISOString()
  });
};

/**
 * GET /api/v1/template-preview
 * Returns HTML preview for iframe or modal
 */
export const getTemplatePreview = (req, res) => {
  const name = sanitizeString(req.query.name || "Alex Smith", 100);
  const email = sanitizeString(req.query.email || "alex@example.com", 254);
  const turningAge = req.query.turningAge ? parseInt(req.query.turningAge, 10) : 22;
  const customMessage = sanitizeString(req.query.message || "", 500);
  const senderName = sanitizeString(req.query.senderName || req.headers?.["x-sender-name"] || "", 100) || null;

  const html = birthdayTemplate(name, email, { turningAge, customMessage, senderName });
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
};
