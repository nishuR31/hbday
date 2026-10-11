import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "./prisma.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const USERS_FILE = path.join(DATA_DIR, "birthdays.json");
const LOGS_FILE = path.join(DATA_DIR, "logs.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Fallback JSON helpers
const readJsonFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf-8");
    return raw.trim() ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`[Storage:JSON] Error writing ${filePath}:`, err.message);
  }
};

let isDbConnected = false;

export const isDatabaseConnected = () => isDbConnected;

/**
 * Initialize Prisma v5 database connection and auto-seed if needed
 */
export const initDatabase = async () => {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.log("[Database:Prisma] No DATABASE_URL provided. Operating with persistent JSON storage mode.");
    return false;
  }

  try {
    await prisma.$connect();
    // Test query
    const count = await prisma.birthday.count();
    isDbConnected = true;
    console.log(`[Database:Prisma] Connected successfully via Prisma v5 (Found ${count} registered birthdays).`);

    // Auto-seed from birthdays.json if PostgreSQL table is empty
    if (count === 0) {
      await autoSeedFromLocalJson();
    }

    return true;
  } catch (err) {
    console.warn(`[Database:Prisma Warning] Could not connect to database via Prisma (${err.message}). Using local JSON fallback.`);
    isDbConnected = false;
    return false;
  }
};

const autoSeedFromLocalJson = async () => {
  if (!isDbConnected) return;
  try {
    const localContacts = readJsonFile(USERS_FILE);
    if (localContacts.length > 0) {
      console.log(`[Database:Prisma] Seeding ${localContacts.length} contacts from local birthdays.json into Prisma...`);
      for (const c of localContacts) {
        await prisma.birthday.upsert({
          where: { id: c.id },
          update: {},
          create: {
            id: c.id,
            name: c.name,
            email: c.email,
            dob: c.dob,
            untilYear: c.untilYear || null,
            userKey: c.userKey || null
          }
        });
      }
      console.log("[Database:Prisma] Seed complete.");
    }
  } catch (err) {
    console.warn(`[Database:Prisma Notice] Seeding notice: ${err.message}`);
  }
};

// ==========================================
// Contact Database Operations (Prisma v5)
// ==========================================

export const dbGetContacts = async (userKey = null) => {
  if (isDbConnected) {
    try {
      const where = userKey ? { userKey } : {};
      const rows = await prisma.birthday.findMany({
        where,
        orderBy: { createdAt: "asc" }
      });
      const contacts = rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        dob: r.dob,
        untilYear: r.untilYear,
        userKey: r.userKey,
        createdAt: r.createdAt
      }));
      // Synchronize full list with local JSON backup when not filtered by userKey
      if (!userKey) {
        writeJsonFile(USERS_FILE, contacts);
      }
      return contacts;
    } catch (err) {
      console.warn(`[Database:Prisma] Query error, falling back to local JSON: ${err.message}`);
    }
  }
  const local = readJsonFile(USERS_FILE);
  if (userKey) {
    return local.filter((c) => c.userKey === userKey);
  }
  return local;
};

export const dbGetContactById = async (id, userKey = null) => {
  if (isDbConnected) {
    try {
      const where = { id };
      if (userKey) where.userKey = userKey;
      const r = await prisma.birthday.findFirst({ where });
      if (r) {
        return {
          id: r.id,
          name: r.name,
          email: r.email,
          dob: r.dob,
          untilYear: r.untilYear,
          userKey: r.userKey,
          createdAt: r.createdAt
        };
      }
    } catch (err) {
      console.warn(`[Database:Prisma] Query error for ID ${id}: ${err.message}`);
    }
  }
  const contacts = readJsonFile(USERS_FILE);
  return contacts.find((c) => c.id === id && (!userKey || c.userKey === userKey)) || null;
};

export const dbInsertContact = async ({ id, name, email, dob, untilYear, ip, userKey = null }) => {
  const contactId = id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  
  if (isDbConnected) {
    try {
      await prisma.birthday.upsert({
        where: { id: contactId },
        update: {
          name,
          email,
          dob,
          untilYear: untilYear || null,
          createdByIp: ip || null,
          userKey: userKey || null
        },
        create: {
          id: contactId,
          name,
          email,
          dob,
          untilYear: untilYear || null,
          createdByIp: ip || null,
          userKey: userKey || null
        }
      });
    } catch (err) {
      console.error(`[Database:Prisma] Insert error: ${err.message}`);
      throw err;
    }
  }

  // Keep JSON mirror updated
  const localContacts = readJsonFile(USERS_FILE);
  const exists = localContacts.findIndex((c) => c.id === contactId);
  const entry = { id: contactId, name, email, dob, untilYear: untilYear || null, ip, userKey: userKey || null };
  if (exists >= 0) {
    localContacts[exists] = entry;
  } else {
    localContacts.push(entry);
  }
  writeJsonFile(USERS_FILE, localContacts);
  return entry;
};

export const dbUpdateContact = async (id, { name, email, dob, untilYear }, userKey = null) => {
  if (isDbConnected) {
    try {
      const existing = await prisma.birthday.findUnique({ where: { id } });
      if (existing) {
        if (userKey && existing.userKey && existing.userKey !== userKey) {
          return null;
        }

        const updated = await prisma.birthday.update({
          where: { id },
          data: {
            name,
            email,
            dob,
            untilYear: untilYear || null
          }
        });

        const local = readJsonFile(USERS_FILE);
        const idx = local.findIndex((c) => c.id === id);
        if (idx >= 0) {
          local[idx] = {
            ...local[idx],
            name,
            email,
            dob,
            untilYear: untilYear || null,
            userKey: updated.userKey || local[idx].userKey
          };
          writeJsonFile(USERS_FILE, local);
        }

        return {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          dob: updated.dob,
          untilYear: updated.untilYear,
          userKey: updated.userKey
        };
      }
    } catch (err) {
      console.error(`[Database:Prisma] Update error: ${err.message}`);
      throw err;
    }
  }

  const local = readJsonFile(USERS_FILE);
  const idx = local.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  if (userKey && local[idx].userKey && local[idx].userKey !== userKey) return null;
  local[idx] = { ...local[idx], name, email, dob, untilYear: untilYear || null };
  writeJsonFile(USERS_FILE, local);
  return local[idx];
};

export const dbDeleteContact = async (id, userKey = null) => {
  if (isDbConnected) {
    try {
      const existing = await prisma.birthday.findUnique({ where: { id } });
      if (existing) {
        if (userKey && existing.userKey && existing.userKey !== userKey) {
          return false;
        }

        await prisma.birthday.delete({ where: { id } });

        const local = readJsonFile(USERS_FILE).filter((c) => c.id !== id);
        writeJsonFile(USERS_FILE, local);
        return true;
      }
    } catch (err) {
      console.error(`[Database:Prisma] Delete error: ${err.message}`);
      throw err;
    }
  }

  const local = readJsonFile(USERS_FILE);
  const exists = local.some((c) => c.id === id && (!userKey || !c.userKey || c.userKey === userKey));
  if (!exists) return false;
  const filtered = local.filter((c) => c.id !== id);
  writeJsonFile(USERS_FILE, filtered);
  return true;
};

// ==========================================
// Delivery Logs Database Operations (Prisma v5)
// ==========================================

export const dbGetDeliveryLogs = async (limit = 200) => {
  if (isDbConnected) {
    try {
      const rows = await prisma.deliveryLog.findMany({
        take: limit,
        orderBy: { timestamp: "desc" }
      });
      const logs = rows.map((l) => ({
        id: l.id,
        name: l.name,
        email: l.email,
        status: l.status,
        type: l.type,
        turningAge: l.turningAge,
        messageId: l.messageId,
        error: l.error,
        timestamp: l.timestamp.toISOString()
      }));
      writeJsonFile(LOGS_FILE, logs);
      return logs;
    } catch (err) {
      console.warn(`[Database:Prisma] Logs query error: ${err.message}`);
    }
  }
  return readJsonFile(LOGS_FILE);
};

export const dbRecordDeliveryLog = ({
  name,
  email,
  status,
  type = "automatic",
  turningAge,
  messageId = null,
  error = null
}) => {
  const timestamp = new Date().toISOString();

  // Update local JSON mirror synchronously
  const logs = readJsonFile(LOGS_FILE);
  let resultEntry = null;

  if (messageId && messageId.startsWith("job_")) {
    const existing = logs.find((l) => l.messageId === messageId && l.status === "queued");
    if (existing) {
      existing.status = status;
      existing.timestamp = timestamp;
      if (error) existing.error = error;
      writeJsonFile(LOGS_FILE, logs);
      resultEntry = existing;
    }
  }

  if (!resultEntry) {
    resultEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      email,
      status,
      type,
      turningAge: turningAge || null,
      messageId,
      error: error || null,
      timestamp
    };
    logs.unshift(resultEntry);
    if (logs.length > 500) logs.length = 500;
    writeJsonFile(LOGS_FILE, logs);
  }

  // Asynchronously sync to Prisma Postgres if connected
  if (isDbConnected) {
    (async () => {
      try {
        if (messageId && messageId.startsWith("job_")) {
          const updateRes = await prisma.deliveryLog.updateMany({
            where: { messageId, status: "queued" },
            data: {
              status,
              error: error || null,
              timestamp: new Date()
            }
          });
          if (updateRes.count > 0) return;
        }

        await prisma.deliveryLog.create({
          data: {
            name,
            email,
            status,
            type,
            turningAge: turningAge || null,
            messageId: messageId || null,
            error: error || null,
            timestamp: new Date()
          }
        });
      } catch (err) {
        console.warn(`[Database:Prisma] Log insert warning: ${err.message}`);
      }
    })();
  }

  return resultEntry;
};

// ==========================================
// Rate Limiting via Prisma v5 (Daily 5, Weekly 15)
// ==========================================

const inMemoryRateLimits = new Map();

export const checkRateLimit = async (clientIp) => {
  const dailyLimit = parseInt(process.env.DAILY_ADD_LIMIT || "5", 10);
  const weeklyLimit = parseInt(process.env.WEEKLY_ADD_LIMIT || "15", 10);

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;

  const ipKey = clientIp || "anonymous";

  if (isDbConnected) {
    try {
      const record = await prisma.rateLimit.findUnique({ where: { ip: ipKey } });
      if (record) {
        let dailyCount = record.dailyCount;
        let dailyReset = new Date(record.dailyReset);
        let weeklyCount = record.weeklyCount;
        let weeklyReset = new Date(record.weeklyReset);

        let dirty = false;
        if (now >= dailyReset) {
          dailyCount = 0;
          dailyReset = new Date(now.getTime() + dayMs);
          dirty = true;
        }
        if (now >= weeklyReset) {
          weeklyCount = 0;
          weeklyReset = new Date(now.getTime() + weekMs);
          dirty = true;
        }

        if (dirty) {
          await prisma.rateLimit.update({
            where: { ip: ipKey },
            data: {
              dailyCount,
              dailyReset,
              weeklyCount,
              weeklyReset
            }
          });
        }

        const allowed = dailyCount < dailyLimit && weeklyCount < weeklyLimit;
        return {
          allowed,
          dailyLimit,
          dailyCount,
          dailyRemaining: Math.max(0, dailyLimit - dailyCount),
          dailyReset: dailyReset.toISOString(),
          weeklyLimit,
          weeklyCount,
          weeklyRemaining: Math.max(0, weeklyLimit - weeklyCount),
          weeklyReset: weeklyReset.toISOString()
        };
      } else {
        const dailyReset = new Date(now.getTime() + dayMs);
        const weeklyReset = new Date(now.getTime() + weekMs);
        try {
          await prisma.rateLimit.create({
            data: {
              ip: ipKey,
              dailyCount: 0,
              dailyReset,
              weeklyCount: 0,
              weeklyReset
            }
          });
        } catch {
          // Ignore concurrency conflict
        }
        return {
          allowed: true,
          dailyLimit,
          dailyCount: 0,
          dailyRemaining: dailyLimit,
          dailyReset: dailyReset.toISOString(),
          weeklyLimit,
          weeklyCount: 0,
          weeklyRemaining: weeklyLimit,
          weeklyReset: weeklyReset.toISOString()
        };
      }
    } catch (err) {
      console.warn(`[Database:Prisma RateLimit] Error querying rate limit: ${err.message}`);
    }
  }

  // In-memory fallback
  let record = inMemoryRateLimits.get(ipKey);
  if (!record) {
    record = {
      dailyCount: 0,
      dailyReset: new Date(now.getTime() + dayMs),
      weeklyCount: 0,
      weeklyReset: new Date(now.getTime() + weekMs)
    };
    inMemoryRateLimits.set(ipKey, record);
  } else {
    if (now >= record.dailyReset) {
      record.dailyCount = 0;
      record.dailyReset = new Date(now.getTime() + dayMs);
    }
    if (now >= record.weeklyReset) {
      record.weeklyCount = 0;
      record.weeklyReset = new Date(now.getTime() + weekMs);
    }
  }

  const allowed = record.dailyCount < dailyLimit && record.weeklyCount < weeklyLimit;
  return {
    allowed,
    dailyLimit,
    dailyCount: record.dailyCount,
    dailyRemaining: Math.max(0, dailyLimit - record.dailyCount),
    dailyReset: record.dailyReset.toISOString(),
    weeklyLimit,
    weeklyCount: record.weeklyCount,
    weeklyRemaining: Math.max(0, weeklyLimit - record.weeklyCount),
    weeklyReset: record.weeklyReset.toISOString()
  };
};

export const consumeRateLimit = async (clientIp) => {
  const ipKey = clientIp || "anonymous";
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;

  if (isDbConnected) {
    try {
      await prisma.rateLimit.upsert({
        where: { ip: ipKey },
        create: {
          ip: ipKey,
          dailyCount: 1,
          dailyReset: new Date(now.getTime() + dayMs),
          weeklyCount: 1,
          weeklyReset: new Date(now.getTime() + weekMs)
        },
        update: {
          dailyCount: { increment: 1 },
          weeklyCount: { increment: 1 }
        }
      });
    } catch (err) {
      console.warn(`[Database:Prisma RateLimit] Error consuming limit: ${err.message}`);
    }
  }

  const record = inMemoryRateLimits.get(ipKey);
  if (record) {
    record.dailyCount += 1;
    record.weeklyCount += 1;
  }
};
