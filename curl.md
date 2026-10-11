# HBday • API Test Guide

Base URL: `http://localhost:4000/api/v1`

---

### 1. Health Check

```bash
curl -s http://localhost:4000/api/v1/health
```

Expected Response:
```json
{
  "service": "Birthday Automation Service",
  "status": "running",
  "version": "v1",
  "timestamp": "2026-10-11T..."
}
```

---

### 2. Dashboard Stats & Queue Metrics

```bash
curl -s http://localhost:4000/api/v1/stats
```

Expected Response:
```json
{
  "totalUsers": 12,
  "todayBirthdays": 1,
  "upcomingIn30Days": 3,
  "emailsDispatched": 5,
  "mailerConfigured": true,
  "queue": {
    "active": true,
    "configured": true,
    "waiting": 0,
    "activeJobs": 0,
    "completed": 2,
    "failed": 0,
    "delayed": 0,
    "status": "BullMQ + Upstash Redis (Online)"
  },
  "serverTime": "2026-10-11T..."
}
```

---

### 3. Add a Birthday Contact

```bash
curl -s -X POST http://localhost:4000/api/v1/add-dob \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex Rivers","email":"alex@example.com","dob":"1995-12-25"}'
```

Expected Response:
```json
{
  "success": true,
  "message": "Birthday added for Alex Rivers!",
  "user": {
    "id": "...",
    "name": "Alex Rivers",
    "email": "alex@example.com",
    "dob": "1995-12-25",
    "isToday": false,
    "daysLeft": 75,
    "nextBirthday": "2026-12-25",
    "currentAge": 30,
    "turningAge": 31,
    "zodiac": { "name": "Capricorn", "code": "CAP", "element": "Earth" }
  }
}
```

---

### 4. Get Upcoming Birthdays (Sorted Chronologically)

```bash
curl -s http://localhost:4000/api/v1/birthdays/upcoming
```

---

### 5. Get Today's Birthdays

```bash
curl -s http://localhost:4000/api/v1/birthdays/today
```

---

### 6. Update a Contact

```bash
curl -s -X PUT http://localhost:4000/api/v1/birthdays/<CONTACT_ID> \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex Rivers","email":"alex.rivers@example.com","dob":"1995-12-25"}'
```

---

### 7. Delete a Contact

```bash
curl -s -X DELETE http://localhost:4000/api/v1/birthdays/<CONTACT_ID>
```

---

### 8. Manually Run Birthday Worker Check

```bash
curl -s -X POST http://localhost:4000/api/v1/trigger-check
```

---

### 9. Send Test Email

```bash
curl -s -X POST http://localhost:4000/api/v1/send-test-mail \
  -H "Content-Type: application/json" \
  -d '{"name":"Tester","email":"test@example.com"}'
```

---

### 10. View Delivery Logs

```bash
curl -s http://localhost:4000/api/v1/logs
```

---

### 11. Clear Logs

```bash
curl -s -X DELETE http://localhost:4000/api/v1/logs
```
