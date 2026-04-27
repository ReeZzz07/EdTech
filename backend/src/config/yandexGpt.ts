/**
 * Секреты Yandex Cloud Foundation Models. Без вызовов API на этапе 1.
 */
export const yandexGptConfig = {
  folderId: process.env.YANDEX_FOLDER_ID,
  apiKey: process.env.YANDEX_API_KEY,
  modelUri: process.env.YANDEX_MODEL_URI,
} as const;
