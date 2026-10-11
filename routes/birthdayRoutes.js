import express from "express";
import {
  addDOB,
  updateDOB,
  deleteDOB,
  getUpcoming,
  getToday,
  getLogs,
  clearLogs,
  sendTestMail,
  triggerManualCheck,
  getStats,
  getTemplatePreview,
  getQuota
} from "../controllers/birthdayController.js";

const router = express.Router();

// Birthday Management & Rate Limit Quota
router.get("/birthdays/quota", getQuota);
router.get("/quota", getQuota);
router.post("/add-dob", addDOB);
router.get("/birthdays/today", getToday);
router.get("/birthdays/upcoming", getUpcoming);
router.put("/birthdays/:id", updateDOB);
router.delete("/birthdays/:id", deleteDOB);

// Logs
router.get("/logs", getLogs);
router.delete("/logs", clearLogs);

// Mailer & Trigger Actions
router.post("/send-test-mail", sendTestMail);
router.post("/trigger-check", triggerManualCheck);

// Analytics & Visual Preview
router.get("/stats", getStats);
router.get("/template-preview", getTemplatePreview);

export default router;
