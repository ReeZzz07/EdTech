import { logger } from "../utils/logger";
import type { DiagnosisResultAI } from "../types/diagnosisAI";
import { yandexGptConfig } from "../config";

/**
 * Yandex Foundation Models: при отсутствии ключей — детерминированный мок-ответ (локальная разработка / деградация).
 */
export async function runDiagnosisForImage(input: {
  subjectName: string;
  imageBuffer: Buffer;
}): Promise<DiagnosisResultAI> {
  if (yandexGptConfig.apiKey && yandexGptConfig.folderId) {
    try {
      return await callYandexGptV1(input);
    } catch (e) {
      logger.error({ e }, "YandexGpt failed, fallback to mock");
    }
  }
  return mockResult(input.subjectName, input.imageBuffer.length);
}

async function callYandexGptV1(input: {
  subjectName: string;
  imageBuffer: Buffer;
}): Promise<DiagnosisResultAI> {
  // Эндпоинт/формат — зависят от выбранной модели; реальный вызов подставляется при настройке ключа
  // Сейчас: намеренно не внедрён, чтобы не ломать билд — возвращаем мок, если нет vaild response path
  void input;
  throw new Error("YandexGpt: configure model URI in адаптере (этап интеграции)");
}

function mockResult(subject: string, bytes: number): DiagnosisResultAI {
  const isRu = /рус|lang/i.test(subject) || /russian/.test(subject);
  return {
    topic: isRu ? "Орфография" : "Уравнения",
    difficulty: 3,
    originalText: `Снимок: ${bytes} байт. [mock OCR]`,
    correctSolution: isRu
      ? "1) Проверка орфографии. 2) Согласование. 3) Культура речи."
      : "1) Ввести x. 2) Проанализировать ДУ. 3) Сделать вывод.",
    explanation: isRu
      ? "Mock: типичные ошибки — пропущенные буквы, неверные окончания."
      : "Mock: внимательно с десятичными погрешностями и знаками.",
    overallScore: 68 + (bytes % 20),
    steps: [
      {
        stepNumber: 1,
        description: isRu ? "Прочитал условие" : "Сформировал постановку",
        isCorrect: true,
        studentWork: "—",
        feedback: "ok",
      },
      {
        stepNumber: 2,
        description: isRu ? "Нашёл ошибки" : "Сделал преобразование",
        isCorrect: false,
        studentWork: isRu ? "тут может быть ошибка" : "0 = 0",
        feedback: isRu
          ? "Старайся проговаривать правило, прежде чем писать."
          : "Перепроверь знак при переносе.",
        errorType: "computational",
      },
    ],
    errors: [
      { message: isRu ? "Неточная формулировка" : "Счетная погрешность", type: "soft" },
    ],
    recommendations: [
      { title: isRu ? "Повторить правила орфоэпии" : "Повторить логарифмы", action: "open_topic" },
    ],
    skillAssessment: isRu
      ? [
          { skillId: "russian.ortho", score: 55, note: "mock" },
          { skillId: "russian.punctuation", score: 62, note: "mock" },
        ]
      : [
          { skillId: "math.algebra", score: 58, note: "mock" },
          { skillId: "math.geometry", score: 44, note: "mock" },
        ],
    coinsBase: 50,
  };
}
