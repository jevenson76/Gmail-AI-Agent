import { GmailAPI } from '../api/gmail';
import { SmartLeadAPI } from '../api/smartlead';
import { AgentController, AgentOptions } from '../agent/AgentController';
import { supabase } from '../lib/supabase';

/**
 * Service for processing emails from Gmail
 */
export class EmailProcessor {
  private gmailAPI: GmailAPI;
  private agentController: AgentController;
  private smartLeadApi: SmartLeadAPI;

  constructor(accessToken: string) {
    // Load agent options from local storage
    const useLocalLLM = localStorage.getItem('useLocalLLM') === 'true';
    const localLLMModel = localStorage.getItem('localLLMModel') || 'llama3';
    const archiveAfterProcessing = localStorage.getItem('archiveAfterProcessing') !== 'false'; // default to true
    
    this.gmailAPI = GmailAPI.getInstance(accessToken);
    this.agentController = new AgentController(accessToken, {
      useLocalLLM,
      localLLMModel, 
      archiveAfterProcessing
    });
    
    // Initialize SmartLead API with configuration
    const smartleadApiKey = localStorage.getItem('smartleadApiKey') || '';
    
    this.smartLeadApi = SmartLeadAPI.getInstance({
      apiKey: smartleadApiKey || import.meta.env.VITE_SMARTLEAD_API_KEY || '',
      baseUrl: import.meta.env.VITE_SMARTLEAD_BASE_URL || 'https://server.smartlead.ai',
    });
  }

  /**
   * Process new unread emails from Gmail
   */
  public async processNewEmails(): Promise<{ processed: number; errors: number }> {
    console.log('Processing new emails...');
    let processed = 0;
    let errors = 0;
    
    try {
      // Get unread emails
      const unreadEmails = await this.gmailAPI.getUnreadMessages();
      console.log(`Found ${unreadEmails.length} unread emails`);
      
      if (unreadEmails.length === 0) {
        return { processed, errors };
      }
      
      // Process each email
      for (const email of unreadEmails) {
        try {
          const result = await this.processEmail(email);
          if (result.processed) {
            processed++;
          } else {
            errors++;
            console.error(`Error processing email ${email.id}: ${result.error}`);
          }
        } catch (error) {
          errors++;
          console.error(`Error processing email ${email.id}:`, error);
        }
      }
      
      return { processed, errors };
    } catch (error) {
      console.error('Error processing new emails:', error);
      throw error;
    }
  }

  /**
   * Process a single email
   */
  private async processEmail(email: any): Promise<{
    processed: boolean;
    error?: string;
  }> {
    try {
      console.log(`Processing email: ${email.id}`);
      
      // Use agent controller to process the email
      const result = await this.agentController.processEmail(email);
      
      // Log the result
      if (result.processed) {
        console.log(`Successfully processed email ${email.id}`);
        if (result.archived) {
          console.log(`Email ${email.id} was archived`);
        }
      } else {
        console.error(`Failed to process email ${email.id}: ${result.error}`);
      }
      
      return {
        processed: result.processed,
        error: result.error
      };
    } catch (error) {
      console.error(`Error in processEmail ${email.id}:`, error);
      return {
        processed: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Archive an email
   */
  public async archiveEmail(emailId: string): Promise<boolean> {
    try {
      await this.gmailAPI.archiveEmail(emailId);
      
      // Update in database
      if (supabase) {
        await supabase
          .from('email_metadata')
          .update({ archived: true })
          .eq('id', emailId);
      }
      
      return true;
    } catch (error) {
      console.error(`Error archiving email ${emailId}:`, error);
      return false;
    }
  }

  /**
   * Trash an email
   */
  public async trashEmail(emailId: string): Promise<boolean> {
    try {
      await this.gmailAPI.trashEmail(emailId);
      
      // Update in database
      if (supabase) {
        await supabase
          .from('email_metadata')
          .update({ archived: true, trashed: true })
          .eq('id', emailId);
      }
      
      return true;
    } catch (error) {
      console.error(`Error trashing email ${emailId}:`, error);
      return false;
    }
  }

  /**
   * Extract campaign ID from email
   */
  private extractCampaignId(email: any): string | null {
    try {
      // Check headers for campaign ID
      if (email.payload && email.payload.headers) {
        for (const header of email.payload.headers) {
          if (header.name === 'X-Campaign-ID' && header.value) {
            return header.value;
          }
        }
      }
      
      // Check for campaign ID in the email body
      if (email.snippet) {
        const match = email.snippet.match(/campaign[_-]?id[:\s=]+([a-zA-Z0-9_-]+)/i);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting campaign ID:', error);
      return null;
    }
  }
}