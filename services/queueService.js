import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { sendMail } from "./mailer.js";
import { birthdayTemplate, getOrdinalSuffix } from "./mailTemplate.js";
import { calculateBirthdayDispatch } from "../utils/dateUtils.js";

const QUEUE_NAME = "birthday-queue";
let redisClient = null;
let birthdayQueue = null;
let birthdayWorker = null;
let isQueueInitialized = false;

/**
 * Creates or retrieves lazy-connected IORedis client.
 * Configured specifically for BullMQ and Upstash TLS.
 */
export const getRedisClient = () => {
  const redisUrl = (process.env.REDIS_URL || process.env.REDIS || "").replace(/^["']|["']$/g, "").trim();
  if (!redisUrl) return null;

  if (!redisClient) {
    const isTls = redisUrl.startsWith("rediss://");
    const options = {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    };

    if (isTls) {
      options.tls = { rejectUnauthorized: false };
    }

    redisClient = new Redis(redisUrl, options);

    redisClient.on("error", (err) => {
      console.warn(`[Redis:Warning] Connection notice: ${err.message}`);
    });

    redisClient.on("connect", () => {
      console.log("[Redis] Connected to Redis cluster.");
    });
  }

  return redisClient;
};

/**
 * Checks if Redis URL is provided.
 */
export const isRedisConfigured = () => {
  const redisUrl = process.env.REDIS_URL || process.env.REDIS;
  return Boolean(redisUrl && redisUrl.trim().length > 0);
};

/**
 * Initializes BullMQ Queue and Worker with lazy connection and event-driven delayed jobs.
 * Cleans up legacy daily repeating polling cron jobs so Redis operates purely event-driven.
 */
export const initQueueSystem = async (options = {}) => {
  if (isQueueInitialized) return { queue: birthdayQueue, worker: birthdayWorker };
  if (!isRedisConfigured()) {
    console.log("[BullMQ] REDIS_URL not configured. Operating in direct mode.");
    return null;
  }

  try {
    const connection = getRedisClient();
    if (!connection) return null;

    // 1. Initialize BullMQ Queue
    birthdayQueue = new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 200 },
      },
    });

    // 2. Remove legacy daily polling cron jobs from Redis if any exist
    try {
      const repeatable = await birthdayQueue.getRepeatableJobs();
      for (const rJob of repeatable) {
        await birthdayQueue.removeRepeatableByKey(rJob.key);
      }
      const legacyJob = await birthdayQueue.getJob("daily-cron-scheduler");
      if (legacyJob) {
        await legacyJob.remove();
        console.log("[BullMQ] Removed old daily-cron-scheduler job from Redis.");
      }
      if (repeatable.length > 0) {
        console.log(`[BullMQ] Cleaned up ${repeatable.length} legacy daily polling cron job(s) from Redis.`);
      }
    } catch (cleanErr) {
      // Non-fatal if none exist
    }

    // 3. Initialize BullMQ Worker
    birthdayWorker = new Worker(
      QUEUE_NAME,
      async (job) => {
        console.log(`[BullMQ:Worker] Processing job "${job.name}" (ID: ${job.id})`);

        // Retired daily polling cron job - gracefully discard
        if (job.name === "cron-daily-birthdays") {
          return { skipped: true, reason: "polling_cron_retired" };
        }

        // Event-driven scheduled birthday email (5s eve threshold)
        if (job.name === "scheduled-birthday-email") {
          const { userId, name, email, turningAge } = job.data;
          console.log(`[BullMQ:Worker] Firing scheduled birthday email for ${name} (${email})`);

          const {
            getContactById,
            isBirthdayAlreadySentToday,
            recordDeliveryLog
          } = await import("../controllers/birthdayController.js");

          const contact = getContactById(userId);
          if (!contact) {
            console.log(`[BullMQ:Worker] Contact ${userId} no longer exists. Skipping.`);
            return { skipped: true, reason: "contact_deleted" };
          }

          if (isBirthdayAlreadySentToday(contact.email)) {
            console.log(`[BullMQ:Worker] Already dispatched today for ${contact.email}. Rescheduling next year.`);
            await scheduleContactBirthdayJob(contact);
            return { skipped: true, reason: "already_sent_today" };
          }

          const html = birthdayTemplate(contact.name, contact.email, { turningAge });
          const subject = turningAge
            ? `Happy ${getOrdinalSuffix(turningAge)} Birthday, ${contact.name}!`
            : `Happy Birthday, ${contact.name}!`;
          const result = await sendMail(contact.email, subject, html);

          recordDeliveryLog({
            name: contact.name,
            email: contact.email,
            status: result.success ? (result.simulated ? "simulated" : "sent") : "failed",
            type: "scheduled_eve",
            turningAge,
            messageId: `job_${job.id}`,
            error: result.error || null
          });

          // Check if contact has a user-specified untilYear cutoff
          if (contact.untilYear && targetYear >= contact.untilYear) {
            console.log(
              `[BullMQ:Worker] ${contact.name} reached untilYear cutoff (${contact.untilYear}). Dropping future automatic repeats.`
            );
            return result;
          }

          // By default, repeat every year indefinitely
          await scheduleContactBirthdayJob(contact);
          return result;
        }

        // Direct birthday send job
        if (job.name === "send-birthday-email") {
          const { name, email, turningAge } = job.data;
          const html = birthdayTemplate(name, email, { turningAge });
          const subject = turningAge
            ? `Happy ${getOrdinalSuffix(turningAge)} Birthday, ${name}!`
            : `Happy Birthday, ${name}!`;
          const result = await sendMail(email, subject, html);
          try {
            const { recordDeliveryLog } = await import("../controllers/birthdayController.js");
            recordDeliveryLog({
              name,
              email,
              status: result.success ? (result.simulated ? "simulated" : "sent") : "failed",
              type: "automatic",
              turningAge,
              messageId: `job_${job.id}`,
              error: result.error || null
            });
          } catch (logErr) {
            console.warn(`[BullMQ:Worker] Notice logging result: ${logErr.message}`);
          }
          return result;
        }

        // Test email job
        if (job.name === "send-test-email") {
          const { name, email, customMessage, turningAge, senderName } = job.data;
          const html = birthdayTemplate(name, email, { customMessage, turningAge, senderName });
          const subject = turningAge
            ? `Happy ${getOrdinalSuffix(turningAge)} Birthday, ${name}!`
            : `Test: HBday Celebration for ${name}`;
          const result = await sendMail(email, subject, html, { senderName });
          try {
            const { recordDeliveryLog } = await import("../controllers/birthdayController.js");
            recordDeliveryLog({
              name,
              email,
              status: result.success ? (result.simulated ? "simulated" : "sent") : "failed",
              type: "test",
              messageId: `job_${job.id}`,
              error: result.error || null
            });
          } catch (logErr) {
            console.warn(`[BullMQ:Worker] Notice logging result: ${logErr.message}`);
          }
          return result;
        }

        throw new Error(`Unknown job type: ${job.name}`);
      },
      {
        connection,
        concurrency: 5,
      }
    );

    birthdayWorker.on("completed", (job, result) => {
      console.log(`[BullMQ:Worker] Job ${job.id} (${job.name}) completed successfully.`);
    });

    birthdayWorker.on("failed", (job, err) => {
      console.error(`[BullMQ:Worker] Job ${job?.id} (${job?.name}) failed: ${err.message}`);
    });

    birthdayWorker.on("error", (err) => {
      console.warn(`[BullMQ:Worker] Worker warning: ${err.message}`);
    });

    isQueueInitialized = true;
    console.log("[BullMQ] Event-driven Queue and Worker initialized with Redis (Zero Daily Polling).");

    // 4. Synchronize all contacts into individual delayed jobs (23:59:55 eve threshold)
    await syncAllScheduledBirthdays();

    return { queue: birthdayQueue, worker: birthdayWorker };
  } catch (err) {
    console.error(`[BullMQ:Error] Failed to initialize queue system: ${err.message}`);
    return null;
  }
};

/**
 * Schedules an individual delayed job for a contact's next birthday at 23:59:55 on the eve of their birthday.
 * 5-second threshold ensures email finishes delivery right as the clock strikes midnight.
 */
export const scheduleContactBirthdayJob = async (user) => {
  if (!user || !user.dob) return null;

  const dispatch = calculateBirthdayDispatch(user.dob, new Date(), 5000);
  if (!dispatch) return null;

  // Drop future automatic scheduling if contact has passed user-specified untilYear limit
  if (user.untilYear && dispatch.targetYear > user.untilYear) {
    console.log(
      `[BullMQ:Scheduler] Contact ${user.name} exceeded untilYear limit (${user.untilYear}). Dropping future automatic repeats.`
    );
    return { scheduled: false, dropped: true, reason: "until_year_exceeded", untilYear: user.untilYear };
  }

  if (!birthdayQueue) {
    await initQueueSystem();
    if (!birthdayQueue) return null;
  }

  const jobId = `bday-${user.id}-${dispatch.targetYear}`;

  try {
    // Remove existing delayed job if present for this target year
    const existing = await birthdayQueue.getJob(jobId);
    if (existing) {
      const state = await existing.getState();
      if (state === "delayed" || state === "waiting") {
        await existing.remove();
      }
    }

    const job = await birthdayQueue.add(
      "scheduled-birthday-email",
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        dob: user.dob,
        turningAge: dispatch.turningAge,
        targetYear: dispatch.targetYear,
        scheduledEve: dispatch.dispatchDate.toISOString(),
      },
      {
        delay: dispatch.delayMs,
        jobId,
        removeOnComplete: true,
      }
    );

    console.log(
      `[BullMQ:Scheduler] Queued birthday for ${user.name} at ${dispatch.dispatchDate.toLocaleString()} (Delay: ${Math.round(dispatch.delayMs / 1000)}s, Eve Threshold: 23:59:55)`
    );

    return {
      scheduled: true,
      jobId: job.id,
      dispatchDate: dispatch.dispatchDate.toISOString(),
      delayMs: dispatch.delayMs,
      turningAge: dispatch.turningAge,
      isTodayCatchup: dispatch.isTodayCatchup,
    };
  } catch (err) {
    console.warn(`[BullMQ:Scheduler] Notice scheduling job for ${user.name}: ${err.message}`);
    return null;
  }
};

/**
 * Removes a contact's scheduled delayed birthday job from the Redis queue.
 */
export const removeContactBirthdayJob = async (userId) => {
  if (!birthdayQueue || !userId) return false;
  try {
    const delayed = await birthdayQueue.getDelayed(0, 100);
    let removed = false;
    for (const job of delayed) {
      if (job.data?.userId === userId || (job.id && job.id.startsWith(`bday-${userId}`))) {
        await job.remove();
        removed = true;
      }
    }
    return removed;
  } catch (err) {
    console.warn(`[BullMQ:Scheduler] Notice removing job for ${userId}: ${err.message}`);
    return false;
  }
};

/**
 * Synchronizes all birthday contacts from storage into BullMQ delayed jobs.
 */
export const syncAllScheduledBirthdays = async () => {
  if (!birthdayQueue) return 0;
  try {
    const { getAllContacts } = await import("../controllers/birthdayController.js");
    const contacts = getAllContacts();
    let count = 0;
    for (const c of contacts) {
      const res = await scheduleContactBirthdayJob(c);
      if (res && res.scheduled) count++;
    }
    console.log(`[BullMQ:Scheduler] Synchronized ${count} event-driven birthday jobs in Redis.`);
    return count;
  } catch (err) {
    console.warn(`[BullMQ:Scheduler] Error syncing scheduled birthdays: ${err.message}`);
    return 0;
  }
};

/**
 * Enqueue a birthday celebration email job or execute directly if queue is inactive.
 */
export const enqueueBirthdayEmail = async (user, turningAge) => {
  if (birthdayQueue) {
    try {
      const job = await birthdayQueue.add("send-birthday-email", {
        name: user.name,
        email: user.email,
        turningAge,
      });
      return { queued: true, jobId: job.id };
    } catch (err) {
      console.warn(`[BullMQ] Could not enqueue, executing directly: ${err.message}`);
    }
  }

  // Fallback to direct send
  const html = birthdayTemplate(user.name, user.email, { turningAge });
  const subject = turningAge
    ? `Happy ${getOrdinalSuffix(turningAge)} Birthday, ${user.name}!`
    : `Happy Birthday, ${user.name}!`;
  const result = await sendMail(user.email, subject, html);
  return { queued: false, result };
};

/**
 * Enqueue a test email job or execute directly.
 */
export const enqueueTestEmail = async (name, email, options = {}) => {
  const turningAge = options.turningAge || null;
  const senderName = options.senderName || null;
  const customMessage = options.customMessage || "This is an automated test email dispatched via BullMQ and Upstash Redis.";

  if (birthdayQueue) {
    try {
      const job = await birthdayQueue.add("send-test-email", {
        name,
        email,
        customMessage,
        turningAge,
        senderName
      });
      return { queued: true, jobId: job.id };
    } catch (err) {
      console.warn(`[BullMQ] Could not enqueue test, executing directly: ${err.message}`);
    }
  }

  const html = birthdayTemplate(name, email, {
    customMessage,
    turningAge,
    senderName
  });
  const subject = turningAge
    ? `Happy ${getOrdinalSuffix(turningAge)} Birthday, ${name}!`
    : "Test: HBday Celebration";
  const result = await sendMail(email, subject, html, { senderName });
  return { queued: false, result };
};

/**
 * Returns real-time metrics of the BullMQ queue and upcoming delayed birthday jobs.
 */
export const getQueueMetrics = async () => {
  if (!birthdayQueue) {
    return {
      active: false,
      configured: isRedisConfigured(),
      waiting: 0,
      activeJobs: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      scheduledCount: 0,
      scheduledPreviews: [],
      status: isRedisConfigured() ? "Connecting / Idle" : "Standalone (Direct)",
    };
  }

  try {
    const [waiting, activeJobs, completed, failed, delayed] = await Promise.all([
      birthdayQueue.getWaitingCount(),
      birthdayQueue.getActiveCount(),
      birthdayQueue.getCompletedCount(),
      birthdayQueue.getFailedCount(),
      birthdayQueue.getDelayedCount(),
    ]);

    // Fetch upcoming delayed jobs for UI preview
    const delayedJobs = await birthdayQueue.getDelayed(0, 10);
    const scheduledPreviews = delayedJobs.map((j) => ({
      id: j.id,
      name: j.data?.name || "Friend",
      email: j.data?.email || "",
      turningAge: j.data?.turningAge,
      scheduledEve: j.data?.scheduledEve,
      delaySeconds: Math.max(0, Math.round((j.timestamp + j.delay - Date.now()) / 1000)),
    }));

    return {
      active: true,
      configured: true,
      waiting,
      activeJobs,
      completed,
      failed,
      delayed,
      scheduledCount: delayed,
      scheduledPreviews,
      status: "Event-Driven • 5s Eve Threshold (Zero Polling)",
    };
  } catch (err) {
    return {
      active: false,
      configured: true,
      error: err.message,
      status: "Redis Reconnecting",
    };
  }
};
