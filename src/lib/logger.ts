/**
 * JSON logging — machine-readable in Vercel/Datadog.
 *
 * CRITICAL: secrets, email codes, API keys and card numbers never go into
 * logs. Logs are retained for a long time and are visible to a wider circle
 * than the database.
 */

type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

function write(level: Level, message: string, fields: Fields = {}) {
  const line = JSON.stringify({
    level,
    message,
    time: new Date().toISOString(),
    ...fields,
  });
  if (level === "error" || level === "warn") console.error(line);
  else console.log(line);
}

export const logger = {
  debug: (m: string, f?: Fields) => write("debug", m, f),
  info: (m: string, f?: Fields) => write("info", m, f),
  warn: (m: string, f?: Fields) => write("warn", m, f),
  error: (m: string, f?: Fields) => write("error", m, f),
};
