## ЕГЭ PRO — frontend

Стек: Vite 6, React 18, Tailwind, `@telegram-apps/telegram-ui`, Zustand, React Router 6, Axios, Framer Motion, react-camera-pro, Recharts.

### Запуск

Из корня репозитория: `npm run dev:frontend` (прокси `/api` на `http://127.0.0.1:3000`). Бэкенд должен быть запущен (`npm run dev:backend`).

Локально без Telegram: создайте JWT через `POST /api/auth/telegram` или временно задайте `VITE_DEV_JWT` в `.env` из корня `frontend` и перезапустите dev.

См. `/.env.example`.
