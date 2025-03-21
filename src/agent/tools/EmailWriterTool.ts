import type { BaseTool, EmailReply } from '../types';
import type { GmailMessage } from '../../types/gmail';
import { generateReplyWithLocalLLM } from '../../lib/ollama';
import { OllamaClient } from '../../lib/ollama';

interface ResponseGenerationResult {
  text: string;
  actions?: string[];
  saveDraft: boolean;
}

// Helper function to simulate AI response generation when no LLM is available
function generateAIResponse(email: GmailMessage): {
  subject: string;
  body: string;
  tone: string;
  intent: string;
  saveAsDraft: boolean;
} {
  const originalSubject = email.subject;
  const senderName = email.from.split('<')[0].trim();
  const content = `${email.subject} ${email.body || ''}`.toLowerCase();
  
  // Determine email intent
  let intent = 'acknowledge';
  if (content.includes('?')) {
    intent = 'answer_question';
  } else if (content.includes('meet') || content.includes('schedule')) {
    intent = 'schedule_meeting';
  } else if (content.includes('update') || content.includes('status')) {
    intent = 'provide_update';
  } else if (content.includes('urgent') || content.includes('asap')) {
    intent = 'urgent_response';
  }
  
  // Determine email tone
  let tone = 'professional';
  if (content.includes('urgent') || content.includes('asap')) {
    tone = 'urgent';
  } else if (content.includes('thank') || content.includes('appreciate')) {
    tone = 'grateful';
  } else if (content.includes('sorry') || content.includes('apologize')) {
    tone = 'apologetic';
  } else if (content.includes('congratulations') || content.includes('great news')) {
    tone = 'enthusiastic';
  }
  
  // Set subject line
  let subject = originalSubject;
  if (!originalSubject.toLowerCase().startsWith('re:')) {
    subject = `Re: ${originalSubject}`;
  }
  
  // Generate greeting based on sender name and tone
  let greeting = `Hi ${senderName},`;
  if (tone === 'professional') {
    greeting = `Hello ${senderName},`;
  } else if (tone === 'urgent') {
    greeting = `Hello ${senderName},`;
  } else if (tone === 'grateful') {
    greeting = `Hi ${senderName},`;
  } else if (tone === 'enthusiastic') {
    greeting = `Hi ${senderName}!`;
  }
  
  // Generate response body based on intent
  let responseBody = '';
  
  switch (intent) {
    case 'answer_question':
      responseBody = 'Thank you for your question. ';
      
      if (content.includes('pricing') || content.includes('cost')) {
        responseBody += 'Our pricing details can be found on our website, or I can schedule a call to discuss your specific needs and provide a customized quote.';
      } else if (content.includes('feature') || content.includes('product')) {
        responseBody += 'Regarding your question about our product features, I would be happy to provide more details or set up a demonstration to show you how it works.';
      } else if (content.includes('when') || content.includes('timeline')) {
        responseBody += 'The timeline you asked about is approximately 2-3 weeks, but I can provide more specific information if you share more details about your requirements.';
      } else {
        responseBody += 'I would like to address your question properly. Could we schedule a brief call to discuss this in more detail?';
      }
      break;
      
    case 'schedule_meeting':
      responseBody = 'I would be happy to schedule a meeting with you. ';
      
      if (content.includes('next week')) {
        responseBody += 'I have availability next week on Tuesday at 10am or Thursday at 2pm (EST). Would either of those times work for you?';
      } else if (content.includes('tomorrow') || content.includes('today')) {
        responseBody += 'I have some availability tomorrow. Would 11am or 3pm (EST) work for your schedule?';
      } else {
        responseBody += 'I have availability this week on Wednesday at 11am or Friday at 2pm (EST). Alternatively, I am open most of next week. Please let me know what works best for you.';
      }
      break;
      
    case 'provide_update':
      responseBody = 'Thank you for checking in. ';
      responseBody += 'I wanted to provide you with an update on our progress. We are currently on track with the timeline we discussed. I will send you a more detailed report by the end of the week.';
      break;
      
    case 'urgent_response':
      responseBody = 'I am responding to your urgent message right away. ';
      responseBody += 'I understand the time-sensitive nature of this matter and want to assure you that it is my top priority. Let me address your immediate concerns:';
      
      if (content.includes('issue') || content.includes('problem')) {
        responseBody += ' I am looking into the issue right now and will have more information for you within the hour. In the meantime, you can reach me directly at my phone number below if needed.';
      } else {
        responseBody += ' I am available to discuss this matter immediately. Please let me know if you would prefer a phone call or if this email response is sufficient.';
      }
      break;
      
    default:
      // Default acknowledgment
      responseBody = 'Thank you for your email. I have received your message and will respond more comprehensively shortly.';
      break;
  }
  
  // Add appropriate closing based on tone and intent
  let closing = 'Best regards';
  if (tone === 'urgent') {
    closing = 'Regards';
  } else if (tone === 'grateful') {
    closing = 'With appreciation';
  } else if (tone === 'enthusiastic') {
    closing = 'Best wishes';
  }
  
  // Determine if email should be saved as draft
  // For high-importance or complex questions, save as draft for review
  const requiresReview = intent === 'answer_question' || 
                        content.includes('contract') || 
                        content.includes('legal') ||
                        content.includes('proposal') ||
                        content.includes('important') ||
                        content.includes('critical');
                        
  const saveAsDraft = requiresReview;
  
  // Combine all parts
  const body = `${greeting}\n\n${responseBody}\n\n${closing}`;
  
  return {
    subject,
    body,
    tone,
    intent,
    saveAsDraft
  };
}

export class EmailWriterTool implements BaseTool<GmailMessage, EmailReply> {
  name = 'email_writer';
  description = 'Generates email replies based on conversation context';
  private localLLM: OllamaClient | null = null;
  private responseTemplates: Map<string, string>;

  constructor(localLLM?: OllamaClient) {
    this.localLLM = localLLM;
    
    // Initialize response templates for different categories
    this.responseTemplates = new Map([
      ['Meeting_Ready_Lead', 
       `Thank you for your interest in scheduling a meeting. I'm happy to connect and discuss how we can help.
        
How does your calendar look next week? I have availability on Tuesday and Thursday afternoon, or we could find another time that works for you.
        
Looking forward to our conversation!
        
Best regards,`
      ],
      ['Power', 
       `Thank you for reaching out. I appreciate your interest and would be happy to provide more information about our solutions.
        
Based on your role and requirements, I believe we could offer significant value to your organization. Would you be available for a brief call to discuss your specific needs in more detail?
        
Best regards,`
      ],
      ['Interested', 
       `Thank you for your interest in our products/services. I'd be happy to provide more information.
        
Based on your inquiry, I think our [Product/Service] might be a great fit for your needs. It offers [key benefits relevant to their interest].
        
Would you like to schedule a demo or have a quick call to discuss how we can specifically address your requirements?
        
Best regards,`
      ],
      ['Question', 
       `Thank you for your question. I'm happy to help clarify.
        
[Answer to their specific question with relevant details]
        
Please let me know if you have any follow-up questions or if there's anything else I can help with.
        
Best regards,`
      ],
      ['Obstacle', 
       `Thank you for bringing this issue to our attention. I understand how frustrating this must be.
        
I've looked into your concern regarding [specific issue], and here's what I can offer:
[Proposed solution or next steps]
        
Please let me know if this addresses your concern or if you need further assistance.
        
Best regards,`
      ],
      ['Not_Interested', 
       `Thank you for taking the time to respond to my outreach.
        
I understand that this might not be the right time for your organization to consider our solutions. Would it be alright if I reach out again in the future when your priorities may have changed?
        
Best regards,`
      ]
    ]);
  }

  async run(email: GmailMessage): Promise<EmailReply> {
    // Try to use local LLM if available
    if (this.localLLM) {
      try {
        const response = await generateReplyWithLocalLLM(
          this.localLLM,
          {
            from: email.from,
            subject: email.subject,
            body: email.body || email.snippet || ''
          }
        );
        
        return response;
      } catch (error) {
        console.warn('Local LLM reply generation failed, falling back to rule-based generation:', error);
        // Continue to fallback generation
      }
    }
    
    // Fall back to rule-based generation
    const response = generateAIResponse(email);
    
    return response;
  }

  /**
   * Generate a response to an email based on its category and content
   */
  public async generateResponse(
    subject: string,
    body: string,
    sender: string,
    category: string,
    importance: number
  ): Promise<ResponseGenerationResult> {
    // If local LLM is available, use it for response generation
    if (this.localLLM) {
      try {
        console.log('Using local LLM for email response generation');
        
        // Determine the tone based on category and importance
        const tone = this.determineTone(category, importance);
        
        const responseText = await this.localLLM.generateEmailResponse(
          subject,
          body,
          sender,
          category,
          tone
        );
        
        // Determine if we should save as draft based on importance
        const shouldSaveDraft = importance >= 5;
        
        // Generate suggested actions based on category
        const actions = this.generateSuggestedActions(category, importance);
        
        return {
          text: responseText,
          actions,
          saveDraft: shouldSaveDraft
        };
      } catch (error) {
        console.error('Local LLM response generation failed, falling back to template-based:', error);
        // Fall back to template-based response if LLM fails
      }
    }
    
    // Template-based response generation as fallback
    console.log('Using template-based response generation');
    return this.templateBasedResponse(subject, sender, category, importance);
  }

  /**
   * Generate a response using templates
   */
  private templateBasedResponse(
    subject: string,
    sender: string,
    category: string,
    importance: number
  ): ResponseGenerationResult {
    // Extract sender name from email address
    const senderName = sender.includes('<') 
      ? sender.split('<')[0].trim() 
      : sender.split('@')[0];
    
    // Get template for this category or use a generic one
    const templateBody = this.responseTemplates.get(category) || 
      `Thank you for your email. I've received your message and will get back to you shortly.
       
Best regards,`;
    
    // Build full response with personalization
    const responseText = `Dear ${senderName},
    
${templateBody}`;
    
    // Generate suggested actions based on category
    const actions = this.generateSuggestedActions(category, importance);
    
    // Determine if we should save as draft based on importance and category
    const saveDraft = this.shouldSaveAsDraft(category, importance);
    
    return {
      text: responseText,
      actions,
      saveDraft
    };
  }

  /**
   * Determine tone for response based on category and importance
   */
  private determineTone(category: string, importance: number): 'professional' | 'friendly' | 'concise' {
    if (['Meeting_Ready_Lead', 'Power'].includes(category) || importance >= 8) {
      return 'professional';
    }
    
    if (['Interested', 'Question'].includes(category)) {
      return 'friendly';
    }
    
    return 'concise';
  }

  /**
   * Generate suggested actions based on email category and importance
   */
  private generateSuggestedActions(category: string, importance: number): string[] {
    const actions: string[] = [];
    
    switch (category) {
      case 'Meeting_Ready_Lead':
        actions.push('Schedule meeting');
        actions.push('Send calendar invite');
        if (importance >= 8) actions.push('Prepare meeting agenda');
        break;
      case 'Power':
        actions.push('Research company');
        actions.push('Prepare personalized proposal');
        if (importance >= 8) actions.push('Alert sales manager');
        break;
      case 'Interested':
        actions.push('Send product information');
        actions.push('Follow up in 3 days');
        break;
      case 'Question':
        actions.push('Provide detailed answer');
        if (importance >= 7) actions.push('Schedule call for complex questions');
        break;
      case 'Obstacle':
        actions.push('Escalate to support team');
        actions.push('Follow up after resolution');
        break;
      case 'Not_Interested':
        actions.push('Update CRM status');
        actions.push('Schedule follow-up in 3 months');
        break;
      default:
        actions.push('Review and respond');
        if (importance >= 7) actions.push('Prioritize response');
    }
    
    return actions;
  }

  /**
   * Determine if the response should be saved as a draft
   */
  private shouldSaveAsDraft(category: string, importance: number): boolean {
    // High importance emails or certain categories should always be saved as drafts for review
    if (importance >= 8) {
      return true;
    }
    
    // For specific categories that need careful review
    const draftCategories = ['Power', 'Meeting_Ready_Lead', 'Obstacle'];
    if (draftCategories.includes(category)) {
      return true;
    }
    
    // For medium importance emails
    if (importance >= 5) {
      return true;
    }
    
    // Default to false for low importance or routine emails
    return false;
  }
}