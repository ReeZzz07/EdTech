# Roadmap: ЕГЭ PRO Telegram Mini App

Основано на [ТЗ `docs/TZ.md`](./TZ.md). Чекбоксы отмечают **эпики** — после каждого прохода/спринта переводите `[ ]` в `[x]` у завершённых эпиков; при необходимости добавляйте дату в комментарий рядом.

**Легенда:** этап = крупный релизный срез; эпик = логически завершаемый блок работ (может занимать несколько PR).

---

## Этап 1. Инфраструктура и модель данных

_Цель: воспроизводимая среда, схема БД с расширяемым каталогом предметов, пустой но рабочий backend._

_Срез: этап 1 завершён 2026-04-27 (инфра, Prisma, Express-каркас)._

- [x] **Monorepo / репозиторий** — структура `frontend` + `backend`, общие соглашения, `README`, `.gitignore`, линт/format.
- [x] **Docker & локальная разработка** — `docker-compose`: PostgreSQL, Redis; переменные окружения, `.env.example` на бэке.
- [x] **Prisma: User, Subject, сиды** — `schema.prisma`, миграции, `seed` с предметами (математика, русский), связи под будущие `Problem` / `Diagnosis`.
- [x] **Express-каркас** — `app.ts` / `server.ts`, health-check, единый `errorHandler`, структура папок как в ТЗ.
- [x] **Конфиги** — `config/database.ts`, `config/redis.ts`, `config/yandexGpt.ts` (без бизнес-логики, только env).

---

## Этап 2. Аутентификация и публичные API

_Цель: валидный вход из Telegram и базовый профиль + каталог предметов для клиента._

_Срез бэкенда: реализовано 2026-04-27 (клиент — этап 4)._

- [x] **Валидация Telegram WebApp** — middleware, проверка подписи `initData`, `POST /api/auth/telegram`.
- [x] **Пользователь** — `GET /api/auth/me`, создание/обновление User при первом входе, стартовый баланс ЕГЭCOIN (по ТЗ).
- [x] **Каталог предметов** — `GET /api/subjects`, `subjectService`, отдача только `isEnabled`.
- [x] **Безопасность и устойчивость** — CORS для Telegram, базовый `rateLimit`, структурированные ошибки.

---

## Этап 3. ИИ-контур: S3, очередь, YandexGPT, диагностика

_Цель: end-to-end обработка фото задачи на бэке без UI камеры (можно тест Postman/curl)._

_Срез бэкенда: реализовано 2026-04-27 (Yandex — адаптер-заглушка до ключей; UI — этап 5)._

- [x] **Файлы** — загрузка в S3, `imageService`, presigned URL или прямой upload — согласовать с ТЗ.
- [x] **Очередь** — Redis + Bull: `imageProcessingJob` / `diagnosisJob`, ретраи, статусы.
- [x] **YandexGPT** — `aiService`: вызов Foundation Models, передача `subjectId` и контекста, парсинг ответа (JSON/структура диагноза).
- [x] **Модели Problem / Diagnosis** — Prisma, сохранение результата, `skillAssessment` / шаги / рекомендации.
- [x] **HTTP API** — `POST /api/problems/upload` (с `subjectId`), `GET .../status`, `GET .../diagnosis`, `POST .../feedback`, `GET /api/user/progress` (с опциональным `subjectId`).
- [x] **Начисление ЕГЭCOIN** — хук по завершению анализа (вместе с джобом или `coinService`), idempotency где нужно.

---

## Этап 4. Frontend: оболочка TMA, навигация, онбординг, дашборд

_Цель: приложение внутри Telegram с темой, маршрутами и главной с выбором предмета._

_Срез 2026-04-27: Vite-приложение, `AppRoot`, bootstrap через `telegram-web-app.js` + dev JWT._

- [x] **Скелет** — Vite, React 18, TS, Telegram UI Kit, React Router, Zustand, Axios, `api.ts`, `telegram.ts`.
- [x] **Telegram Mini App** — скрипт `telegram-web-app.js` (`ready`/`expand`), `AppRoot` из `@telegram-apps/telegram-ui`, haptic.
- [x] **Layout & навигация** — bottom navigation (Главная, Прогресс, Кланы, Профиль), заглушки экранов.
- [x] **OnboardingScreen** — карусель, завершение → сохранение флага, переход на Home.
- [x] **HomeScreen (MVP)** — header с балансом, `subjectStore` + загрузка `GET /api/subjects`, селектор предмета, FAB «Сфотографировать» (пока переход на камеру).
- [x] **PostHog (база)** — инициализация, 1–2 события (например `session_start`, `screen_view`).

---

## Этап 5. Сценарий «камера → диагноз»

_Цель: основной пользовательский поток съёмка/галерея → превью → upload → ожидание → результат._

_Срез 2026-04-27: снимок → сразу upload (без отдельного экрана превью); поллинг диагноза._

- [x] **CameraScreen** — `react-camera-pro`, оверлей, вспышка, галерея, подсказки.
- [x] **PhotoPreview & UploadProgress** — подтверждение, `POST /api/problems/upload` с `subjectId`, обработка ошибок.
- [x] **DiagnosisScreen** — поллинг `.../status`, состояние «ИИ анализирует...», отображение фото, оценка, шаги, рекомендации, заработанные монеты, действия (поделиться / похожая / избранное — минимум заглушки+навигация).
- [x] **Интеграция начислений** — обновление баланса/стreak на клиенте после успеха.

---

## Этап 6. Геймификация, лимиты, достижения

_Цель: XP, уровни, дневной заработок, достижения, Freemium-ограничения на бэке и отражение в UI._

_Бэкенд (лимиты, XP, кап монет, achievements, coins) — 2026-04-27; UI/PostHog — впереди._

- [x] **Правила на бэке** — XP/уровни, лимит решений/день по тарифу, `GET /api/user/achievements`, блокировка лишних `upload` при лимите.
- [x] **Монетные транзакции** — `GET /api/coins/balance`, `.../transactions`, `POST /api/coins/earn` / `spend` (заготовка под магазин).
- [x] **Home & Profile** — карточки «Сегодня», прогресс, достижения, уровень; согласованность с `GET /me` и progress _(фронт + расширенный `/api/auth/me`: лимиты/XP)_.
- [x] **События аналитики** — `problem_solved`, `diagnosis_viewed`, `coins_earned`, вспомогательные `screen_view`, `problem_upload_started`, `shop_purchase` (PostHog).

---

## Этап 7. Прогресс, магазин, Freemium в интерфейсе

_Цель: аналитика по предмету, витрина трат токенов, понятные апселлы Premium._

_Частично 2026-04-27: Progress (график без SkillMap), Shop (список+покупка), Premium (заглушка); табы/история/лимиты — позже._

- [x] **ProgressScreen** — периоды, фильтр `subjectId`, Recharts, SkillMap из `GET /api/user/skill-summary` + `subject.skillMap` (сиды).
- [x] **ShopScreen** — табы по категории и история транзакций, баланс, `POST /api/coins/spend`.
- [x] **PremiumScreen** — сравнение тарифов, статус Premium с клиента; оплата Telegram — этап 9.
- [x] **UX лимитов** — сообщение по коду `daily_limit` на камере + ссылки Premium/магазин; блок «Сегодня» на главной.

---

## Этап 8. Социальный слой: кланы

_Цель: кланы, вступление/выход, лидерборды; чат — минимальная интеграция или отложенный под-эпик._

_API кланов на бэке — 2026-04-27; на клиенте — базовый список/создание/вступление (без глобального лидерборда)._

- [x] **API кланов** — `GET/POST /api/clans`, join/leave, `GET .../leaderboard`, лимит участников, модель `Clan` в Prisma.
- [x] **ClansScreen** — поиск, «мой клан», глобальный топ (`GET /api/clans/leaderboard/global`), таблица участников, выход из клана.
- [x] **Чат клана (MVP+)** — `ClanMessage`, `GET/POST /api/clans/:id/messages`, простой UI и опрос сообщений.

---

## Этап 9. Монетизация, уведомления, продакшен

_Цель: оплата через Telegram, напоминания, наблюдаемость, деплой._

_Срез прод-инфры (Coolify VPS): закрыто **2026-05-01** — см. ниже `[x]` по деплою и операционке._

- [x] **Telegram Payments (MVP)** — `createInvoiceLink` + `POST /api/payments/premium/invoice`, клиент `openInvoice`; webhook `POST /api/telegram/webhook` (`pre_checkout_query`, `successful_payment`), продление `premiumUntil`; учёт истечения в лимитах/`/me`.
- [x] **Уведомления (MVP)** — `notificationService`, очередь Bull `notifications`, воркер, Bot API при **новых достижениях**. Напоминания по расписанию / клан / окончание Premium — расширение.
- [x] **Деплой прод** — Coolify на VPS: backend (корневой `Dockerfile`), frontend (`frontend/Dockerfile`), PostgreSQL и Redis как ресурсы; HTTPS (`api.*` / `app.*`); гайд [`docs/deploy-backend.md`](./deploy-backend.md); Prisma — стандартная раскладка `backend/prisma/`.
- [x] **Sentry / базовая наблюдаемость** — backend: `SENTRY_DSN`, отправка серверных ошибок (≥500, без шума на ожидаемые 4xx); frontend: опционально `VITE_SENTRY_DSN`. Трейсы — минимальный sample rate.
- [ ] **Альтернативные хостинги (опционально)** — Vercel для фронта, Railway/Fly для API — если понадобится вынести часть сервисов.
- [ ] **NFR из ТЗ** — lazy routes в `App.tsx` ✓; **Vite `manualChunks`** (recharts / camera / telegram-ui) ✓; **gzip** в `frontend/Dockerfile` ✓; retry GET в Axios ✓; SW shell ✓; **WebP** — для будущих статичных иконок/иллюстраций (фото задач остаются jpeg/png от камеры); понятные ошибки — точечно в экранах / `getApiErrorMeta`.
- [x] **Тестирование (база)** — Vitest: unit backend (`premiumService`), smoke HTTP `GET /api/health`; unit frontend (`apiError`, `gamification`, `skills`). CI: `.github/workflows/ci.yml`. E2E (auth + upload + diagnosis) — при необходимости Playwright позже.

**Операционка прод (разово закрыто 2026-05-01):**

- [x] **Хост и Redis** — `vm.overcommit_memory=1` на VPS (рекомендация Redis при fork/BGSAVE); стабильная связка приложение ↔ Redis (`REDIS_URL`).
- [x] **Бэкапы PostgreSQL** — настроены и проверены (восстановление или тестовый прогон по вашей процедуре).
- [x] **Смоук-тесты прод** — авторизация из Telegram и ключевые пользовательские сценарии MVP пройдены на боевых URL.

---

## Этап 10. Расширения (после MVP)

_По мере приоритета; не блокирует закрытие MVP этапов 1–9._

- [x] **Синхронизация с ФИПИ** — `backend/data/fipi/*.json`, скрипт `npm run fipi:import -w backend`, поля `Subject.fipiSpecKey` / `Subject.fipiTopics`, гайд [`docs/fipi-import.md`](./fipi-import.md). Живой парсинг fipi.ru не включён (ручные JSON).
- [x] **Новые предметы** — в seed добавлен предмет **Физика** (`physics`) + skill map; клиент по-прежнему берёт каталог из API.
- [x] **Peer help** — модель `PeerHelpRequest`, эскроу EGC, API `/api/peer-help`, экран `/peer-help`, блок после диагноза `frontend/src/components/social/PeerHelpPanel.tsx`.
- [x] **A11y & polish** — база: семантика `<main id="main-content">`, `aria-label` у нижней навигации, тема Telegram для контраста (этапы 4–9). Полный чеклист Mobile UX / визрег — при необходимости отдельно.

---

## Сводка этапов

| №   | Фокус                                            |
| --- | ------------------------------------------------ |
| 1   | Инфра, Prisma, Subject/User, Express             |
| 2   | Telegram auth, /me, /subjects                    |
| 3   | S3, очередь, YandexGPT, problems/diagnosis API   |
| 4   | TMA UI, Onboarding, Home, PostHog база           |
| 5   | Camera → upload → Diagnosis UI                   |
| 6   | Геймификация, лимиты, achievements, coins API    |
| 7   | Progress, Shop, Premium UI                       |
| 8   | Кланы, лидерборды, (чат)                         |
| 9   | Платежи, уведомления, Sentry, **деплой (Coolify ✓)**, тесты, NFR |
| 10  | ФИПИ, новые предметы, peer help, a11y            |

---

_Версия roadmap синхронизирована с `docs/TZ.md`; при существенных изменениях ТЗ обновляйте эпики вручную._
