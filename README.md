## Birthday Automation Service

Backend microservice that automatically sends birthday emails and exposes APIs for managing users with dates of birth. Built as an automation worker, designed to expand into a full notification platform.

---

### Core Purpose

• Store users with DOB
• Run a daily scheduler
• Detect birthdays
• Send emails automatically
• Track delivery logs
• Provide APIs for dashboard/admin control

---

### Tech Stack

Node.js
Express 5
node-cron
Nodemailer
JSON file storage (temporary)

Planned:
Admin authentication
BullMQ + Redis
Database layer

---

### Project Structure

```
birthday-service/
│
├── app.js
├── cronScheduler.js
├── routes/
│   └── birthdayRoutes.js
├── controllers/
│   └── birthdayController.js
├── services/
│   ├── mailer.js
│   └── mailTemplate.js
├── utils/
│   └── dateUtils.js
├── data/
│   ├── birthdays.json
│   └── logs.json
├── curl.md          ← API testing guide
└── .env
```

---

### Installation

```
npm install
npm i express node-cron nodemailer envf cors morgan
```

---

### Environment Variables

```
EMAIL=yourgmail@gmail.com
PASS=your_16_char_app_password
PORT=4000
```

Use Google App Passwords.

---

### Run

```
node app.js
```

---

### API Base URL

```
http://localhost:4000/api/v1
```

---

### Endpoints Overview

| Method | Route               | Purpose           |
| ------ | ------------------- | ----------------- |
| POST   | /add-dob            | Add user birthday |
| GET    | /birthdays/today    | Today’s birthdays |
| GET    | /birthdays/upcoming | All users         |
| GET    | /logs               | Email logs        |
| POST   | /send-test-mail     | Send test email   |

---

### API Testing

See [curl.md](curl.md) in project root.
It contains ready-to-run curl commands for every endpoint.

---

### Automation Flow

1. cronScheduler triggers daily
2. Users loaded from birthdays.json
3. Birthday check performed
4. Email sent
5. Log written to logs.json

---

### Data Storage

birthdays.json → user data
logs.json → email history

Temporary. Replaceable with DB later.

---

### Planned Upgrades

• Admin login routes
• BullMQ job queues
• Redis-backed scheduling
• Retry + failure handling
• Rate limiting
• Database migration
• Monitoring dashboard

---

### Development Notes

• Date format: YYYY-MM-DD
• Cron uses server timezone
• Server must stay running
• Mailer is swappable

---

### Reset Data

```
echo "[]" > data/birthdays.json
echo "[]" > data/logs.json
```

