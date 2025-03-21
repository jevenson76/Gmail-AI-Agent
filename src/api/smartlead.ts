import type { EmailReply } from '../agent/types';

interface SmartLeadConfig {
  apiKey: string;
  baseUrl: string;
}

interface SendEmailParams {
  campaignId: string;
  leadId: string;
  reply: EmailReply;
}

export class SmartLeadAPI {
  private apiKey: string;
  private baseUrl: string;
  private static instance: SmartLeadAPI;

  private constructor(config: SmartLeadConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
  }

  static getInstance(config: SmartLeadConfig): SmartLeadAPI {
    if (!SmartLeadAPI.instance || SmartLeadAPI.instance.hasNewConfig(config)) {
      SmartLeadAPI.instance = new SmartLeadAPI(config);
    }
    return SmartLeadAPI.instance;
  }

  private hasNewConfig(newConfig: SmartLeadConfig): boolean {
    return this.apiKey !== newConfig.apiKey || this.baseUrl !== newConfig.baseUrl;
  }

  // Check if SmartLead API is configured
  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.baseUrl);
  }

  async sendEmailReply({ campaignId, leadId, reply }: SendEmailParams): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/v1/campaigns/${campaignId}/reply-email-thread`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Version': '2024-01',
        },
        body: JSON.stringify({
          email_stats_id: leadId,
          reply_email_body: reply.body,
          reply_email_subject: reply.subject,
          tone: reply.tone,
          intent: reply.intent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`SmartLead API error: ${error.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('Error sending email via SmartLead:', error);
      throw error;
    }
  }

  async getEmailThread(campaignId: string, leadId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/v1/campaigns/${campaignId}/email-thread/${leadId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Version': '2024-01',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`SmartLead API error: ${error.message || 'Unknown error'}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching email thread from SmartLead:', error);
      throw error;
    }
  }
}