import type { BaseTool, EmailAnalysis } from '../types';
import type { GmailMessage } from '../../types/gmail';
import { analyzeEmailWithLocalLLM } from '../../lib/ollama';
import { OllamaClient } from '../../lib/ollama';

interface Categorization {
  category: string;
  importance: number;
  summary: string;
}

// Helper function to simulate AI analysis when no LLM is available
function analyzeTextContent(subject: string, body: string): {
  category: string;
  importance: number;
  summary: string;
  suggestedActions: string[];
  labels: string[];
} {
  const content = `${subject} ${body}`.toLowerCase();
  
  // Email classification
  const categories = [
    { name: 'Meeting_Ready_Lead', terms: ['meeting', 'schedule', 'available', 'discuss', 'call'], priority: 8 },
    { name: 'Power', terms: ['decision maker', 'ceo', 'executive', 'leadership', 'director'], priority: 9 },
    { name: 'Question', terms: ['how', 'what', 'when', 'where', 'why', '?', 'help', 'support'], priority: 6 },
    { name: 'Unsubscribe', terms: ['unsubscribe', 'opt out', 'stop receiving', 'remove me'], priority: 2 },
    { name: 'OOO', terms: ['out of office', 'vacation', 'away from desk', 'annual leave', 'holiday'], priority: 3 },
    { name: 'No_Longer_Works', terms: ['no longer', 'left the company', 'moved on', 'not working here'], priority: 3 },
    { name: 'Not_Interested', terms: ['not interested', 'no thanks', 'pass', 'decline'], priority: 4 },
    { name: 'Info', terms: ['info', 'information', 'details', 'learn more', 'tell me'], priority: 5 },
    { name: 'Sales_Opportunity', terms: ['purchase', 'buy', 'interested', 'demo', 'trial', 'pricing'], priority: 9 },
    { name: 'Urgent', terms: ['urgent', 'asap', 'immediately', 'critical', 'important'], priority: 10 },
    { name: 'Follow_Up', terms: ['follow up', 'checking in', 'touching base', 'following up'], priority: 7 },
    { name: 'Newsletter', terms: ['newsletter', 'weekly update', 'monthly update', 'bulletin'], priority: 2 }
  ];
  
  // Score each category based on term frequency
  const categoryScores = categories.map(category => {
    const termMatches = category.terms.filter(term => content.includes(term)).length;
    const score = termMatches * category.priority;
    return { name: category.name, score };
  });
  
  // Find the highest scoring category
  const topCategory = [...categoryScores].sort((a, b) => b.score - a.score)[0];
  
  // Calculate importance score (1-10)
  const importanceFactors = {
    urgentKeywords: ['urgent', 'asap', 'important', 'deadline', 'critical', 'emergency'],
    highValueKeywords: ['opportunity', 'partnership', 'contract', 'deal', 'interested', 'purchase'],
    lowPriorityKeywords: ['newsletter', 'update', 'fyi', 'notification']
  };
  
  let importanceScore = 5; // Start at middle value
  
  // Adjust score based on keyword presence
  importanceScore += importanceFactors.urgentKeywords.filter(kw => content.includes(kw)).length * 1;
  importanceScore += importanceFactors.highValueKeywords.filter(kw => content.includes(kw)).length * 0.8;
  importanceScore -= importanceFactors.lowPriorityKeywords.filter(kw => content.includes(kw)).length * 0.8;
  
  // Adjust score based on highest category priority
  const categoryImportance = categories.find(c => c.name === topCategory.name)?.priority || 5;
  importanceScore = (importanceScore + categoryImportance) / 2;
  
  // Ensure importance is within 1-10 range
  importanceScore = Math.max(1, Math.min(10, Math.round(importanceScore)));
  
  // Generate summary
  let summary = body.length > 250 ? `${body.substring(0, 250)}...` : body;
  
  // Extract key points to improve summary
  const sentences = body.split(/[.!?]/).filter(s => s.trim().length > 0);
  if (sentences.length > 2) {
    const firstSentence = sentences[0].trim();
    const lastSentence = sentences[sentences.length - 1].trim();
    
    if (firstSentence.length + lastSentence.length < 250) {
      summary = `${firstSentence}... ${lastSentence}`;
    }
  }
  
  // Generate suggested actions
  const suggestedActions: string[] = [];
  
  // Common actions based on category
  if (topCategory.name === 'Meeting_Ready_Lead' || content.includes('meeting') || content.includes('call')) {
    suggestedActions.push('Schedule meeting');
  }
  
  if (topCategory.name === 'Question' || content.includes('?')) {
    suggestedActions.push('Answer question');
  }
  
  if (topCategory.name === 'Sales_Opportunity' || importanceScore >= 8) {
    suggestedActions.push('Prioritize response');
  }
  
  if (topCategory.name === 'Unsubscribe') {
    suggestedActions.push('Remove from list');
  }
  
  // If no specific actions were determined, add generic ones
  if (suggestedActions.length === 0) {
    if (importanceScore >= 7) {
      suggestedActions.push('Respond soon');
    } else if (importanceScore <= 3) {
      suggestedActions.push('Archive');
    } else {
      suggestedActions.push('Review message');
    }
  }
  
  // Determine appropriate Gmail labels
  const labels: string[] = [];
  
  // Primary category as label
  labels.push(topCategory.name);
  
  // Importance labels
  if (importanceScore >= 8) {
    labels.push('Priority');
  }
  if (importanceScore <= 3) {
    labels.push('Low_Priority');
  }
  
  // Additional contextual labels
  if (content.includes('meeting') || content.includes('schedule') || content.includes('calendar')) {
    labels.push('Needs_Scheduling');
  }
  
  if (content.includes('question') || content.includes('?')) {
    labels.push('Needs_Answer');
  }
  
  if (content.includes('receipt') || content.includes('invoice') || content.includes('payment')) {
    labels.push('Finance');
  }
  
  return {
    category: topCategory.name,
    importance: importanceScore,
    summary,
    suggestedActions,
    labels
  };
}

export class CategorizeEmailTool implements BaseTool<GmailMessage, EmailAnalysis> {
  name = 'email_categorizer';
  description = 'Analyzes and categorizes email content';
  private localLLM: OllamaClient | null = null;
  private categories: Map<string, { terms: string[]; priority: number }>;
  private importanceKeywords: {
    urgent: string[];
    highValue: string[];
    lowPriority: string[];
  };

  constructor(localLLM: OllamaClient | null = null) {
    this.localLLM = localLLM;
    
    // Initialize categories with relevant terms and priority values
    this.categories = new Map([
      ['Meeting_Ready_Lead', { 
        terms: ['meeting', 'schedule', 'call', 'discuss', 'appointment', 'availability', 'calendar', 'sync', 'connect', 'zoom', 'teams', 'meet'],
        priority: 8 
      }],
      ['Power', { 
        terms: ['decision maker', 'ceo', 'chief', 'director', 'vp', 'vice president', 'head of', 'budget', 'authority', 'approve', 'leadership'],
        priority: 9 
      }],
      ['Interested', { 
        terms: ['interested', 'tell me more', 'learn more', 'demo', 'pricing', 'consider', 'evaluation', 'trial', 'quote', 'proposal'],
        priority: 7 
      }],
      ['Obstacle', { 
        terms: ['problem', 'issue', 'concern', 'challenge', 'difficult', 'obstacle', 'not working', 'error', 'bug', 'broken', 'failed'],
        priority: 6 
      }],
      ['Not_Interested', { 
        terms: ['not interested', 'unsubscribe', 'remove', 'stop', 'no thanks', 'pass', 'decline', 'not now', 'not at this time'],
        priority: 3 
      }],
      ['OOO', { 
        terms: ['out of office', 'vacation', 'holiday', 'leave', 'away', 'return on', 'back on', 'unavailable', 'absence', 'auto-reply'],
        priority: 2 
      }],
      ['Question', { 
        terms: ['question', 'how do', 'can you', 'want to know', 'wondering', 'clarify', 'explain', 'what is', 'how is', 'help me understand'],
        priority: 5 
      }],
      ['Spam', { 
        terms: ['viagra', 'lottery', 'winner', 'inheritance', 'prince', 'bank transfer', 'urgent help', 'cryptocurrency', 'million dollars'],
        priority: 1 
      }]
    ]);
    
    // Keywords for importance scoring
    this.importanceKeywords = {
      urgent: ['urgent', 'asap', 'immediately', 'emergency', 'deadline', 'critical', 'important', 'priority', 'time-sensitive'],
      highValue: ['opportunity', 'revenue', 'partnership', 'contract', 'deal', 'sign', 'purchase', 'decision', 'agreement', 'interested'],
      lowPriority: ['newsletter', 'subscription', 'update', 'notification', 'fyi', 'marketing', 'announcement', 'promotion', 'offer']
    };
  }

  async run(email: GmailMessage): Promise<EmailAnalysis> {
    // Try to use local LLM if available
    if (this.localLLM) {
      try {
        const analysis = await analyzeEmailWithLocalLLM(
          this.localLLM,
          email.subject || '',
          email.body || email.snippet || ''
        );
        
        return analysis;
      } catch (error) {
        console.warn('Local LLM analysis failed, falling back to rule-based analysis:', error);
        // Continue to fallback analysis
      }
    }
    
    // Fall back to rule-based analysis
    const analysis = analyzeTextContent(
      email.subject || '',
      email.body || email.snippet || ''
    );
    
    return analysis;
  }

  /**
   * Categorize an email based on its content
   */
  public async categorize(
    subject: string,
    body: string,
    sender: string
  ): Promise<Categorization> {
    // If local LLM is available, use it for categorization
    if (this.localLLM) {
      try {
        console.log('Using local LLM for email categorization');
        const result = await this.localLLM.categorizeEmail(subject, body, sender);
        return result;
      } catch (error) {
        console.error('Local LLM categorization failed, falling back to rule-based:', error);
        // Fall back to rule-based categorization if LLM fails
      }
    }
    
    // Rule-based categorization as fallback
    console.log('Using rule-based categorization');
    return this.ruleBasedCategorization(subject, body, sender);
  }

  /**
   * Rule-based categorization algorithm
   */
  private ruleBasedCategorization(
    subject: string,
    body: string,
    sender: string
  ): Categorization {
    const combinedText = `${subject} ${body}`.toLowerCase();
    
    // Score each category based on term matches
    const categoryScores = new Map<string, number>();
    
    for (const [category, data] of this.categories.entries()) {
      let termMatches = 0;
      
      // Count how many terms from this category appear in the text
      for (const term of data.terms) {
        if (combinedText.includes(term.toLowerCase())) {
          termMatches++;
        }
      }
      
      // Calculate score based on matches and priority
      const score = termMatches * data.priority;
      categoryScores.set(category, score);
    }
    
    // Get the highest scoring category
    let highestScore = 0;
    let selectedCategory = 'Other';
    
    for (const [category, score] of categoryScores.entries()) {
      if (score > highestScore) {
        highestScore = score;
        selectedCategory = category;
      }
    }
    
    // Calculate importance score (1-10)
    const importanceScore = this.calculateImportanceScore(combinedText, selectedCategory);
    
    // Generate a summary
    const summary = this.generateSummary(subject, body);
    
    return {
      category: selectedCategory,
      importance: importanceScore,
      summary
    };
  }

  /**
   * Calculate importance score based on keywords and context
   */
  private calculateImportanceScore(text: string, category: string): number {
    // Start with a baseline score of 5
    let score = 5;
    
    // Adjust based on urgent keywords
    for (const term of this.importanceKeywords.urgent) {
      if (text.includes(term)) {
        score += 1.5;
      }
    }
    
    // Adjust based on high-value keywords
    for (const term of this.importanceKeywords.highValue) {
      if (text.includes(term)) {
        score += 1;
      }
    }
    
    // Adjust based on low-priority keywords
    for (const term of this.importanceKeywords.lowPriority) {
      if (text.includes(term)) {
        score -= 1;
      }
    }
    
    // Adjust based on category priority
    const categoryData = this.categories.get(category);
    if (categoryData) {
      // Normalize priority to a -2 to +2 adjustment
      const priorityAdjustment = (categoryData.priority - 5) / 2;
      score += priorityAdjustment;
    }
    
    // Clamp score between 1 and 10
    return Math.max(1, Math.min(10, Math.round(score)));
  }

  /**
   * Generate a brief summary of the email
   */
  private generateSummary(subject: string, body: string): string {
    // Simple summary generation - first 250 characters
    if (body.length <= 250) {
      return body;
    }
    
    // For longer emails, combine first and last parts
    const firstPart = body.substring(0, 100);
    const lastPart = body.substring(body.length - 100);
    return `${firstPart}... ${lastPart}`;
  }
}