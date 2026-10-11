import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");

if (fs.existsSync(envPath)) {
  try {
    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(envPath);
    } else {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const [key, ...vals] = trimmed.split("=");
          if (key && !process.env[key.trim()]) {
            process.env[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
          }
        }
      });
    }
  } catch (err) {
    console.warn(`[Config] Notice: Could not load .env file: ${err.message}`);
  }
}
