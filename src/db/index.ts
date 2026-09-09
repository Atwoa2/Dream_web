import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Подключение к PostgreSQL.
 *
 * В разработке Next.js перезагружает модули на каждое изменение файла, из-за
 * чего без кэширования на globalThis плодятся десятки соединений, и база
 * упирается в лимит. В проде создаётся одно соединение на инстанс.
 */
const globalForDb = globalThis as unknown as {
  connection: ReturnType<typeof postgres> | undefined;
};

const connection =
  globalForDb.connection ?? postgres(env.DATABASE_URL, { max: 10 });

if (env.APP_ENV !== "production") globalForDb.connection = connection;

export const db = drizzle(connection, { schema });
export { schema };
