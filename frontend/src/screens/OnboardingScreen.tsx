import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { haptic } from "../services/telegram";
import { useUserStore } from "../stores/userStore";
import { capture } from "../services/analytics";

const slides = [
  { title: "Фотографируй задачи", text: "Снимай задание — получай разбор и рекомендации." },
  { title: "ИИ-тьютор", text: "Диагностика ошибок и темы для повторения." },
  { title: "ЕГЭCOIN и друзья", text: "Зарабатывай монеты и соревнуйся в кланах." },
];

export function OnboardingScreen() {
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();
  const { refreshMe } = useUserStore();

  async function finish() {
    haptic("medium");
    await api.put("/api/user/settings", { onboardingComplete: true });
    await refreshMe();
    capture("onboarding_complete");
    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--tg-theme-bg-color,#fff)] p-6 pb-10">
      <div className="flex flex-1 flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold">{slides[idx]?.title}</h2>
            <p className="text-zinc-600">{slides[idx]?.text}</p>
          </motion.div>
        </AnimatePresence>
        <div className="mt-8 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`slide ${i + 1}`}
              className={`h-2 w-2 rounded-full ${i === idx ? "bg-blue-600" : "bg-zinc-300"}`}
              onClick={() => setIdx(i)}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        {idx > 0 && (
          <button type="button" className="flex-1 rounded-xl border border-zinc-300 py-3" onClick={() => setIdx((x) => x - 1)}>
            Назад
          </button>
        )}
        {idx < slides.length - 1 ? (
          <button
            type="button"
            className="flex-1 rounded-xl bg-blue-600 py-3 text-white"
            onClick={() => setIdx((x) => x + 1)}
          >
            Далее
          </button>
        ) : (
          <button type="button" className="flex-1 rounded-xl bg-blue-600 py-3 text-white" onClick={() => void finish()}>
            Начать подготовку к ЕГЭ
          </button>
        )}
      </div>
    </div>
  );
}
