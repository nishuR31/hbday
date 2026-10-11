import test from "node:test";
import assert from "node:assert/strict";
import {
  parseDOB,
  isBirthdayToday,
  getNextBirthday,
  daysUntil,
  calculateAge,
  getZodiacSign,
  formatDOBReadable
} from "../utils/dateUtils.js";
import { birthdayTemplate, BIRTHDAY_QUOTES, getRandomBirthdayQuote } from "../services/mailTemplate.js";
import { validateBirthday, enrichUser } from "../controllers/birthdayController.js";

test("DateUtils - parseDOB", () => {
  assert.deepEqual(parseDOB("2002-02-01"), { year: 2002, month: 2, day: 1 });
  assert.equal(parseDOB("invalid"), null);
  assert.equal(parseDOB(""), null);
});

test("DateUtils - isBirthdayToday", () => {
  const simulatedToday = new Date(2026, 4, 15); // May 15, 2026
  assert.equal(isBirthdayToday("2000-05-15", simulatedToday), true);
  assert.equal(isBirthdayToday("2000-05-16", simulatedToday), false);
  assert.equal(isBirthdayToday("1995-12-01", simulatedToday), false);
});

test("DateUtils - isBirthdayToday handles Feb 29 on non-leap year", () => {
  const nonLeapFeb28 = new Date(2025, 1, 28); // Feb 28, 2025 (non-leap)
  assert.equal(isBirthdayToday("2004-02-29", nonLeapFeb28), true);
});

test("DateUtils - daysUntil & getNextBirthday", () => {
  const baseDate = new Date(2026, 4, 15, 12, 0, 0); // May 15, 2026 noon

  // Today is birthday
  assert.equal(daysUntil("2000-05-15", baseDate), 0);

  // Tomorrow is birthday
  assert.equal(daysUntil("2000-05-16", baseDate), 1);

  // Birthday next year (yesterday's birthday)
  const days = daysUntil("2000-05-14", baseDate);
  assert.ok(days > 360 && days <= 366);
});

test("DateUtils - calculateAge", () => {
  const baseDate = new Date(2026, 4, 15); // May 15, 2026

  // Born May 15, 2000 -> turning 26 today
  const ageToday = calculateAge("2000-05-15", baseDate);
  assert.equal(ageToday.currentAge, 26);
  assert.equal(ageToday.turningAge, 26);

  // Born Dec 25, 2000 -> currently 25, turning 26 later
  const ageLater = calculateAge("2000-12-25", baseDate);
  assert.equal(ageLater.currentAge, 25);
  assert.equal(ageLater.turningAge, 26);
});

test("DateUtils - getZodiacSign", () => {
  assert.equal(getZodiacSign("2002-02-01").name, "Aquarius");
  assert.equal(getZodiacSign("1999-04-10").name, "Aries");
  assert.equal(getZodiacSign("2005-08-15").name, "Leo");
});

test("MailTemplate - renders recipient without undefined and supports random quotes", () => {
  const tpl = birthdayTemplate("Nishu", "nishu@test.com", { turningAge: 24 });
  assert.ok(tpl.includes("Happy 24th Birthday"));
  assert.ok(tpl.includes("nishu@test.com"));
  assert.ok(!tpl.includes("undefined"));

  const quote = getRandomBirthdayQuote();
  assert.ok(typeof quote === "string" && quote.length > 20);
  assert.ok(BIRTHDAY_QUOTES.includes(quote));
  assert.ok(BIRTHDAY_QUOTES.length >= 8);
});

test("Controller - validateBirthday validation rules", () => {
  // Valid
  assert.equal(validateBirthday({ name: "Nishu", email: "nishu@test.com", dob: "2002-02-01" }), null);

  // Missing name
  assert.ok(validateBirthday({ name: "", email: "nishu@test.com", dob: "2002-02-01" }));

  // Invalid email
  assert.ok(validateBirthday({ name: "Nishu", email: "not-an-email", dob: "2002-02-01" }));

  // Invalid DOB format
  assert.ok(validateBirthday({ name: "Nishu", email: "nishu@test.com", dob: "01-02-2002" }));

  // Future DOB
  assert.ok(validateBirthday({ name: "Nishu", email: "nishu@test.com", dob: "2099-01-01" }));
});

test("Controller - enrichUser", () => {
  const user = { id: "u1", name: "Alice", email: "alice@example.com", dob: "2000-05-15" };
  const baseDate = new Date(2026, 4, 15);
  const enriched = enrichUser(user, baseDate);

  assert.equal(enriched.isToday, true);
  assert.equal(enriched.daysLeft, 0);
  assert.equal(enriched.zodiac.name, "Taurus");
});

test("QueueService - Redis configuration and lazy client setup", async () => {
  const { isRedisConfigured, getRedisClient, getQueueMetrics } = await import("../services/queueService.js");
  assert.equal(typeof isRedisConfigured(), "boolean");

  const redis = getRedisClient();
  if (isRedisConfigured()) {
    assert.ok(redis !== null);
    assert.equal(redis.options.lazyConnect, true);
    assert.equal(redis.options.maxRetriesPerRequest, null);
  }

  const metrics = await getQueueMetrics();
  assert.ok("active" in metrics);
  assert.ok("configured" in metrics);
  assert.ok("waiting" in metrics);
  assert.ok("status" in metrics);
});

test("Controller - recordDeliveryLog appends and updates queued logs", async () => {
  const { recordDeliveryLog } = await import("../controllers/birthdayController.js");
  const testJobId = `job_test_${Date.now()}`;

  const queuedEntry = recordDeliveryLog({
    name: "Queue Tester",
    email: "tester@example.com",
    status: "queued",
    type: "test",
    messageId: testJobId
  });

  assert.equal(queuedEntry.status, "queued");
  assert.equal(queuedEntry.messageId, testJobId);

  // Update in place
  const updatedEntry = recordDeliveryLog({
    name: "Queue Tester",
    email: "tester@example.com",
    status: "sent",
    type: "test",
    messageId: testJobId
  });

  assert.equal(updatedEntry.status, "sent");
  assert.equal(updatedEntry.id, queuedEntry.id);
});

test("DateUtils - calculateBirthdayDispatch schedules at 23:59:55 eve (5s threshold)", async () => {
  const { calculateBirthdayDispatch } = await import("../utils/dateUtils.js");

  // Simulated now: Oct 11, 2026 20:00:00 (8:00 PM)
  const simulatedNow = new Date(2026, 9, 11, 20, 0, 0);

  // Birthday tomorrow: Oct 12, 1995
  const dispatchTomorrow = calculateBirthdayDispatch("1995-10-12", simulatedNow, 5000);
  assert.ok(dispatchTomorrow !== null);
  assert.equal(dispatchTomorrow.targetYear, 2026);
  assert.equal(dispatchTomorrow.turningAge, 31);

  // Expected dispatch time: Oct 11, 2026 23:59:55 (5s before midnight)
  const expectedDate = new Date(2026, 9, 11, 23, 59, 55);
  assert.equal(dispatchTomorrow.dispatchDate.getTime(), expectedDate.getTime());

  // Delay should be exactly 3 hours, 59 minutes, 55 seconds (14395000 ms)
  const expectedDelay = expectedDate.getTime() - simulatedNow.getTime();
  assert.equal(dispatchTomorrow.delayMs, expectedDelay);
  assert.equal(dispatchTomorrow.delayMs, 14395000);

  // Birthday earlier this year (passed): May 15
  const dispatchPassed = calculateBirthdayDispatch("1990-05-15", simulatedNow, 5000);
  assert.equal(dispatchPassed.targetYear, 2027); // Schedules for next year
  assert.equal(dispatchPassed.turningAge, 37);
  const expectedNextYearEve = new Date(2027, 4, 14, 23, 59, 55);
  assert.equal(dispatchPassed.dispatchDate.getTime(), expectedNextYearEve.getTime());
});

test("MailTemplate - formulates curated personal wish from the user rather than developer", () => {
  const tpl = birthdayTemplate("Elena", "elena@example.com", {
    turningAge: 28,
    senderName: "Nishu",
    senderEmail: "nishu.dev@gmail.com"
  });

  // Verify recipient and sender
  assert.ok(tpl.includes("Happy 28th Birthday"));
  assert.ok(tpl.includes("Elena"));
  assert.ok(tpl.includes("Nishu"));
  assert.ok(tpl.includes("nishu.dev@gmail.com"));

  // Verify no bot/developer wording
  assert.ok(!tpl.includes("Automated Royal Butler"));
  assert.ok(!tpl.includes("Developer"));
  assert.ok(tpl.includes("With warmest thoughts and wishes"));
  assert.ok(tpl.includes("Sent with warm thoughts from Nishu to Elena"));
});

test("MailTemplate - defaults sender to Backendteam management and personal email", () => {
  const originalSenderName = process.env.SENDER_NAME;
  delete process.env.SENDER_NAME;
  const defaultTpl = birthdayTemplate("Alex", "alex@example.com");
  if (originalSenderName) process.env.SENDER_NAME = originalSenderName;
  assert.ok(defaultTpl.includes("With warmest thoughts and wishes"));
  assert.ok(defaultTpl.includes("Backendteam management"));
  assert.ok(defaultTpl.includes("backendteam.management@gmail.com"));
});

test("Controller - validateBirthday & enrichUser support untilYear cutoff", () => {
  // Valid untilYear (future year)
  assert.equal(
    validateBirthday({ name: "Alex", email: "alex@example.com", dob: "1995-12-25", untilYear: 2028 }),
    null
  );

  // Default: untilYear omitted (repeats every year forever)
  assert.equal(
    validateBirthday({ name: "Alex", email: "alex@example.com", dob: "1995-12-25" }),
    null
  );

  // Invalid untilYear (past year)
  assert.ok(
    validateBirthday({ name: "Alex", email: "alex@example.com", dob: "1995-12-25", untilYear: 2010 })
  );

  // enrichUser default vs specified
  const userForever = { id: "u1", name: "Alex", email: "alex@example.com", dob: "1995-12-25" };
  const enrichedForever = enrichUser(userForever);
  assert.equal(enrichedForever.untilYear, null);
  assert.equal(enrichedForever.repeatSummary, "Repeats yearly forever");

  const userUntil = { id: "u2", name: "Alex", email: "alex@example.com", dob: "1995-12-25", untilYear: 2029 };
  const enrichedUntil = enrichUser(userUntil);
  assert.equal(enrichedUntil.untilYear, 2029);
  assert.equal(enrichedUntil.repeatSummary, "Repeats yearly until 2029");
});

test("QueueService - drops future jobs when untilYear is exceeded", async () => {
  const { scheduleContactBirthdayJob } = await import("../services/queueService.js");

  // Contact with cutoff year 2025 (already past, so next birthday 2026/2027 exceeds it)
  const contactCutoff = {
    id: "drop-test-1",
    name: "Retired Friend",
    email: "retired@example.com",
    dob: "1990-05-15",
    untilYear: 2025
  };

  const res = await scheduleContactBirthdayJob(contactCutoff);
  assert.equal(res.scheduled, false);
  assert.equal(res.dropped, true);
  assert.equal(res.reason, "until_year_exceeded");
});

test("RateLimiter - enforces daily and weekly addition limits per IP to prevent spam", async () => {
  const { checkRateLimit, consumeRateLimit } = await import("../services/db.js");
  const testIp = `test-ip-${Date.now()}`;

  // Initial quota should be allowed with full remaining
  const initial = await checkRateLimit(testIp);
  assert.equal(initial.allowed, true);
  assert.equal(initial.dailyCount, 0);
  assert.ok(initial.dailyRemaining >= 3 && initial.dailyRemaining <= 5);

  // Consume up to the limit
  const limit = initial.dailyLimit;
  for (let i = 0; i < limit; i++) {
    await consumeRateLimit(testIp);
  }

  // Quota should now be exhausted and blocked
  const exhausted = await checkRateLimit(testIp);
  assert.equal(exhausted.allowed, false);
  assert.equal(exhausted.dailyRemaining, 0);
  assert.equal(exhausted.dailyCount, limit);
});

test("Database - supports contact CRUD and persistent storage mirroring", async () => {
  const {
    dbGetContacts,
    dbInsertContact,
    dbUpdateContact,
    dbDeleteContact,
    dbGetContactById
  } = await import("../services/db.js");

  const testId = `db-test-${Date.now()}`;
  const newContact = {
    id: testId,
    name: "DB Tester",
    email: "dbtester@example.com",
    dob: "1998-04-12",
    untilYear: 2030,
    ip: "127.0.0.1"
  };

  // Insert
  await dbInsertContact(newContact);
  const fetched = await dbGetContactById(testId);
  assert.ok(fetched);
  assert.equal(fetched.name, "DB Tester");
  assert.equal(fetched.untilYear, 2030);

  // Update
  await dbUpdateContact(testId, {
    name: "DB Tester Updated",
    email: "dbtester@example.com",
    dob: "1998-04-12",
    untilYear: 2032
  });
  const updated = await dbGetContactById(testId);
  assert.equal(updated.name, "DB Tester Updated");
  assert.equal(updated.untilYear, 2032);

  // Delete
  const deleted = await dbDeleteContact(testId);
  assert.equal(deleted, true);
  const afterDelete = await dbGetContactById(testId);
  assert.equal(afterDelete, null);
});

test("Security - defends against script injection and XSS payloads in validation", () => {
  // Script tag in name
  const scriptNameErr = validateBirthday({
    name: "<script>alert('xss')</script>",
    email: "valid@example.com",
    dob: "1995-10-10"
  });
  assert.ok(scriptNameErr);
  assert.match(scriptNameErr, /invalid|dangerous/i);

  // HTML event handler injection in name
  const eventErr = validateBirthday({
    name: "Alex<img src=x onerror=alert(1)>",
    email: "valid@example.com",
    dob: "1995-10-10"
  });
  assert.ok(eventErr);

  // Invalid email with injection attempt
  const emailInjectionErr = validateBirthday({
    name: "Alex Smith",
    email: "admin<script>@example.com",
    dob: "1995-10-10"
  });
  assert.ok(emailInjectionErr);
});

test("Security - escapes HTML entities and defends against prototype pollution", async () => {
  const { escapeHtml, stripDangerousContent, sanitizeData } = await import("../utils/security.js");

  // HTML entity escaping
  assert.equal(
    escapeHtml("<script>alert('pwned')</script>"),
    "&lt;script&gt;alert(&#39;pwned&#39;)&lt;&#x2F;script&gt;"
  );

  // Strip dangerous scripts
  const stripped = stripDangerousContent("Hello <script>bad()</script>world <iframe src='evil.com'></iframe>");
  assert.ok(!stripped.includes("<script>"));
  assert.ok(!stripped.includes("<iframe>"));

  // Prototype pollution protection
  const maliciousPayload = JSON.parse('{"name":"Safe","__proto__":{"polluted":true},"nested":{"constructor":{"admin":true}}}');
  const sanitized = sanitizeData(maliciousPayload);

  assert.equal(sanitized.name, "Safe");
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(sanitized.__proto__, Object.prototype);
});

test("Security - mailTemplate escapes dynamic recipient and message content", () => {
  const tpl = birthdayTemplate(
    "<img src=x onerror=alert(1)>Malicious",
    "bad@example.com",
    {
      customMessage: "<script>alert('stolen')</script>Joy and success!",
      senderName: "<b onmouseover=evil()>Attacker</b>"
    }
  );

  // Template must NOT contain unescaped script or onerror tags
  assert.ok(!tpl.includes("<script>alert('stolen')</script>"));
  assert.ok(!tpl.includes("<img src=x onerror=alert(1)>"));
  assert.ok(!tpl.includes("<b onmouseover=evil()>"));

  // Must contain escaped HTML entities
  assert.ok(tpl.includes("&lt;img src=x onerror=alert(1)&gt;"));
  assert.ok(tpl.includes("&lt;script&gt;alert(&#39;stolen&#39;)&lt;&#x2F;script&gt;"));
});

test("Security - securitySanitizerMiddleware safely handles readonly and getter properties on req.query and req.params", async () => {
  const { securitySanitizerMiddleware } = await import("../utils/security.js");

  // Create mock request with readonly query getter (matching Express / Bun strict behavior)
  const reqProto = {};
  const internalQuery = { search: "<script>alert(1)</script>friend", page: "1" };
  Object.defineProperty(reqProto, "query", {
    get() {
      return internalQuery;
    },
    enumerable: true,
    configurable: true
  });

  const mockReq = Object.create(reqProto);
  mockReq.body = { name: "<b>Clean</b>", bio: "<script>xss()</script>Hello" };
  mockReq.params = { id: "<img src=x onerror=1>123" };

  let nextCalled = false;
  securitySanitizerMiddleware(mockReq, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.ok(!mockReq.query.search.includes("<script>"));
  assert.ok(!mockReq.body.bio.includes("<script>"));
  assert.ok(!mockReq.params.id.includes("<img"));
});

test("Mailer - EmailJS SDK configuration and safe simulation dispatch", async () => {
  const { isMailerConfigured, sendMail } = await import("../services/mailer.js");

  // Returns boolean based on MAIL_PUB / MAIL_SEC or fallback
  const configured = isMailerConfigured();
  assert.equal(typeof configured, "boolean");

  // Send a test mail - should either dispatch via EmailJS SDK or fall back gracefully
  const result = await sendMail(
    "testrecipient@example.com",
    "Happy Birthday",
    "<p>Happy Birthday!</p>",
    { turningAge: 25, recipientName: "Test Recipient" }
  );

  assert.ok("success" in result);
  assert.ok(typeof result.success === "boolean");
  if (result.success) {
    assert.ok(result.messageId || result.simulated);
  }
});

test("Passkey - isolates contacts and extracts passkey from request header and query", async () => {
  const { getUserPasskey } = await import("../controllers/birthdayController.js");
  const { dbInsertContact, dbGetContacts, dbDeleteContact } = await import("../services/db.js");

  // Header extraction
  const reqWithHeader = { headers: { "x-passkey": "hbd_usr_header123" } };
  assert.equal(getUserPasskey(reqWithHeader), "hbd_usr_header123");

  // Query extraction
  const reqWithQuery = { headers: {}, query: { passkey: "hbd_usr_query456" } };
  assert.equal(getUserPasskey(reqWithQuery), "hbd_usr_query456");

  // Fallback for null
  assert.equal(getUserPasskey({ headers: {}, query: {} }), null);

  // Multi-user database isolation
  const userA = `hbd_usr_testA_${Date.now()}`;
  const userB = `hbd_usr_testB_${Date.now()}`;

  const contactA = await dbInsertContact({
    name: "Alice Friend",
    email: "alicefriend@example.com",
    dob: "1998-07-20",
    userKey: userA
  });

  const contactB = await dbInsertContact({
    name: "Bob Colleague",
    email: "bobcolleague@example.com",
    dob: "1995-11-03",
    userKey: userB
  });

  // Fetch for user A
  const contactsForA = await dbGetContacts(userA);
  assert.ok(contactsForA.some((c) => c.name === "Alice Friend"));
  assert.ok(!contactsForA.some((c) => c.name === "Bob Colleague"));

  // Fetch for user B
  const contactsForB = await dbGetContacts(userB);
  assert.ok(contactsForB.some((c) => c.name === "Bob Colleague"));
  assert.ok(!contactsForB.some((c) => c.name === "Alice Friend"));

  // Clean up
  await dbDeleteContact(contactA.id, userA);
  await dbDeleteContact(contactB.id, userB);
});

test("Prisma v5 - loads PrismaClient singleton and exposes Birthday, DeliveryLog, RateLimit models", async () => {
  const { prisma, getPrismaClient } = await import("../services/prisma.js");
  assert.ok(prisma);
  assert.equal(typeof getPrismaClient, "function");
  assert.ok(typeof prisma.birthday === "object");
  assert.ok(typeof prisma.deliveryLog === "object");
  assert.ok(typeof prisma.rateLimit === "object");
  assert.equal(typeof prisma.birthday.findMany, "function");
  assert.equal(typeof prisma.deliveryLog.findMany, "function");
  assert.equal(typeof prisma.rateLimit.findUnique, "function");
});

test("Prisma v5 - db layer initializes and interacts gracefully", async () => {
  const { initDatabase, isDatabaseConnected, dbGetContacts, dbInsertContact, dbDeleteContact } = await import("../services/db.js");
  const connected = await initDatabase();
  assert.equal(typeof connected, "boolean");
  assert.equal(isDatabaseConnected(), connected);

  const testKey = `prisma_test_user_${Date.now()}`;
  const contact = await dbInsertContact({
    name: "Prisma v5 Tester",
    email: "prisma.tester@example.com",
    dob: "1999-09-09",
    userKey: testKey
  });

  assert.ok(contact.id);
  assert.equal(contact.name, "Prisma v5 Tester");
  assert.equal(contact.userKey, testKey);

  const list = await dbGetContacts(testKey);
  assert.ok(list.some((c) => c.id === contact.id));

  const deleted = await dbDeleteContact(contact.id, testKey);
  assert.equal(deleted, true);
});


