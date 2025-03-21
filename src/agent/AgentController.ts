import { GmailAPI } from '../api/gmail';
import { SmartLeadAPI } from '../api/smartlead';
import { AnalyzeEmailTool } from './tools/AnalyzeEmailTool';
import { CategorizeEmailTool } from './tools/CategorizeEmailTool';
import { EmailWriterTool } from './tools/EmailWriterTool';
import { LabelManagerTool } from './tools/LabelManagerTool';
import { supabase } from '../lib/supabase';
import { getLocalLLMClient, OllamaClient } from '../lib/ollama';

export interface ProcessedEmail {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  date: string;
  category: string;
  importance: number;
  summary: string;
  suggestedResponse?: string;
  suggestedActions?: string[];
  labels?: string[];
}

export interface ProcessEmailResult {
  processed: boolean;
  saved: boolean;
  sent: boolean;
  archived: boolean;
  error?: string;
}

export interface AgentOptions {
  archiveAfterProcessing?: boolean;
  useLocalLLM?: boolean;
}

export class AgentController {
  private gmailAPI: GmailAPI;
  private smartLeadAPI: SmartLeadAPI;
  private analyzeEmailTool: AnalyzeEmailTool;
  private categorizeEmailTool: CategorizeEmailTool;
  private emailWriterTool: EmailWriterTool;
  private labelManagerTool: LabelManagerTool;
  private localLLM: OllamaClient | null = null;
  private archiveAfterProcessing: boolean;

  constructor(gmailAPI: GmailAPI, options: AgentOptions = {}) {
    this.gmailAPI = gmailAPI;
    this.smartLeadAPI = SmartLeadAPI.getInstance();
    this.archiveAfterProcessing = options.archiveAfterProcessing ?? true;
    
    // Initialize with local LLM if enabled
    if (options.useLocalLLM) {
      this.initLocalLLM();
    }
    
    this.analyzeEmailTool = new AnalyzeEmailTool();
    this.categorizeEmailTool = new CategorizeEmailTool(this.localLLM);
    this.emailWriterTool = new EmailWriterTool(this.localLLM);
    this.labelManagerTool = new LabelManagerTool(this.gmailAPI);
  }
  
  private async initLocalLLM() {
    try {
      this.localLLM = await getLocalLLMClient();
      console.log('Local LLM initialized:', this.localLLM ? 'available' : 'unavailable');
    } catch (error) {
      console.error('Failed to initialize local LLM:', error);
      this.localLLM = null;
    }
  }

  public async processEmail(email: any): Promise<ProcessEmailResult> {
    try {
      console.log(`Processing email: ${email.id}`);
      
      // Step 1: Extract email content and metadata
      const messageContent = await this.gmailAPI.getMessage(email.id);
      if (!messageContent) {
        throw new Error('Failed to get message content');
      }
      
      // Step 2: Analyze the email
      const analysis = await this.analyzeEmailTool.analyze(messageContent);
      
      // Step 3: Categorize the email
      const categorization = await this.categorizeEmailTool.categorize(
        analysis.subject,
        analysis.body,
        analysis.sender
      );
      
      // Step 4: Apply labels based on categorization
      const labels = await this.labelManagerTool.applyLabels(
        email.id,
        categorization.category,
        categorization.importance
      );
      
      // Step 5: Generate a response if appropriate
      const responseNeeded = this.shouldGenerateResponse(categorization.category, categorization.importance);
      let suggestedResponse = null;
      
      if (responseNeeded) {
        suggestedResponse = await this.emailWriterTool.generateResponse(
          analysis.subject,
          analysis.body,
          analysis.sender,
          categorization.category,
          categorization.importance
        );
      }
      
      // Step 6: Save the processed email metadata to database
      const processed = await this.saveProcessedEmail({
        id: email.id,
        threadId: email.threadId,
        from: analysis.sender,
        to: analysis.recipient,
        subject: analysis.subject,
        snippet: email.snippet,
        date: email.internalDate,
        category: categorization.category,
        importance: categorization.importance,
        summary: categorization.summary,
        suggestedResponse: suggestedResponse?.text,
        suggestedActions: suggestedResponse?.actions,
        labels
      });
      
      // Step 7: Create a draft if a response was generated
      let draftSaved = false;
      if (suggestedResponse) {
        if (suggestedResponse.saveDraft) {
          await this.gmailAPI.createDraft({
            to: analysis.sender,
            subject: `Re: ${analysis.subject}`,
            message: suggestedResponse.text
          });
          draftSaved = true;
        }
      }
      
      // Step 8: Archive the email if configured to do so
      let archived = false;
      if (this.archiveAfterProcessing) {
        await this.archiveEmail(email.id);
        archived = true;
      }
      
      return {
        processed: true,
        saved: processed,
        sent: false, // We don't auto-send emails
        archived,
      };
    } catch (error) {
      console.error(`Error processing email ${email.id}:`, error);
      return {
        processed: false,
        saved: false,
        sent: false,
        archived: false,
        error: (error as Error).message,
      };
    }
  }
  
  private async archiveEmail(emailId: string): Promise<void> {
    try {
      await this.gmailAPI.archiveEmail(emailId);
      console.log(`Email ${emailId} archived.`);
    } catch (error) {
      console.error(`Failed to archive email ${emailId}:`, error);
      throw error;
    }
  }

  private shouldGenerateResponse(category: string, importance: number): boolean {
    // Don't generate responses for certain categories
    const nonResponseCategories = ['Spam', 'Newsletter', 'No_Longer_Works', 'OOO'];
    if (nonResponseCategories.includes(category)) {
      return false;
    }
    
    // Always generate responses for high importance emails
    if (importance >= 7) {
      return true;
    }
    
    // Generate responses for specific categories regardless of importance
    const alwaysRespondCategories = ['Meeting_Ready_Lead', 'Power', 'Question', 'Urgent'];
    if (alwaysRespondCategories.includes(category)) {
      return true;
    }
    
    // For everything else, respond if importance is medium or higher
    return importance >= 5;
  }

  private async saveProcessedEmail(email: ProcessedEmail): Promise<boolean> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return false;
      }
      
      const { error } = await supabase.from('email_metadata').upsert({
        id: email.id,
        thread_id: email.threadId,
        sender: email.from,
        recipient: email.to,
        subject: email.subject,
        snippet: email.snippet,
        received_at: new Date(parseInt(email.date)).toISOString(),
        category: email.category,
        importance_score: email.importance,
        ai_summary: email.summary,
        suggested_response: email.suggestedResponse,
        suggested_actions: email.suggestedActions,
        applied_labels: email.labels,
        has_draft: email.suggestedResponse ? true : false,
        processed_at: new Date().toISOString()
      });
      
      if (error) {
        console.error('Error saving processed email:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in saveProcessedEmail:', error);
      return false;
    }
  }
}