import fs from "fs";
import { sendMail } from "../services/mailer.js";
import { birthdayTemplate } from "../services/mailTemplate.js";

const USERS = "./data/birthdays.json";
const LOGS = "./data/logs.json";

const read = path => JSON.parse(fs.readFileSync(path));
const write = (path, data) => fs.writeFileSync(path, JSON.stringify(data, null, 2));

export const addDOB = (req, res) => {
  const users = read(USERS);
  users.push(req.body);
  write(USERS, users);
  res.json({ success: true });
};

export const getToday = (req, res) => {
  const today = new Date();
  const users = read(USERS).filter(u => {
    const d = new Date(u.dob);
    return d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  });
  res.json(users);
};

export const getUpcoming = (req, res) => {
  const users = read(USERS);
  res.json(users);
};

export const getLogs = (req, res) => {
  res.json(read(LOGS));
};

export const sendTestMail = async (req, res) => {
  await sendMail(req.body.email, "Test", birthdayTemplate("Test User"));
  res.json({ sent: true });
};

export const processTodaysBirthdays = async () => {
  const users = read(USERS);
  const logs = read(LOGS);
  const today = new Date();

  for (const u of users) {
    const d = new Date(u.dob);
    if (d.getMonth() === today.getMonth() && d.getDate() === today.getDate()) {
      await sendMail(u.email, "Happy Birthday 🎉", birthdayTemplate(u.name));
      logs.push({ name: u.name, email: u.email, date: new Date(), status: "sent" });
    }
  }

  write(LOGS, logs);
};

