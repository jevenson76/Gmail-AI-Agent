import { GmailAPI } from '../../api/gmail';

/**
 * Tool to manage Gmail labels and apply them to emails
 */
export class LabelManagerTool {
  private gmailAPI: GmailAPI;
  private labelCache: Map<string, string> = new Map();
  private labelCacheLoaded: boolean = false;

  constructor(gmailAPI: GmailAPI) {
    this.gmailAPI = gmailAPI;
  }

  /**
   * Apply labels to an email based on its category and importance
   */
  public async applyLabels(
    emailId: string,
    category: string,
    importance: number
  ): Promise<string[]> {
    try {
      // Ensure label cache is loaded
      if (!this.labelCacheLoaded) {
        await this.loadLabelCache();
      }
      
      // Generate labels based on category and importance
      const labelsToApply = this.generateLabels(category, importance);
      
      // Apply each label
      const appliedLabels: string[] = [];
      
      for (const labelName of labelsToApply) {
        // Get or create label ID
        const labelId = await this.getOrCreateLabel(labelName);
        
        if (labelId) {
          // Apply label to the email
          await this.gmailAPI.addLabel(emailId, labelId);
          appliedLabels.push(labelName);
        }
      }
      
      return appliedLabels;
    } catch (error) {
      console.error('Error applying labels:', error);
      return [];
    }
  }

  /**
   * Generate labels based on email category and importance
   */
  private generateLabels(category: string, importance: number): string[] {
    const labels: string[] = [];
    
    // Add category label
    labels.push(`Category_${category}`);
    
    // Add importance label
    if (importance >= 8) {
      labels.push('Priority_High');
    } else if (importance >= 5) {
      labels.push('Priority_Medium');
    } else {
      labels.push('Priority_Low');
    }
    
    // Add context-specific labels
    switch (category) {
      case 'Meeting_Ready_Lead':
        labels.push('Action_Schedule');
        break;
      case 'Power':
        labels.push('Action_Follow_Up');
        labels.push('VIP');
        break;
      case 'Interested':
        labels.push('Action_Follow_Up');
        break;
      case 'Question':
        labels.push('Action_Reply');
        break;
      case 'Obstacle':
        labels.push('Action_Resolve');
        break;
      case 'OOO':
        labels.push('Auto_Reply');
        break;
      case 'Spam':
        labels.push('Junk');
        break;
    }
    
    // Make sure labels follow Gmail's naming conventions
    return labels.map(label => this.normalizeLabel(label));
  }

  /**
   * Load existing Gmail labels into cache
   */
  private async loadLabelCache(): Promise<void> {
    try {
      const labels = await this.gmailAPI.listLabels();
      
      this.labelCache.clear();
      for (const label of labels) {
        if (label.name && label.id) {
          this.labelCache.set(label.name, label.id);
        }
      }
      
      this.labelCacheLoaded = true;
    } catch (error) {
      console.error('Error loading label cache:', error);
      throw error;
    }
  }

  /**
   * Get a label ID from cache or create a new label
   */
  private async getOrCreateLabel(labelName: string): Promise<string | null> {
    try {
      // Check if the label exists in cache
      if (this.labelCache.has(labelName)) {
        return this.labelCache.get(labelName) || null;
      }
      
      // If not, create the label
      const label = await this.gmailAPI.createLabel(labelName);
      
      if (label && label.id) {
        // Add to cache
        this.labelCache.set(labelName, label.id);
        return label.id;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting/creating label ${labelName}:`, error);
      return null;
    }
  }

  /**
   * Normalize label name to follow Gmail's label naming conventions
   */
  private normalizeLabel(label: string): string {
    // Replace spaces with underscores
    let normalized = label.replace(/\s+/g, '_');
    
    // Remove special characters
    normalized = normalized.replace(/[^\w-]/g, '');
    
    // Ensure it's not too long (Gmail has a 40 character limit)
    if (normalized.length > 40) {
      normalized = normalized.substring(0, 40);
    }
    
    return normalized;
  }
} 