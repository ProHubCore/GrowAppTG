import {
  getTelegramInitData,
  getTelegramPlayer,
  triggerTelegramNotification,
} from "../../core/telegram";

const invoiceEndpoint = String(
  import.meta.env.VITE_STARS_INVOICE_ENDPOINT || "",
).trim();

function getWebApp() {
  return getTelegramPlayer().webApp;
}

export function isStarsPaymentConfigured() {
  return Boolean(invoiceEndpoint);
}


export async function createStarsInvoice(amount) {
  if (!invoiceEndpoint) {
    throw new Error("STARS_ENDPOINT_MISSING");
  }

  const response = await fetch(invoiceEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": getTelegramInitData(),
    },
    body: JSON.stringify({
      amount,
      productId: "growapp-supporter",
      payload: `growapp-support-${amount}-${Date.now()}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`STARS_INVOICE_FAILED_${response.status}`);
  }

  const data = await response.json();
  const invoiceUrl = data.invoiceUrl || data.invoice_url || data.url;

  if (!invoiceUrl) {
    throw new Error("STARS_INVOICE_URL_MISSING");
  }

  return invoiceUrl;
}

export function openStarsInvoice(invoiceUrl) {
  return new Promise((resolve, reject) => {
    const webApp = getWebApp();

    if (!webApp?.openInvoice) {
      reject(new Error("TELEGRAM_OPEN_INVOICE_UNAVAILABLE"));
      return;
    }

    try {
      webApp.openInvoice(invoiceUrl, (status) => {
        if (status === "paid") {
          triggerTelegramNotification("success");
        }

        resolve(status);
      });
    } catch (error) {
      reject(error);
    }
  });
}
