import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, type CameraType } from "react-camera-pro";
import { api } from "../services/api";
import { haptic } from "../services/telegram";
import { useSubjectStore } from "../stores/subjectStore";

export function CameraScreen() {
  const navigate = useNavigate();
  const { selectedId } = useSubjectStore();
  const cam = useRef<CameraType>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const uploadBlob = useCallback(
    async (blob: Blob) => {
      if (!selectedId) {
        setErr("Выберите предмет на главной");
        return;
      }
      const fd = new FormData();
      fd.append("image", blob, "capture.jpg");
      fd.append("subjectId", selectedId);
      const { data } = await api.post<{ problemId: string; status: string }>("/api/problems/upload", fd);
      navigate(`/diagnosis/${data.problemId}`, { replace: true });
    },
    [navigate, selectedId],
  );

  async function capture() {
    setErr(null);
    setBusy(true);
    haptic("medium");
    try {
      const photo = cam.current?.takePhoto?.("base64url");
      if (!photo || typeof photo !== "string") throw new Error("Не удалось снять кадр");
      const blob = await fetch(photo).then((r) => r.blob());
      await uploadBlob(blob);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-black">
      <div className="relative flex-1 overflow-hidden">
        <Camera
          ref={cam}
          facingMode="environment"
          aspectRatio={9 / 16}
          errorMessages={{
            noCameraAccessible: "Камера недоступна",
            permissionDenied: "Нужен доступ к камере",
            switchCamera: "Переключить камеру",
            canvas: "Ошибка canvas",
          }}
        />
        <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-dashed border-white/70" />
        <p className="pointer-events-none absolute bottom-24 left-0 right-0 text-center text-xs text-white/90">
          Выровняй задачу в рамке · текст должен быть читаемым
        </p>
      </div>
      {err && <p className="absolute left-4 right-4 top-4 rounded bg-red-600/90 p-2 text-center text-sm text-white">{err}</p>}
      <div className="flex gap-3 border-t border-white/10 bg-black/80 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button type="button" className="flex-1 rounded-xl bg-zinc-700 py-4 text-white" onClick={() => navigate(-1)}>
          Назад
        </button>
        <button type="button" disabled={busy} className="flex-[2] rounded-xl bg-blue-600 py-4 font-semibold text-white disabled:opacity-50" onClick={() => void capture()}>
          {busy ? "Отправка…" : "Снимок"}
        </button>
      </div>
      <label className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] rounded-full bg-black/60 px-3 py-2 text-xs text-white">
        Галерея
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            try {
              await uploadBlob(f);
            } catch (ex) {
              setErr(ex instanceof Error ? ex.message : "Ошибка");
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
    </div>
  );
}
