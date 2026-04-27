import { useNavigate } from "react-router-dom";

export function PremiumScreen() {
  const navigate = useNavigate();
  return (
    <div className="p-4 pb-24">
      <button type="button" className="mb-4 text-sm text-blue-600" onClick={() => navigate(-1)}>
        ← Назад
      </button>
      <h1 className="mb-4 text-xl font-bold">Premium</h1>
      <p className="text-sm text-zinc-600">
        Сравнение тарифов и оплата через Telegram Payments — этап 9 roadmap. Сейчас доступен Free / mock Premium в БД.
      </p>
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Функция</th>
            <th className="py-2">Free</th>
            <th className="py-2">Premium</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-2">Разборов в день</td>
            <td>3</td>
            <td>∞</td>
          </tr>
          <tr className="border-b">
            <td className="py-2">Диагностика</td>
            <td>базовая</td>
            <td>полная</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
