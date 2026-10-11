/**
 * Royal Liquid Glassmorphism Email Template Generator
 * Formulates curated, personal birthday greetings from the user directly to the recipient.
 * Features pure vector SVG icons, zero emojis, recursive liquid glass layers, and personal user sign-off.
 */
import { getSenderInfo } from "./mailer.js";
import { escapeHtml } from "../utils/security.js";

export const BIRTHDAY_QUOTES = [
  "“Wishing you a day as radiant, joyful, and inspiring as you are! May this new year of your life bring you great health, genuine happiness, and exciting achievements. Cheers to celebrating you today and all the incredible things ahead!”",
  "“Another year wiser, stronger, and more wonderful! I hope your birthday is filled with laughter, love, and all the moments that bring you true joy. May this upcoming chapter be your most rewarding yet.”",
  "“Sending you my warmest thoughts and heartfelt wishes on your special day! Thank you for bringing so much light into the lives around you. Here's to health, happiness, and another fantastic year ahead.”",
  "“On your birthday, I wanted to take a moment to celebrate the wonderful person you are. May your year ahead be packed with fulfilling moments, daring dreams realized, and peace at every step.”",
  "“Happy Birthday! Today is all about honoring you and the positive energy you bring wherever you go. Wishing you a year filled with warmth, effortless laughter, and everything your heart desires.”",
  "“May your journey ahead be blessed with good fortune, deep joy, and true triumphs. Wear your wisdom with pride and know that I am rooting for your happiness every single day.”",
  "“Every year is a new summit to conquer and a blank canvas to paint with purpose. Step boldly into this year with confidence and excitement for what is to come!”",
  "“Another year is not just time added — it is strength gained, wisdom earned, and a future shaped with intention. Keep shining bright and rising higher!”"
];

export const getRandomBirthdayQuote = () => {
  const index = Math.floor(Math.random() * BIRTHDAY_QUOTES.length);
  return BIRTHDAY_QUOTES[index];
};

export const getOrdinalSuffix = (num) => {
  const n = parseInt(num, 10);
  if (isNaN(n)) return "";
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
};

export const birthdayTemplate = (name = "Friend", email = "", options = {}) => {
  const sender = getSenderInfo(options.senderName, options.senderEmail);
  const rawSenderName = options.senderName || sender.name || "Backendteam management";
  const rawSenderEmail = options.senderEmail || sender.email || "backendteam.management@gmail.com";

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSenderName = escapeHtml(rawSenderName);
  const safeSenderEmail = escapeHtml(rawSenderEmail);

  const turningAge = options.turningAge ? ` ${getOrdinalSuffix(options.turningAge)}` : "";
  const rawCustomMessage = options.customMessage || getRandomBirthdayQuote();
  const safeCustomMessage = escapeHtml(rawCustomMessage);

  const recipientBadge = safeEmail
    ? `<div style="display: inline-block; padding: 4px 14px; margin-top: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 999px; font-size: 12px; color: #94a3b8; letter-spacing: 0.3px;">For: ${safeEmail}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Happy Birthday, ${safeName}!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Ambient Slate Canvas matching Website -->
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background: radial-gradient(circle at 50% 20%, #1e293b 0%, #0f172a 60%, #090d16 100%); padding: 50px 16px;">
    <tr>
      <td align="center">
        
        <!-- OUTER SLATE GLASS VESSEL (Layer 1) -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="
          max-width: 620px;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-top: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12);
          overflow: hidden;
        ">
          <!-- Glass Banner Header -->
          <tr>
            <td align="center" style="padding: 44px 36px 18px 36px; background: radial-gradient(circle at top, rgba(79, 70, 229, 0.18) 0%, transparent 75%);">
              
              <!-- RECURSIVE GLASS PILL WITH PURE SVG ICON (Layer 2) -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="
                margin: 0 auto;
                border-radius: 999px;
                background: rgba(79, 70, 229, 0.12);
                border: 1px solid rgba(99, 102, 241, 0.3);
                border-top: 1px solid rgba(255, 255, 255, 0.25);
                box-shadow: 0 4px 16px rgba(79, 70, 229, 0.2);
                padding: 7px 20px;
              ">
                <tr>
                  <td style="vertical-align: middle; padding-right: 8px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                      <path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                    </svg>
                  </td>
                  <td style="vertical-align: middle; color: #e2e8f0; font-size: 11.5px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase;">
                    A SPECIAL BIRTHDAY WISH • CELEBRATING YOU
                  </td>
                </tr>
              </table>

              <!-- Main Hero Title -->
              <h1 style="margin: 26px 0 8px 0; color: #ffffff; font-size: 32px; font-weight: 800; line-height: 1.25; letter-spacing: -0.5px;">
                Happy${turningAge} Birthday,<br>
                <span style="background: linear-gradient(135deg, #a5b4fc 0%, #818cf8 50%, #38bdf8 100%); -webkit-background-clip: text; color: #c7d2fe;">${safeName}</span>!
              </h1>
              
              ${recipientBadge}
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 10px 36px 36px 36px;">
              
              <!-- RECURSIVE INNER SLATE GLASS CARD (Layer 2.5) -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="
                background: rgba(15, 23, 42, 0.65);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-top: 1px solid rgba(255, 255, 255, 0.16);
                border-radius: 18px;
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
                padding: 26px;
              ">
                <tr>
                  <td align="center">
                    
                    <!-- RECURSIVE MESSAGE CAPSULE (Layer 3) -->
                    <div style="
                      padding: 22px;
                      border-radius: 14px;
                      background: linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(2, 132, 199, 0.05) 100%);
                      border: 1px solid rgba(99, 102, 241, 0.2);
                      border-top: 1px solid rgba(255, 255, 255, 0.18);
                    ">
                      <p style="margin: 0; font-size: 16.5px; line-height: 1.7; color: #f1f5f9; font-style: italic;">
                        ${safeCustomMessage}
                      </p>
                    </div>

                    <!-- Pure Vector SVG Insignia (Zero Emoji) -->
                    <div style="text-align: center; margin-top: 24px;">
                      <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                        <tr>
                          <td style="
                            width: 48px;
                            height: 48px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #4f46e5, #0284c7);
                            border: 1px solid rgba(255, 255, 255, 0.25);
                            box-shadow: 0 6px 18px rgba(79, 70, 229, 0.35);
                            text-align: center;
                            vertical-align: middle;
                          ">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Personal User Sign-Off Card (Layer 3) -->
                    <div style="
                      margin-top: 24px;
                      padding: 18px 22px;
                      border-radius: 14px;
                      background: rgba(255, 255, 255, 0.03);
                      border: 1px solid rgba(255, 255, 255, 0.08);
                      border-top: 1px solid rgba(255, 255, 255, 0.16);
                      text-align: center;
                    ">
                      <p style="margin: 0 0 5px 0; color: #94a3b8; font-size: 13.5px; font-style: italic;">
                        With warmest thoughts and wishes,
                      </p>
                      <p style="margin: 0; color: #ffffff; font-size: 17px; font-weight: 700; letter-spacing: 0.2px;">
                        ${safeSenderName}
                      </p>
                      ${safeSenderEmail ? `<div style="margin-top: 4px; font-size: 11.5px; color: #64748b;">${safeSenderEmail}</div>` : ""}
                    </div>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Glass Footer -->
          <tr>
            <td align="center" style="
              padding: 20px 28px;
              background: rgba(15, 23, 42, 0.95);
              border-top: 1px solid rgba(255, 255, 255, 0.08);
            ">
              <p style="margin: 0; color: #818cf8; font-size: 11.5px; font-weight: 600;">
                Sent with warm thoughts from ${safeSenderName} to ${safeName}
              </p>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 10.5px;">
                Celebrating your special day with care
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
};
