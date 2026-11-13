import crypto from "node:crypto";
import type { OrderRecord } from "../types.ts";

export interface NotificationDispatchEvent {
  channel: "telegram" | "zalo" | "console";
  event: "order_created" | "payment_confirmed";
  orderCode: string;
  message: string;
  sentAt: string;
  delivered: boolean;
}

export function extractOrderCodeFromMemo(text: string): string | null {
  const match = text.toUpperCase().match(/YKC-[A-Z0-9]{4}-[A-Z0-9]{4}/);
  return match ? match[0] : null;
}

export function verifyWebhookSignature(
  rawBody: string,
  providedSignature: string | undefined,
  secretOverride?: string,
): boolean {
  const secret =
    secretOverride?.trim() ||
    process.env.PAYMENT_WEBHOOK_SECRET?.trim() ||
    "yokocho-vietqr-dev-secret";

  if (!providedSignature) {
    return false;
  }

  const cleaned = providedSignature.replace(/^sha256=/i, "").trim().toLowerCase();
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")
    .toLowerCase();

  const a = Buffer.from(cleaned, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

export class NotificationDispatcher {
  readonly history: NotificationDispatchEvent[] = [];

  async notifyOrderCreated(order: OrderRecord): Promise<NotificationDispatchEvent[]> {
    const msg = `[AKARI YOKOCHO] Đơn mới ${order.orderCode} - ${order.customerName} (${order.phone}) - Xe: ${order.vehicleInfo} - Tổng: ${order.totalVnd.toLocaleString("vi-VN")}₫`;
    return this.dispatch("order_created", order.orderCode, msg);
  }

  async notifyPaymentConfirmed(
    order: OrderRecord,
    paymentRef: string,
  ): Promise<NotificationDispatchEvent[]> {
    const msg = `[VIETQR ĐÃ NHẬN TIỀN] Đơn ${order.orderCode} đã thanh toán ${order.totalVnd.toLocaleString("vi-VN")}₫ (Mã GD: ${paymentRef}). Đã chuyển trạng thái sang ĐÃ ĐÓNG GÓI.`;
    return this.dispatch("payment_confirmed", order.orderCode, msg);
  }

  private async dispatch(
    event: "order_created" | "payment_confirmed",
    orderCode: string,
    message: string,
  ): Promise<NotificationDispatchEvent[]> {
    const results: NotificationDispatchEvent[] = [];
    const tgToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const tgChatId = process.env.TELEGRAM_CHAT_ID?.trim();

    if (tgToken && tgChatId) {
      let delivered = false;
      try {
        const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: tgChatId, text: message }),
        });
        delivered = res.ok;
      } catch {
        delivered = false;
      }
      const entry: NotificationDispatchEvent = {
        channel: "telegram",
        event,
        orderCode,
        message,
        sentAt: new Date().toISOString(),
        delivered,
      };
      this.history.unshift(entry);
      results.push(entry);
      return results;
    }

    const fallback: NotificationDispatchEvent = {
      channel: "console",
      event,
      orderCode,
      message,
      sentAt: new Date().toISOString(),
      delivered: true,
    };
    this.history.unshift(fallback);
    if (this.history.length > 50) {
      this.history.length = 50;
    }
    results.push(fallback);
    return results;
  }
}

