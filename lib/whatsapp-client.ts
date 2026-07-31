/**
 * WhatsApp Bot Client
 * 
 * HTTP client that communicates with the standalone WhatsApp Bot microservice
 * running on Railway. Falls back to local daemon in development.
 */

/**
 * Check if the bot microservice is configured.
 * In local dev, we fall back to the in-process daemon.
 */
export function isBotConfigured(): boolean {
  return !!(process.env.WHATSAPP_BOT_URL && process.env.WHATSAPP_API_KEY);
}

async function botFetch(endpoint: string, options: RequestInit = {}) {
  const botUrl = process.env.WHATSAPP_BOT_URL;
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (!botUrl || !apiKey) {
    throw new Error("WHATSAPP_BOT_URL or WHATSAPP_API_KEY not configured");
  }

  const url = `${botUrl}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Bot API error (${res.status}): ${errorBody}`);
  }

  return res.json();
}

/** Get current WhatsApp status from the bot */
export async function botStatus() {
  return botFetch("/status");
}

/** Tell the bot to start connecting (generates QR) */
export async function botConnect() {
  return botFetch("/connect", { method: "POST" });
}

/** Tell the bot to disconnect */
export async function botDisconnect() {
  return botFetch("/disconnect", { method: "POST" });
}

export async function botSendMessage(
  phone: string,
  text: string,
  pdfUrl?: string,
  pdfFilename?: string,
  pdfBase64?: string
) {
  return botFetch("/send", {
    method: "POST",
    body: JSON.stringify({ phone, text, pdfUrl, pdfFilename, pdfBase64 }),
  });
}
