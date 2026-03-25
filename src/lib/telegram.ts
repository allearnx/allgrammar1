import { logger } from '@/lib/logger';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/** Send a plain-text Telegram message (fire-and-forget, never throws). */
export async function sendTelegram(message: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message }),
      },
    );
    if (!res.ok) {
      const err = await res.text();
      logger.error('telegram.send_failed', { status: res.status, error: err });
    }
  } catch (err) {
    logger.error('telegram.error', { error: err instanceof Error ? err.message : String(err) });
  }
}
