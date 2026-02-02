import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL, pass: process.env.PASS }
});

export const sendMail = (to, subject, html) =>
  transporter.sendMail({ from: process.env.EMAIL, to, subject, html });

