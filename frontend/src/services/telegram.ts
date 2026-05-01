declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        initData?: string;
        initDataUnsafe?: {
          user?: { id: number; first_name?: string; username?: string };
        };
        themeParams?: Record<string, string>;
        colorScheme?: "light" | "dark";
        MainButton?: { text: string; show: () => void; hide: () => void; onClick: (cb: () => void) => void };
        BackButton?: { show: () => void; hide: () => void; onClick: (cb: () => void) => void };
        HapticFeedback?: { impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void };
        /** Mini Apps: оплата по ссылке счёта из `createInvoiceLink`. */
        openInvoice?: (url: string, callback?: (status: string) => void) => void;
      };
    };
  }
}

export function initTelegramUi() {
  try {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
  } catch {
    /* ignore */
  }
}

export function getInitDataRaw(): string | undefined {
  const raw = window.Telegram?.WebApp?.initData?.trim();
  if (raw) return raw;
  return undefined;
}

/** Результат закрытия окна оплаты в Telegram (`paid`, `cancelled`, `failed`, `pending`). */
export function openTelegramInvoice(invoiceUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const fn = window.Telegram?.WebApp?.openInvoice;
    if (!fn) {
      resolve("unsupported");
      return;
    }
    fn.call(window.Telegram!.WebApp!, invoiceUrl, (status: string) => resolve(status ?? "unknown"));
  });
}

export function haptic(style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light") {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
  } catch {
    /* ignore */
  }
}
