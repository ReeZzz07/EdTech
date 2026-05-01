# Импорт справочника тем ФИПИ

Официальный сайт [fipi.ru](https://fipi.ru) не предоставляет стабильный публичный API; в репозитории используется **ручной/полуавтоматический** слой:

1. Файлы JSON в `backend/data/fipi/<code>.json`, где `<code>` совпадает с `Subject.code` (например `math`, `russian`, `physics`).
2. Формат файла:

```json
{
  "fipiSpecKey": "идентификатор-спецификации",
  "topics": [
    {
      "id": "1",
      "label": "Раздел",
      "children": [{ "id": "1.1", "label": "Подтема" }]
    }
  ]
}
```

3. Запуск импорта в БД (`Subject.fipiSpecKey`, `Subject.fipiTopics`):

```bash
npm run fipi:import -w backend
```

Требуется `DATABASE_URL` и применённые миграции. После импорта клиент получает поля `fipiSpecKey` и `fipiTopics` в `GET /api/subjects` (для будущего UI дерева тем без смены схем `Problem` / `Diagnosis`).
