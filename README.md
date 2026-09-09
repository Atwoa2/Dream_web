# Dream_web

Веб-платформа DreamLabs: личный кабинет, оплата через Stripe, доступ к модели
по API.

**Состояние:** этап 0 — каркас проекта. Приложение поднимается, база
описана, аутентификация и платежи ещё не реализованы.

## Стек

Next.js 15 (App Router) · TypeScript · PostgreSQL + Drizzle · Auth.js · Stripe

## Запуск за 15 минут

Нужен **Node.js 20+** и доступ к PostgreSQL.

```bash
git clone https://github.com/Atwoa2/Dream_web.git
cd Dream_web
npm install
```

Переменные окружения:

```bash
cp .env.example .env.local
```

Заполнить в `.env.local`:

- `DATABASE_URL` — своя база. Локально через Docker:
  ```bash
  docker run -d --name dreamlabs-db -p 5432:5432 \
    -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dreamlabs postgres:16
  ```
  тогда `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dreamlabs"`
- `APP_URL` — оставить `http://localhost:3000`

Остальные переменные понадобятся на следующих этапах, пока их можно не трогать.

Схема базы и запуск:

```bash
npm run db:generate   # сгенерировать миграции из схемы
npm run db:migrate    # накатить на свою базу
npm run dev
```

Проверка: <http://localhost:3000/api/health> должен ответить
`{"status":"ok","database":"up"}`.

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | режим разработки |
| `npm run build` | production-сборка |
| `npm run typecheck` | проверка типов |
| `npm run lint` | линтер |
| `npm run db:generate` | сгенерировать миграцию из изменённой схемы |
| `npm run db:migrate` | накатить миграции |
| `npm run db:studio` | визуальный просмотр базы |

## Документация

Прочитать перед первым коммитом:

| Документ | О чём |
|---|---|
| [docs/STRUCTURE.md](docs/STRUCTURE.md) | где какой код лежит, правило слоёв, куда класть новое |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | как устроена система целиком и почему так |
| [docs/SECURITY.md](docs/SECURITY.md) | секреты, ключи, требования безопасности |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | ветки, ревью, окружения, Stripe в команде |

## Два правила, которые важнее остальных

1. **Секреты не коммитим.** Никогда, ни в каком виде. Подробности —
   [docs/SECURITY.md](docs/SECURITY.md).
2. **Бизнес-логика живёт в `src/modules/`.** Страницы и API-маршруты не ходят
   в базу напрямую. Подробности — [docs/STRUCTURE.md](docs/STRUCTURE.md).
