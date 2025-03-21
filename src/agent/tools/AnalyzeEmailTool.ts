/**
 * Tool to extract and analyze email content
 */

interface EmailContent {
  subject: string;
  body: string;
  sender: string;
  recipient: string;
  date: string;
  headers: Record<string, string>;
}

export class AnalyzeEmailTool {
  /**
   * Extract and analyze email content from message data
   */
  public async analyze(message: any): Promise<EmailContent> {
    try {
      // Extract message headers
      const headers = this.extractHeaders(message);
      
      // Get subject from headers
      const subject = headers['Subject'] || headers['subject'] || '';
      
      // Get sender information
      const from = headers['From'] || headers['from'] || '';
      
      // Get recipient information
      const to = headers['To'] || headers['to'] || '';
      
      // Get date information
      const date = headers['Date'] || headers['date'] || '';
      
      // Extract email body
      const body = this.extractEmailBody(message);
      
      return {
        subject,
        body,
        sender: from,
        recipient: to,
        date,
        headers
      };
    } catch (error) {
      console.error('Error analyzing email:', error);
      throw new Error(`Failed to analyze email: ${(error as Error).message}`);
    }
  }

  /**
   * Extract headers from message data
   */
  private extractHeaders(message: any): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (!message.payload || !message.payload.headers) {
      return headers;
    }
    
    // Process headers
    for (const header of message.payload.headers) {
      if (header.name && header.value) {
        headers[header.name] = header.value;
      }
    }
    
    return headers;
  }

  /**
   * Extract email body from message data
   */
  private extractEmailBody(message: any): string {
    if (!message.payload) {
      return '';
    }
    
    // Case 1: Simple text in the payload
    if (message.payload.body && message.payload.body.data) {
      return this.decodeBase64(message.payload.body.data);
    }
    
    // Case 2: Message has parts (multipart email)
    if (message.payload.parts && message.payload.parts.length > 0) {
      // First try to find HTML part
      const htmlPart = message.payload.parts.find((part: any) => 
        part.mimeType === 'text/html' && part.body && part.body.data
      );
      
      if (htmlPart) {
        // Convert HTML to plain text (simple strip for now)
        const htmlBody = this.decodeBase64(htmlPart.body.data);
        return this.htmlToPlainText(htmlBody);
      }
      
      // If no HTML part, look for plain text
      const textPart = message.payload.parts.find((part: any) => 
        part.mimeType === 'text/plain' && part.body && part.body.data
      );
      
      if (textPart) {
        return this.decodeBase64(textPart.body.data);
      }
      
      // Recursive check through nested parts
      for (const part of message.payload.parts) {
        if (part.parts) {
          const nestedBody = this.extractBodyFromParts(part.parts);
          if (nestedBody) {
            return nestedBody;
          }
        }
      }
    }
    
    // Fall back to snippet if nothing else found
    return message.snippet || '';
  }

  /**
   * Extract body from message parts recursively
   */
  private extractBodyFromParts(parts: any[]): string | null {
    // Check for HTML parts first
    const htmlPart = parts.find((part) => 
      part.mimeType === 'text/html' && part.body && part.body.data
    );
    
    if (htmlPart) {
      return this.htmlToPlainText(this.decodeBase64(htmlPart.body.data));
    }
    
    // Then check for plain text parts
    const textPart = parts.find((part) => 
      part.mimeType === 'text/plain' && part.body && part.body.data
    );
    
    if (textPart) {
      return this.decodeBase64(textPart.body.data);
    }
    
    // Recursively check nested parts
    for (const part of parts) {
      if (part.parts) {
        const nestedBody = this.extractBodyFromParts(part.parts);
        if (nestedBody) {
          return nestedBody;
        }
      }
    }
    
    return null;
  }

  /**
   * Decode base64 string from Gmail API
   */
  private decodeBase64(data: string): string {
    // Replace URL-safe characters
    const safeString = data.replace(/-/g, '+').replace(/_/g, '/');
    
    try {
      return decodeURIComponent(
        atob(safeString)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch (error) {
      // If decoding fails, try a simpler approach
      try {
        return atob(safeString);
      } catch (e) {
        console.error('Error decoding base64:', e);
        return '';
      }
    }
  }

  /**
   * Convert HTML to plain text (simple version)
   */
  private htmlToPlainText(html: string): string {
    // Simple HTML tag removal
    const withoutTags = html.replace(/<[^>]*>/g, ' ');
    
    // Normalize whitespace
    const normalized = withoutTags.replace(/\s+/g, ' ').trim();
    
    // Decode HTML entities
    const decoded = normalized
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    return decoded;
  }
} 