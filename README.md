# HBday • Royal Birthday Automation & Notification Platform

HBday is an automated birthday celebration service and royal glassmorphism web platform. It tracks birthdays for friends, family, and teams, schedules precision greeting emails with zero daily polling loops, and delivers celebration cards right on time.

---

## What It Does

- **Event-Driven Midnight Delivery**: Automatically calculates each contact's upcoming birthday and triggers dispatch at **`23:59:55` on the eve of their birthday** (a 5-second buffer before midnight) so email transit finishes right as the clock strikes 12:00:00 AM.
- **Zero Daily Polling**: Eliminates resource-heavy daily polling cron jobs. Individual celebration jobs are scheduled directly in Redis; the system remains idle until a birthday arrives.
- **Automated Annual Re-scheduling**: After delivering a greeting, HBday automatically schedules next year's celebration job in the background.
- **Royal Liquid Glassmorphism Dashboard**: Real-time web interface featuring multi-tiered liquid glass refraction, live countdown timers, zodiac signs, and delivery history.
- **Interactive Card Studio**: Live HTML email template designer with randomized inspiring quotes, real-time preview, and instant test dispatch.
- **Zero-Emoji Vector Iconography**: Pure, crisp vector Lucide SVG iconography across all web UI elements and outgoing celebration emails.
- **Idempotency & Duplicate Protection**: Ensures contacts never receive duplicate emails for the same calendar year.
- **Leap Year Intelligence**: Feb 29 birthdays are automatically celebrated on Feb 28 during non-leap years.
- **Safe Mailer Simulation Mode**: Operates seamlessly in safe simulation mode if EmailJS keys or API permissions are unconfigured, logging deliveries safely.
- **PostgreSQL & Supabase Cloud Storage**: Native relational database persistence with strict schemas (`birthdays`, `delivery_logs`, `rate_limits`), connection pooling, and automatic local JSON mirroring for offline resilience.
- **Anti-Spam Addition Rate Limiting**: Enforces strict daily (default 5) and weekly (default 15) addition quotas per client IP to safeguard public instances from spam flooding.
- **Full REST API**: Clean endpoints for managing contacts, checking quotas, reviewing real-time queue metrics, triggering checks, and viewing logs.

---

## Tech Stack

- **Runtime**: Bun or Node.js (ES Modules)
- **Web Framework**: Express 5
- **ORM & Database**: Prisma v5 (`@prisma/client@5.22.0`, schema at `prisma/schema.prisma` with zero config files, PostgreSQL / Prisma Postgres / Supabase & local JSON mirror)
- **Job Queue**: BullMQ
- **Cache & Event Store**: Upstash Redis (`ioredis` with lazy connection & TLS)
- **Rate Limiting**: IP-based sliding quota engine (Prisma backed with in-memory fallback)
- **Scheduler**: Event-driven delayed BullMQ jobs (5-second eve threshold)
- **Email Engine**: EmailJS SDK (`@emailjs/nodejs` with live dispatch & simulation fallback)
- **Test Runner**: Bun Test (`bun test`) & Node Test (`node --test`)
- **Frontend**: Vanilla HTML5, Multi-Tier CSS3 Liquid Glassmorphism, Lucide SVG Icons, Vanilla JS

---

## Quick Start

### 1. Installation

```bash
git clone https://github.com/nishur31/hbday.git
cd hbday
bun install # or npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your configuration:

```env
PORT=4000
EMAIL=yourgmail@gmail.com
PASS=your_16_char_google_app_password
REDIS_URL="rediss://default:...@profound-whale-126451.upstash.io:6379"
```

> **Note**: If `EMAIL` and `PASS` are empty, HBday runs in safe **Simulation Mode** — all features and logs work seamlessly without real email dispatch.

### 3. Start the Platform

```bash
# Using Bun
bun start

# Or using Node.js
npm start
```

Open the dashboard in your browser:
**http://localhost:4000**

### 4. Run Automated Tests

```bash
bun test
```

---

## REST API Reference

Base URL: `http://localhost:4000/api/v1`

| Method   | Endpoint              | Description                                                      |
| :------- | :-------------------- | :--------------------------------------------------------------- |
| `GET`    | `/health`             | Server and service health status                                 |
| `GET`    | `/stats`              | Contact counts, today's birthdays & live BullMQ queue metrics    |
| `GET`    | `/birthdays/today`    | List contacts celebrating their birthday today                   |
| `GET`    | `/birthdays/upcoming` | All contacts sorted chronologically by next birthday             |
| `GET`    | `/birthdays/quota`    | Caller's remaining daily & weekly addition limit                 |
| `POST`   | `/add-dob`            | Add a new birthday contact (`name`, `email`, `dob`, `untilYear`) |
| `PUT`    | `/birthdays/:id`      | Update an existing contact and reschedule their queue job        |
| `DELETE` | `/birthdays/:id`      | Delete a contact and cancel their queued job                     |
| `POST`   | `/trigger-check`      | Manually run birthday check and dispatch cards                   |
| `POST`   | `/send-test-mail`     | Send an instant test celebration card                            |
| `GET`    | `/template-preview`   | Live HTML preview of royal email card                            |
| `GET`    | `/logs`               | Email delivery history logs (newest first)                       |
| `DELETE` | `/logs`               | Clear delivery history                                           |

For curl command examples, see [curl.md](curl.md).
