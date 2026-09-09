import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { logger } from "@/lib/logger";

/**
 * Проверка живости сервиса: отвечает ли приложение и доступна ли база.
 * Используется мониторингом и при деплое.
 *
 * Наружу отдаём только «ok / degraded» — текст ошибки БД содержит имена хостов
 * и пользователей, показывать его в открытом эндпоинте нельзя.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: "ok", database: "up" });
  } catch (error) {
    logger.error("healthcheck: база недоступна", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ status: "degraded", database: "down" }, { status: 503 });
  }
}
