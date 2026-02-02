

Birthday Automation Service — API Test Guide

Base URL
[http://localhost:4000/api/v1](http://localhost:4000/api/v1)

---

Health Check

```
curl http://localhost:4000/
```

Expected:

```
{
  "service": "Birthday Automation Service",
  "status": "running",
  "version": "v1"
}
```

---

1. Add a Birthday

```
curl -X POST http://localhost:4000/api/v1/add-dob \
  -H "Content-Type: application/json" \
  -d '{"name":"Nishu","email":"nishu@test.com","dob":"2002-02-01"}'
```

Expected:

```
{ "success": true }
```

---

2. Get Today's Birthdays

```
curl http://localhost:4000/api/v1/birthdays/today
```

---

3. Get Upcoming Birthdays

```
curl http://localhost:4000/api/v1/birthdays/upcoming
```

---

4. Get Email Logs

```
curl http://localhost:4000/api/v1/logs
```

---

5. Send Test Email

```
curl -X POST http://localhost:4000/api/v1/send-test-mail \
  -H "Content-Type: application/json" \
  -d '{"email":"nishu@test.com"}'
```

Expected:

```
{ "sent": true }
```

---

6. Test Unknown Route

```
curl http://localhost:4000/api/v1/random
```

Expected:

```
{
  "error": "Route not found",
  "path": "/api/v1/random"
}
```

---

Quick Reset

```
echo "[]" > data/birthdays.json
echo "[]" > data/logs.json
```


