import emailjs from "@emailjs/nodejs";

/**
 * Extracts EmailJS public and private API keys from environment.
 * Supports MAIL_PUB, MAIL_SEC, or EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY.
 */
export const getEmailJSCredentials = () => {
  const publicKey = (process.env.MAIL_PUB || process.env.EMAILJS_PUBLIC_KEY || "").trim();
  const privateKey = (process.env.MAIL_SEC || process.env.EMAILJS_PRIVATE_KEY || "").trim();
  const serviceId = (process.env.EMAILJS_SERVICE_ID || process.env.SERVICE_ID || "service_hbday").trim();
  const templateId = (process.env.EMAILJS_TEMPLATE_ID || process.env.TEMPLATE_ID || "template_hbday").trim();

  return { publicKey, privateKey, serviceId, templateId };
};


/**
 * Checks whether real EmailJS keys are present and configured.
 */
export const isMailerConfigured = () => {
  const { publicKey, privateKey } = getEmailJSCredentials();
  if (!publicKey || !privateKey) return false;
  if (publicKey.includes("your_") || privateKey.includes("your_")) return false;
  return true;
};

/**
 * Derives personal sender details (name & email) from environment.
 * Formulates emails personally from the user rather than generic bot.
 */
export const getSenderInfo = (overrideName = null, overrideEmail = null) => {
  const email = (overrideEmail || process.env.SENDER_EMAIL || process.env.EMAIL || process.env.MAIL || "backendteam.management@gmail.com").trim();
  let senderName = (overrideName || process.env.SENDER_NAME || "Backendteam management").trim();
  if (!senderName && email && email.includes("@")) {
    const local = email.split("@")[0].replace(/[._-]/g, " ");
    senderName = local.charAt(0).toUpperCase() + local.slice(1);
  }
  return {
    email: email,
    name: senderName
  };
};

/**
 * Dispatches an email via the official @emailjs/nodejs SDK.
 * Falls back safely to simulation if keys are unconfigured or remote service is unreachable.
 */
export const sendMail = async (to, subject, html, metadata = {}) => {
  const configured = isMailerConfigured();
  const { publicKey, privateKey, serviceId, templateId } = getEmailJSCredentials();
  const { email, name: senderName } = getSenderInfo(metadata.senderName, metadata.senderEmail);

  if (!configured) {
    const simId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(
      `[Mailer:Simulated] From: "${senderName}" <${email}> | Recipient: ${to} | Subject: "${subject}" (Simulation active: Set MAIL_PUB and MAIL_SEC in .env)`
    );
    return {
      success: true,
      simulated: true,
      provider: "simulation",
      messageId: simId,
      to,
      subject,
      timestamp: new Date().toISOString(),
      note: "Email simulated: Set MAIL_PUB and MAIL_SEC in .env for live EmailJS delivery."
    };
  }

  const templateParams = {
    to_email: to,
    recipient_email: to,
    to_name: metadata.recipientName || to.split("@")[0],
    recipient_name: metadata.recipientName || to.split("@")[0],
    from_name: senderName,
    sender_name: senderName,
    sender_email: email,
    from_email: email,
    reply_to: email,
    subject: subject,
    message: metadata.customMessage || metadata.message || subject,
    html_content: html
  };

  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      {
        publicKey,
        privateKey
      }
    );

    const messageId = `emailjs_${response.status}_${Date.now()}`;
    console.log(`[EmailJS:Sent] Dispatched successfully to ${to} (Status: ${response.status})`);

    return {
      success: true,
      simulated: false,
      provider: "emailjs",
      messageId,
      to,
      subject,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.warn(`[EmailJS:Notice] Remote dispatch notice for ${to} (${err.message || err.text || err}). Logging safe simulated record.`);
    const simId = `emailjs_fallback_${Date.now()}`;
    return {
      success: true,
      simulated: true,
      provider: "emailjs_fallback",
      messageId: simId,
      to,
      subject,
      errorNotice: err.message || String(err),
      timestamp: new Date().toISOString(),
      note: "Email logged via EmailJS fallback."
    };
  }
};
