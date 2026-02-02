import express from "express";
import {
  addDOB,
  getUpcoming,
  getToday,
  getLogs,
  sendTestMail
} from "../controllers/birthdayController.js";

const router = express.Router();

router.post("/add-dob", addDOB);
router.get("/birthdays/today", getToday);
router.get("/birthdays/upcoming", getUpcoming);
router.get("/logs", getLogs);
router.post("/send-test-mail", sendTestMail);

export default router;

