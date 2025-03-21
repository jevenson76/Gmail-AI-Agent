import { OAuth2Client } from 'google-auth-library';
import type { GmailMessage } from '../types/gmail';
import { APIError } from '../utils/error';

class APIError extends Error {
  constructor(message: string, public readonly code?: string, public readonly originalError?: any) {
    super(message);
    this.name = 'APIError';
  }
}

export class GmailAPI {
  private gmail;
  private static instance: GmailAPI;
  private accessToken: string;
  private retryCount = 0;
  private maxRetries = 3;

  private constructor(accessToken: string) {
    if (!accessToken) {
      throw new APIError('Access token is required for Gmail API');
    }

    this.accessToken = accessToken;
    this.initializeGmailClient();
  }

  private initializeGmailClient() {
    // Ensure window.gapi is available
    if (typeof window !== 'undefined' && !window.gapi) {
      window.gapi = {
        client: {
          setToken: (token: any) => {
            console.log('Setting token:', token);
          },
          gmail: {
            users: {
              messages: {
                list: this.makeGmailRequest.bind(this, 'list'),
                get: this.makeGmailRequest.bind(this, 'get'),
                modify: this.makeGmailRequest.bind(this, 'modify'),
              },
              labels: {
                list: this.makeGmailRequest.bind(this, 'list_labels'),
                create: this.makeGmailRequest.bind(this, 'create_label'),
              },
              drafts: {
                create: this.makeGmailRequest.bind(this, 'create_draft'),
                send: this.makeGmailRequest.bind(this, 'send_draft'),
              },
              threads: {
                get: this.makeGmailRequest.bind(this, 'get_thread'),
              },
            },
          },
        },
      };
    }

    // Initialize gmail client with the token
    this.gmail = window.gapi.client.gmail;
    window.gapi.client.setToken({ access_token: this.accessToken });
  }

  private async makeGmailRequest(type: string, params: any): Promise<any> {
    try {
      const baseUrl = 'https://gmail.googleapis.com/gmail/v1/users';
      const userId = params.userId || 'me';
      const headers = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      };

      let url = '';
      let method = 'GET';
      let body = null;

      switch (type) {
        case 'list':
          url = `${baseUrl}/${userId}/messages?maxResults=${params.maxResults || 10}&q=${encodeURIComponent(params.q || '')}`;
          break;
        case 'get':
          url = `${baseUrl}/${userId}/messages/${params.id}?format=${params.format || 'full'}`;
          break;
        case 'modify':
          url = `${baseUrl}/${userId}/messages/${params.id}/modify`;
          method = 'POST';
          body = JSON.stringify(params.requestBody);
          break;
        case 'list_labels':
          url = `${baseUrl}/${userId}/labels`;
          break;
        case 'create_label':
          url = `${baseUrl}/${userId}/labels`;
          method = 'POST';
          body = JSON.stringify(params.requestBody);
          break;
        case 'create_draft':
          url = `${baseUrl}/${userId}/drafts`;
          method = 'POST';
          body = JSON.stringify(params.requestBody);
          break;
        case 'send_draft':
          url = `${baseUrl}/${userId}/drafts/${params.id}/send`;
          method = 'POST';
          break;
        case 'get_thread':
          url = `${baseUrl}/${userId}/threads/${params.id}`;
          break;
        default:
          throw new APIError(`Unknown request type: ${type}`, 'UNKNOWN_TYPE');
      }

      const response = await fetch(url, { method, headers, body });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: { message: response.statusText } };
        }
        
        // Handle specific HTTP status codes
        switch (response.status) {
          case 401:
            throw new APIError(
              'Authentication error: Your session has expired. Please log in again.',
              'AUTH_ERROR',
              errorData
            );
          case 403:
            throw new APIError(
              'Permission denied: You don\'t have the necessary permissions for this action.',
              'PERMISSION_DENIED',
              errorData
            );
          case 404:
            throw new APIError(
              'Resource not found: The requested item could not be found.',
              'NOT_FOUND',
              errorData
            );
          case 429:
            throw new APIError(
              'Rate limit exceeded: Too many requests, please try again later.',
              'RATE_LIMIT',
              errorData
            );
          case 500:
          case 502:
          case 503:
          case 504:
            throw new APIError(
              'Server error: Gmail service is currently unavailable. Please try again later.',
              'SERVER_ERROR',
              errorData
            );
          default:
            throw new APIError(
              `API request failed: ${errorData?.error?.message || response.statusText}`,
              'REQUEST_FAILED',
              errorData
            );
        }
      }

      // Reset retry counter on successful request
      this.retryCount = 0;
      return await response.json();
    } catch (error) {
      // Handle network errors and retry logic
      if (!(error instanceof APIError) && error instanceof Error && error.message.includes('network')) {
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeGmailRequest(type, params);
        } else {
          this.retryCount = 0;
          throw new APIError(
            'Network error: Unable to connect to Gmail. Please check your internet connection.',
            'NETWORK_ERROR',
            error
          );
        }
      }
      
      // Re-throw API errors
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle other types of errors
      throw new APIError(
        `Unexpected error: ${(error as Error).message}`,
        'UNEXPECTED_ERROR',
        error
      );
    }
  }

  static getInstance(accessToken: string): GmailAPI {
    if (!GmailAPI.instance || GmailAPI.instance.hasNewToken(accessToken)) {
      GmailAPI.instance = new GmailAPI(accessToken);
    }
    return GmailAPI.instance;
  }

  private hasNewToken(newToken: string): boolean {
    const currentToken = this.gmail?.context?._options?.auth?.credentials?.access_token;
    return currentToken !== newToken;
  }

  private base64Decode(str: string): string {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    try {
      return decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch {
      return atob(base64);
    }
  }

  private base64Encode(str: string): string {
    const base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async listMessages(query = '', maxResults = 10): Promise<GmailMessage[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults
      });

      if (!response.messages) {
        return [];
      }

      const messages = await Promise.all(
        response.messages.map(msg => this.getMessage(msg.id))
      );

      return messages.filter((msg): msg is GmailMessage => msg !== null);
    } catch (error) {
      console.error('Error listing messages:', error);
      throw new APIError('Failed to list Gmail messages');
    }
  }

  async getMessage(messageId: string): Promise<GmailMessage | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      if (!response || !response.payload) {
        throw new APIError('Invalid message format received from Gmail API');
      }

      const headers = response.payload.headers || [];
      
      const getHeader = (name: string): string => {
        const header = headers.find(h => h.name === name);
        return header?.value || '';
      };

      const subject = getHeader('Subject');
      const from = getHeader('From');
      const date = getHeader('Date');
      
      let body = '';
      if (response.payload.body?.data) {
        body = this.base64Decode(response.payload.body.data);
      } else if (response.payload.parts) {
        const textPart = response.payload.parts.find(part => 
          part.mimeType === 'text/plain' || part.mimeType === 'text/html'
        );
        if (textPart?.body?.data) {
          body = this.base64Decode(textPart.body.data);
        }
      }

      if (!response.id || !response.threadId || !from) {
        throw new APIError('Required message fields are missing');
      }

      return {
        id: response.id,
        threadId: response.threadId,
        subject,
        from,
        date,
        snippet: response.snippet || '',
        body
      };
    } catch (error) {
      console.error('Error getting message:', error);
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to get Gmail message');
    }
  }

  async sendReply(threadId: string, to: string, subject: string, body: string): Promise<boolean> {
    try {
      if (!threadId || !to || !subject || !body) {
        throw new APIError('Missing required fields for sending email reply');
      }

      const message = [
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body
      ].join('\n');

      const encodedMessage = this.base64Encode(message);

      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
          threadId
        }
      });

      return true;
    } catch (error) {
      console.error('Error sending reply:', error);
      throw new APIError('Failed to send email reply');
    }
  }

  async listLabels(): Promise<any[]> {
    try {
      const response = await this.gmail.users.labels.list({
        userId: 'me'
      });
      
      return response.labels || [];
    } catch (error) {
      console.error('Error listing labels:', error);
      throw new APIError('Failed to list Gmail labels');
    }
  }

  async createLabel(name: string, labelListVisibility = 'labelShow', messageListVisibility = 'show'): Promise<any> {
    try {
      return await this.gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name,
          labelListVisibility,
          messageListVisibility
        }
      });
    } catch (error) {
      console.error('Error creating label:', error);
      throw new APIError('Failed to create Gmail label');
    }
  }

  async addLabel(messageId: string, labelId: string): Promise<boolean> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [labelId]
        }
      });
      return true;
    } catch (error) {
      console.error('Error adding label:', error);
      throw new APIError('Failed to add label to message');
    }
  }

  /**
   * Archives an email
   * @param messageId The ID of the message to archive
   */
  async archiveEmail(messageId: string): Promise<void> {
    try {
      await this.modifyMessage(messageId, { removeLabelIds: ['INBOX'] });
    } catch (error) {
      console.error('Error archiving email:', error);
      throw new Error(`Failed to archive email: ${(error as Error).message}`);
    }
  }

  /**
   * Moves an email to trash
   * @param messageId The ID of the message to trash
   */
  async trashEmail(messageId: string): Promise<void> {
    try {
      await this.modifyMessage(messageId, { addLabelIds: ['TRASH'], removeLabelIds: ['INBOX'] });
    } catch (error) {
      console.error('Error trashing email:', error);
      throw new Error(`Failed to trash email: ${(error as Error).message}`);
    }
  }

  /**
   * Untrashes an email
   * @param messageId The ID of the message to untrash
   */
  async untrashEmail(messageId: string): Promise<void> {
    try {
      await this.modifyMessage(messageId, { removeLabelIds: ['TRASH'] });
    } catch (error) {
      console.error('Error untrashing email:', error);
      throw new Error(`Failed to untrash email: ${(error as Error).message}`);
    }
  }

  async createDraft(to: string, subject: string, body: string, threadId?: string): Promise<any> {
    try {
      const message = [
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body
      ].join('\n');

      const encodedMessage = this.base64Encode(message);
      
      const requestBody: any = {
        message: {
          raw: encodedMessage
        }
      };
      
      if (threadId) {
        requestBody.message.threadId = threadId;
      }

      return await this.gmail.users.drafts.create({
        userId: 'me',
        requestBody
      });
    } catch (error) {
      console.error('Error creating draft:', error);
      throw new APIError('Failed to create email draft');
    }
  }

  async listDrafts(maxResults = 10): Promise<any[]> {
    try {
      const response = await this.gmail.users.drafts.list({
        userId: 'me',
        maxResults
      });
      
      return response.drafts || [];
    } catch (error) {
      console.error('Error listing drafts:', error);
      throw new APIError('Failed to list Gmail drafts');
    }
  }

  async sendDraft(draftId: string): Promise<boolean> {
    try {
      await this.gmail.users.drafts.send({
        userId: 'me',
        requestBody: {
          id: draftId
        }
      });
      return true;
    } catch (error) {
      console.error('Error sending draft:', error);
      throw new APIError('Failed to send draft');
    }
  }

  private async getHeaders(message: any): Promise<any> {
    const headers: any = {};
    
    if (message.payload && message.payload.headers) {
      message.payload.headers.forEach((header: any) => {
        headers[header.name.toLowerCase()] = header.value;
      });
    }
    
    return headers;
  }

  /**
   * Modifies a message with the given parameters
   * @param messageId The ID of the message to modify
   * @param options The modification options
   */
  private async modifyMessage(messageId: string, options: {
    addLabelIds?: string[];
    removeLabelIds?: string[];
  }): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: options
      });
    } catch (error) {
      console.error('Error modifying message:', error);
      throw error;
    }
  }
}