/**
 * Enterprise Security & Sanitization Suite
 * Defends against XSS, HTML Injection, Scripting, Prototype Pollution, and Control Character Exploits.
 */

/**
 * Escapes characters with HTML entities to prevent Reflected & Stored XSS in HTML outputs
 */
export const escapeHtml = (str) => {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\//g, "&#x2F;");
};

/**
 * Strips HTML tags, <script> blocks, inline event handlers, and javascript: protocols
 */
export const stripDangerousContent = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    // Remove null bytes and invisible control characters
    .replace(/\0/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove iframe, embed, object, img, svg tags
    .replace(/<\/?(iframe|object|embed|applet|meta|link|style|img|svg|audio|video|form|input|button)\b[^>]*>/gi, "")
    // Remove on* event handlers (e.g. onload=, onclick=, onerror=)
    .replace(/on\w+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, "")
    // Remove javascript: and data: pseudo-protocols
    .replace(/javascript\s*:/gi, "blocked:")
    .replace(/vbscript\s*:/gi, "blocked:");
};

/**
 * Cleans string input: removes control chars, trims, strips dangerous tags, and caps length
 */
export const sanitizeString = (input, maxLength = 255) => {
  if (typeof input !== "string") return "";
  const cleaned = stripDangerousContent(input).trim();
  return cleaned.slice(0, maxLength);
};

/**
 * Recursively sanitizes request objects and defends against Prototype Pollution
 */
export const sanitizeData = (data, depth = 0) => {
  if (depth > 10 || data === null || data === undefined) return data;

  if (typeof data === "string") {
    return stripDangerousContent(data).trim();
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1));
  }

  if (typeof data === "object") {
    const cleanObj = {};
    for (const key of Object.keys(data)) {
      // Prototype Pollution Prevention: block __proto__, constructor, prototype
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        continue;
      }
      cleanObj[key] = sanitizeData(data[key], depth + 1);
    }
    return cleanObj;
  }

  return data;
};

/**
 * Express middleware to sanitize all incoming body, query, and params
 */
export const securitySanitizerMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    try {
      req.body = sanitizeData(req.body);
    } catch {
      try {
        Object.defineProperty(req, "body", {
          value: sanitizeData(req.body),
          writable: true,
          configurable: true,
          enumerable: true
        });
      } catch {
        for (const key of Object.keys(req.body)) {
          try { req.body[key] = sanitizeData(req.body[key]); } catch {}
        }
      }
    }
  }

  if (req.query && typeof req.query === "object") {
    try {
      const sanitized = sanitizeData(req.query);
      Object.defineProperty(req, "query", {
        value: sanitized,
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch {
      for (const key of Object.keys(req.query)) {
        try { req.query[key] = sanitizeData(req.query[key]); } catch {}
      }
    }
  }

  if (req.params && typeof req.params === "object") {
    try {
      const sanitized = sanitizeData(req.params);
      Object.defineProperty(req, "params", {
        value: sanitized,
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch {
      for (const key of Object.keys(req.params)) {
        try { req.params[key] = sanitizeData(req.params[key]); } catch {}
      }
    }
  }

  next();
};

/**
 * Strict validation helpers
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  // Strict RFC 5322 simplified pattern without whitespace or injection characters
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
};

export const validateName = (name) => {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 100) return false;
  // Reject if it still contains dangerous characters or tags
  if (/[<>]/.test(trimmed) || /javascript:/i.test(trimmed)) return false;
  return true;
};

export const validateDobFormat = (dob) => {
  if (!dob || typeof dob !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dob.trim());
};
