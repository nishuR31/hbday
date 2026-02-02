import cron from "node-cron";
import { processTodaysBirthdays } from "./controllers/birthdayController.js";

cron.schedule("0 0 * * *", () => {
  processTodaysBirthdays();
});

