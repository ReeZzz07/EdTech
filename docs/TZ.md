# Техническое задание: ЕГЭ PRO Telegram Mini App

## Общее описание

Создать Telegram Mini App для подготовки к ЕГЭ по математике и русскому языку с ИИ-диагностикой, геймификацией и токен-экономикой. Приложение должно работать внутри Telegram как веб-приложение с нативным UX.

**Расширяемость по предметам:** старт с математики и русского; дизайн данных и API не завязан на фиксированный список предметов. Каталог предметов — в БД (код, название, флаг «включён», порядок сортировки, опционально ссылка/идентификатор спецификации ФИПИ). Задача, прогресс, карта навыков и рекомендации ИИ ссылаются на `subjectId`, а не на жёсткий `enum` в коде. Импорт/синхронизация с [fipi.ru](https://fipi.ru) — отдельный слой (скрипты, админ- или фоновые джобы), подключается по мере появления новых предметов без ломки схемы.

## Технический стек

### Frontend

| Слой             | Технологии                                     |
| ---------------- | ---------------------------------------------- |
| Framework        | React 18 + TypeScript                          |
| Build Tool       | Vite                                           |
| UI Library       | Telegram UI Kit (`@telegram-apps/telegram-ui`) |
| Routing          | React Router v6                                |
| State Management | Zustand                                        |
| HTTP Client      | Axios                                          |
| Styling          | CSS Modules + Tailwind CSS                     |
| Icons            | Lucide React                                   |
| Animations       | Framer Motion                                  |
| Camera/Photo     | react-camera-pro                               |
| Charts           | Recharts                                       |
| Linting          | ESLint + Prettier                              |

### Backend

| Слой           | Технологии                           |
| -------------- | ------------------------------------ |
| Runtime        | Node.js 20                           |
| Framework      | Express.js                           |
| Database       | PostgreSQL + Prisma ORM              |
| Authentication | Telegram Web Apps validation         |
| File Storage   | AWS S3 (фото задач)                  |
| AI/ML          | YandexGPT (Yandex Cloud Foundation Models: мультимодальный ввод, OCR и разбор задания) |
| Queue          | Redis + Bull (обработка изображений) |
| Cache          | Redis                                |
| Environment    | Docker + docker-compose              |

### Infrastructure

- **Deployment:** Vercel (frontend) + Railway (backend)
- **CDN:** CloudFlare
- **Monitoring:** Sentry
- **Analytics:** PostHog

## Структура проекта

```text
ege-pro/
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── icons/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── ProgressRing.tsx
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   └── Layout.tsx
│   │   │   ├── diagnosis/
│   │   │   │   ├── DiagnosisCard.tsx
│   │   │   │   ├── ErrorAnalysis.tsx
│   │   │   │   ├── SkillMap.tsx
│   │   │   │   └── RecommendationsList.tsx
│   │   │   ├── camera/
│   │   │   │   ├── CameraCapture.tsx
│   │   │   │   ├── PhotoPreview.tsx
│   │   │   │   └── UploadProgress.tsx
│   │   │   ├── gamification/
│   │   │   │   ├── CoinBalance.tsx
│   │   │   │   ├── LevelProgress.tsx
│   │   │   │   ├── AchievementBadge.tsx
│   │   │   │   └── LeaderboardItem.tsx
│   │   │   └── social/
│   │   │       ├── ClanCard.tsx
│   │   │       ├── ChatInterface.tsx
│   │   │       └── PeerHelpRequest.tsx
│   │   ├── screens/
│   │   │   ├── OnboardingScreen.tsx
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── CameraScreen.tsx
│   │   │   ├── DiagnosisScreen.tsx
│   │   │   ├── ProgressScreen.tsx
│   │   │   ├── ClansScreen.tsx
│   │   │   ├── ShopScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── PremiumScreen.tsx
│   │   ├── stores/
│   │   │   ├── userStore.ts
│   │   │   ├── subjectStore.ts
│   │   │   ├── diagnosisStore.ts
│   │   │   ├── coinStore.ts
│   │   │   └── appStore.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── telegram.ts
│   │   │   ├── camera.ts
│   │   │   └── analytics.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   ├── types/
│   │   │   ├── user.ts
│   │   │   ├── subject.ts
│   │   │   ├── diagnosis.ts
│   │   │   ├── gamification.ts
│   │   │   └── api.ts
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── components.css
│   │   │   └── animations.css
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── diagnosisController.ts
│   │   │   ├── coinController.ts
│   │   │   ├── clanController.ts
│   │   │   ├── subjectsController.ts
│   │   │   └── userController.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── errorHandler.ts
│   │   ├── services/
│   │   │   ├── aiService.ts
│   │   │   ├── imageService.ts
│   │   │   ├── diagnosisService.ts
│   │   │   ├── coinService.ts
│   │   │   ├── subjectService.ts
│   │   │   └── notificationService.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Subject.ts
│   │   │   ├── Problem.ts
│   │   │   ├── Diagnosis.ts
│   │   │   ├── Clan.ts
│   │   │   └── Transaction.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── diagnosis.ts
│   │   │   ├── coins.ts
│   │   │   ├── clans.ts
│   │   │   ├── subjects.ts
│   │   │   └── user.ts
│   │   ├── database/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── jobs/
│   │   │   ├── imageProcessingJob.ts
│   │   │   ├── diagnosisJob.ts
│   │   │   └── notificationJob.ts
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   ├── encryption.ts
│   │   │   └── logger.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── yandexGpt.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
├── README.md
└── .gitignore
```

## Экраны и навигация

### 1. OnboardingScreen

**Описание:** приветственный экран с объяснением возможностей.

**Компоненты:**

- Карусель из 3 слайдов с анимацией:
  - Слайд 1: «Фотографируй задачи — получай решения»
  - Слайд 2: «ИИ-тьютор анализирует твои ошибки»
  - Слайд 3: «Зарабатывай ЕГЭCOIN и соревнуйся с друзьями»
- Кнопка «Начать подготовку к ЕГЭ»
- Индикаторы прогресса

### 2. HomeScreen (главный экран)

**Описание:** дашборд с основными метриками и быстрыми действиями.

**Компоненты:**

- Header с балансом ЕГЭCOIN и уведомлениями
- Карточка «Твой прогресс»: кольцевой прогресс по темам
- Карточка «Сегодня»: количество решённых задач, серия дней
- Селектор **текущего предмета** (загружается из `GET /api/subjects`); «Все предметы» — опционально для агрегированного дашборда
- Блок «Рекомендации ИИ»: 2–3 персональные задачи
- FAB «Сфотографировать задачу»
- Bottom navigation: Главная, Прогресс, Кланы, Профиль

### 3. CameraScreen

**Описание:** интерфейс камеры для съёмки математических задач.

**Компоненты:**

- Полноэкранная камера с оверлеем
- Рамка-индикатор для выравнивания задачи
- Кнопка съёмки (крупная, по центру снизу)
- Переключатель вспышки
- Кнопка выбора из галереи
- Предпросмотр последнего фото (миниатюра)
- Подсказки: «Выровняй задачу в рамке», «Убедись, что текст чёткий»

### 4. DiagnosisScreen

**Описание:** результаты анализа решения с детальной диагностикой.

**Компоненты:**

- Загрузочный экран с анимацией «ИИ анализирует...»
- Оригинальное фото задачи (сверху)
- Общая оценка в виде карточки с иконкой эмоции
- Список шагов решения (свайпаемые карточки):
  - правильные шаги (зелёные);
  - ошибки (красные с пояснением);
  - пропущенные шаги (серые)
- Блок «Что изучить»: рекомендации с кнопками перехода
- Заработанные ЕГЭCOIN за решение
- Кнопки: «Поделиться», «Решить похожую», «В избранное»

### 5. ProgressScreen

**Описание:** детальная аналитика прогресса по темам.

**Компоненты:**

- Переключатель **предмета** (тот же каталог, что на главной) + периоды: Неделя / Месяц / Всё время
- График решённых задач по дням (с учётом выбранного `subjectId`)
- Карта навыков (SkillMap): древо тем **зависит от предмета** (для математики — алгебра/геометрия/…; для нового предмета подключается своя иерархия из БД/конфига, без переписывания экрана)
- Достижения и бейджи
- Статистика: точность, скорость решения, серия дней
- Прогноз баллов ЕГЭ

### 6. ClansScreen

**Описание:** социальный раздел с кланами и соревнованиями.

**Компоненты:**

- Header с поиском кланов
- Мой клан (если есть): название, участники, рейтинг
- Еженедельный челлендж, топ участников
- Рекомендуемые кланы (по школе, городу)
- Глобальный лидерборд
- Чат клана (базовая интеграция)
- Кнопка «Создать клан»

### 7. ShopScreen

**Описание:** магазин с покупками за ЕГЭCOIN.

**Компоненты:**

- Баланс ЕГЭCOIN вверху
- Категории в табах:
  - Обучение: подсказки, дополнительные решения
  - Персонализация: аватары, темы оформления
  - Социальное: создание клана, приоритет в чатах
  - Премиум: месяц Premium за токены
- Каждый товар — карточка с ценой и описанием
- История покупок
- Предложения дня со скидками

### 8. ProfileScreen

**Описание:** личный профиль и настройки.

**Компоненты:**

- Аватар пользователя (можно менять)
- Статистика: уровень, решено задач, дней подряд
- Достижения (бейджи)
- Настройки уведомлений
- Реферальная программа
- Тарифный план и апгрейд
- Контакты поддержки, о приложении

### 9. PremiumScreen

**Описание:** покупка Premium-подписки.

**Компоненты:**

- Сравнительная таблица Free vs Premium
- Список преимуществ с иконками
- Цены с выделением выгодного варианта
- Отзывы пользователей
- FAQ по Premium
- Гарантии и условия возврата
- Кнопка покупки с интеграцией Telegram Payments

## Модели данных

### User

```ts
interface User {
  id: string;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  coinBalance: number;
  level: number;
  experience: number;
  isPremium: boolean;
  premiumUntil?: Date;
  dailyStreak: number;
  lastActiveDate: Date;
  schoolName?: string;
  grade: number;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}
```

### Subject (каталог, расширяемый)

```ts
interface Subject {
  id: string;
  code: string; // slug: math, russian, physics — без жёсткого enum в клиенте
  name: string; // отображаемое имя
  isEnabled: boolean; // выводить в селекторах
  sortOrder: number;
  fipiSpecKey?: string; // задел: ключ/ID спецификации ФИПИ при интеграции
  createdAt: Date;
  updatedAt: Date;
}
```

### Problem

```ts
interface Problem {
  id: string;
  userId: string;
  imageUrl: string;
  subjectId: string; // ссылка на Subject; новые предметы — новые строки в БД, не правка union-типа
  topic: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  originalText?: string;
  studentSolution?: string;
  correctSolution: string;
  explanation: string;
  status: "analyzing" | "completed" | "error";
  createdAt: Date;
  completedAt?: Date;
}
```

### Diagnosis

```ts
interface Diagnosis {
  id: string;
  problemId: string;
  overallScore: number; // 0-100
  timeSpent?: number;
  steps: DiagnosisStep[];
  errors: ErrorAnalysis[];
  recommendations: Recommendation[];
  skillAssessment: SkillAssessment[];
  coinsEarned: number;
  createdAt: Date;
}
```

### DiagnosisStep

```ts
interface DiagnosisStep {
  stepNumber: number;
  description: string;
  isCorrect: boolean;
  studentWork?: string;
  feedback?: string;
  errorType?: "computational" | "conceptual" | "methodical";
}
```

### Clan

```ts
interface Clan {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  ownerId: string;
  isPublic: boolean;
  maxMembers: number;
  currentMembers: number;
  weeklyChallenge?: Challenge;
  settings: ClanSettings;
  createdAt: Date;
}
```

## API Endpoints

### Authentication

- `POST /api/auth/telegram` — валидация данных Telegram WebApp
- `GET /api/auth/me` — текущий пользователь

### Problems & Diagnosis

- `POST /api/problems/upload` — загрузка изображения задачи (в теле/форме обязателен `subjectId` выбранного предмета)
- `GET /api/problems/:id/status` — статус обработки
- `GET /api/problems/:id/diagnosis` — результаты диагностики
- `POST /api/problems/:id/feedback` — оценка качества диагностики

### User Progress

- `GET /api/user/progress` — статистика прогресса (параметр `subjectId` — опционально, фильтр по предмету)
- `GET /api/user/achievements` — достижения
- `PUT /api/user/settings` — настройки пользователя

### Subjects (каталог)

- `GET /api/subjects` — список включённых предметов (для селекторов, онбординга, фильтров)

### Coins & Economy

- `GET /api/coins/balance` — баланс
- `GET /api/coins/transactions` — история транзакций
- `POST /api/coins/spend` — трата (магазин)
- `POST /api/coins/earn` — начисление (завершение задачи)

### Clans

- `GET /api/clans` — рекомендуемые кланы
- `POST /api/clans` — создать клан
- `POST /api/clans/:id/join` — вступить
- `DELETE /api/clans/:id/leave` — выйти
- `GET /api/clans/:id/leaderboard` — лидерборд клана

## Логика работы

### 1. Onboarding Flow

1. Пользователь открывает Mini App в Telegram.
2. Telegram передаёт `initData` с данными пользователя.
3. Frontend валидирует данные через backend.
4. Для нового пользователя — показ Onboarding.
5. Создание профиля, стартовые 500 ЕГЭCOIN.
6. Переход на HomeScreen.

### 2. Photo Analysis Flow

1. Нажатие FAB «Сфотографировать».
2. CameraScreen с нативным UI камеры.
3. После съёмки — PhotoPreview с возможностью пересъёмки.
4. Подтверждение → загрузка фото в S3.
5. Фоновый job для обработки ИИ.
6. DiagnosisScreen с индикатором загрузки.
7. По готовности — обновление UI, начисление ЕГЭCOIN.

### 3. AI Analysis Pipeline

1. Получение фото из S3; контекст `subjectId` (и при необходимости промпты/шаблоны из `Subject`) передаётся в ИИ.
2. Распознавание и разбор через **YandexGPT** (Foundation Models: мультимодальный запрос, при необходимости отдельный шаг OCR текста).
3. Классификация типа задачи и темы **в рамках выбранного предмета** (справочники тем — по `subjectId`, чтобы новый предмет не ломал остальные).
4. При рукописном решении — анализ визуала/текста в той же цепочке (при деградации — уточнение в ответе модели).
5. Генерация корректного решения.
6. Сопоставление с решением ученика (если есть).
7. Диагностика ошибок и рекомендации.
8. Обновление прогресса пользователя (агрегаты по `subjectId`).
9. Сохранение в БД.

**Провайдер ИИ:** абстракция `aiService` над HTTP API Yandex Cloud; при смене или дублировании провайдера в будущем меняется адаптер и конфиг, а не схемы `Problem` / `Diagnosis`.

### 4. Gamification Logic

**Опыт и уровни**

- Решение задачи = 50 XP; правильное решение = +25 XP.
- Новый уровень каждые 1000 XP.

**ЕГЭCOIN**

- Заработок: 50 за решение, бонусы за серии.
- Траты: подсказки, премиум, кастомизация.
- Дневной лимит заработка: 500 ЕГЭCOIN.

**Достижения**

- Примеры: «Первое решение», «Серия 7 дней», «100 задач».
- Каждое достижение: +200 ЕГЭCOIN + бейдж.

### 5. Freemium Restrictions

- **Free:** 3 решения в день, базовая диагностика.
- **Freemium (199₽/мес):** 15 решений, полная диагностика.
- **Premium (399₽/мес):** безлимит, персональный план, эксперт-консультации.

### 6. Social Features

- Кланы: до 30 участников, еженедельные челленджи.
- Лидерборды: по решённым задачам, точности, серии дней.
- Peer-помощь: объяснения у одноклассников за токены.

### 7. Notification System

- Push через Telegram Bot API: напоминания о задачах, новые достижения, активность в клане, окончание Premium.

## Интеграции

### Telegram Mini Apps

- `@telegram-apps/sdk` для инициализации.
- `Telegram.WebApp.ready()` при загрузке.
- `MainButton`, `BackButton`, `HapticFeedback`.

### Telegram Payments

- `Telegram.WebApp.openInvoice()`.
- Поддержка российских платёжных систем, подписка с автопродлением.

### YandexGPT (Yandex Cloud)

- Доступ через API Yandex Cloud Foundation Models (ключ сервисного аккаунта / IAM, `folderId`, идентификатор модели с поддержкой изображений).
- Мультимодальный ввод: фото задания и текстовые инструкции; структурированный ответ (JSON-схема / парсинг ответа) — на стороне backend.
- Квоты, rate limiting, retry; при ошибках/лимитах — повтор с упрощённым промптом или отложенная обработка в очереди.

### Analytics

- PostHog: `problem_solved`, `diagnosis_viewed`, `coins_spent`.
- Воронки Free → Premium, когорты по retention.

## Дополнительные требования

### Performance

- Lazy loading компонентов, WebP, Service Worker, virtual scrolling.

### Security

- Валидация подписи Telegram WebApp, rate limiting, CORS для `telegram.org`, шифрование чувствительных данных.

### Accessibility

- Семантическая вёрстка, клавиатура, screen reader, high contrast.

### Mobile UX

- Кнопки ≥44px, свайпы, pull-to-refresh, haptic feedback.

### Error Handling

- Деградация при сбоях ИИ, retry сети, понятные ошибки, offline + синхронизация.

### Testing Strategy

- Unit (utils, services), integration (API), E2E критичных сценариев, визуальная регрессия.

## Итог

ТЗ достаточно для MVP Telegram Mini App с базовой ИИ-диагностикой (YandexGPT) и геймификацией; закладывается расширение каталога предметов без смены основной схемы данных.
