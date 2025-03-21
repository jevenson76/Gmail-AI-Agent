export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body?: string;
}

export interface GmailCredentials {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
}