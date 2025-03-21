export interface EmailAnalysis {
  category: string;
  importance: number;
  summary: string;
  suggestedActions: string[];
  labels?: string[];
}

export interface CompanyInfo {
  name: string;
  website?: string;
  industry?: string;
  description?: string;
  size?: string;
}

export interface EmailReply {
  subject: string;
  body: string;
  tone: string;
  intent: string;
  saveAsDraft: boolean;
}

export interface BaseTool<T, R> {
  name: string;
  description: string;
  run(input: T): Promise<R>;
}

export interface EmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
}

export interface DraftEmail {
  id: string;
  threadId: string;
  originalEmailId: string;
  to: string;
  subject: string;
  body: string;
  createdAt: string;
}