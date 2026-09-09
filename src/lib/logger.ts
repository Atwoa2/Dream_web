/**
 * Логирование в формате JSON — так логи читаются машиной в Vercel/Datadog.
 *
 * КРИТИЧНО: в логи никогда не попадают секреты, коды из писем, API-ключи и
 * номера карт. Логи хранятся долго и видны более широкому кругу людей, чем база.
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
