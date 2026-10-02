import { db } from '../db/database.js';

export interface NotificationPayload {
  title: string;
  message: string;
  type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'URGENT';
  target?: string; // User ID or 'ALL'
  channel?: 'SYSTEM' | 'EMAIL' | 'SLACK' | 'WHATSAPP';
}

export interface NotificationProvider {
  name: string;
  send(payload: NotificationPayload): Promise<boolean>;
}

export class EmailNotificationProvider implements NotificationProvider {
  name = 'Email';

  async send(payload: NotificationPayload): Promise<boolean> {
    const smtpHost = process.env.SMTP_HOST;
    if (!smtpHost) {
      console.log(`[Notification:Email (Mock/Dev)] To: ${payload.target || 'Admin'} | Subject: ${payload.title} | ${payload.message}`);
      return true;
    }
    // Production SMTP integration placeholder (e.g. nodemailer)
    console.log(`[Notification:Email] Sending via SMTP ${smtpHost}: ${payload.title}`);
    return true;
  }
}

export class WebhookNotificationProvider implements NotificationProvider {
  name = 'Webhook';

  async send(payload: NotificationPayload): Promise<boolean> {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (!webhookUrl) return false;

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return true;
    } catch (err) {
      console.error('[Notification:Webhook] Error delivering webhook:', err);
      return false;
    }
  }
}

class NotificationService {
  private providers: NotificationProvider[] = [];

  constructor() {
    this.providers.push(new EmailNotificationProvider());
    this.providers.push(new WebhookNotificationProvider());
  }

  registerProvider(provider: NotificationProvider) {
    this.providers.push(provider);
  }

  async notify(payload: NotificationPayload): Promise<void> {
    // 1. Always record in internal in-app notifications
    db.createNotification({
      title: payload.title,
      message: payload.message,
      type: payload.type || 'INFO',
      target: payload.target || 'ALL',
      channel: payload.channel || 'SYSTEM',
    });

    // 2. Dispatch to registered external providers
    for (const provider of this.providers) {
      try {
        await provider.send(payload);
      } catch (err) {
        console.error(`Error sending notification via provider ${provider.name}:`, err);
      }
    }
  }
}

export const notificationService = new NotificationService();
