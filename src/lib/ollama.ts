/**
 * Ollama API Integration for Local LLM Support
 * This module provides integration with Ollama to enable local LLM processing
 */

interface OllamaOptions {
  model: string;
  baseUrl: string;
  temperature?: number;
}

export class OllamaClient {
  private model: string;
  private baseUrl: string;
  private temperature: number;
  private static instance: OllamaClient | null = null;

  private constructor(options: OllamaOptions) {
    this.model = options.model || 'llama3';
    this.baseUrl = options.baseUrl || 'http://localhost:11434';
    this.temperature = options.temperature || 0.7;
  }

  public static getInstance(options?: OllamaOptions): OllamaClient {
    if (!OllamaClient.instance && options) {
      OllamaClient.instance = new OllamaClient(options);
    } else if (!OllamaClient.instance) {
      // Default initialization
      OllamaClient.instance = new OllamaClient({
        model: 'llama3',
        baseUrl: 'http://localhost:11434',
        temperature: 0.7
      });
    } else if (options) {
      // Update existing instance if options provided
      OllamaClient.instance.model = options.model || OllamaClient.instance.model;
      OllamaClient.instance.baseUrl = options.baseUrl || OllamaClient.instance.baseUrl;
      OllamaClient.instance.temperature = options.temperature ?? OllamaClient.instance.temperature;
    }
    
    return OllamaClient.instance;
  }

  /**
   * Check if Ollama server is available
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Ollama server check failed:', error);
      return false;
    }
  }

  /**
   * Generate a text response from the LLM
   */
  public async generate(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          system: systemPrompt || '',
          temperature: this.temperature,
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Ollama generation failed:', error);
      throw new Error(`Failed to generate response: ${error}`);
    }
  }

  /**
   * Analyze and categorize an email using the local LLM
   */
  public async categorizeEmail(
    subject: string, 
    body: string, 
    sender: string
  ): Promise<{ category: string; importance: number; summary: string }> {
    const prompt = `
    Analyze this email and return a JSON object with these fields:
    - category: Choose from Meeting_Ready_Lead, Power, Interested, Obstacle, Not_Interested, Question, Spam, Other
    - importance: A number from 1-10 indicating importance
    - summary: A 1-2 sentence summary of the email content
    
    EMAIL:
    From: ${sender}
    Subject: ${subject}
    Body: ${body}
    `;
    
    try {
      const response = await this.generate(prompt);
      // Try to parse JSON from the response
      try {
        const parsed = JSON.parse(response);
        return {
          category: parsed.category || 'Other',
          importance: parsed.importance || 5,
          summary: parsed.summary || 'No summary available'
        };
      } catch (parseError) {
        console.error('Failed to parse LLM response as JSON:', parseError);
        // Fallback to defaults with the raw response as summary
        return {
          category: 'Other',
          importance: 5,
          summary: response.substring(0, 200) + '...'
        };
      }
    } catch (error) {
      console.error('Email categorization failed:', error);
      throw error;
    }
  }

  /**
   * Generate a response to an email
   */
  public async generateEmailResponse(
    originalSubject: string,
    originalBody: string,
    sender: string,
    category: string,
    tone: 'professional' | 'friendly' | 'concise' = 'professional'
  ): Promise<string> {
    const systemPrompt = `
    You are an AI assistant helping to draft email responses. 
    Generate a ${tone} response to the email below.
    The email is categorized as "${category}".
    Keep your response relevant, helpful, and appropriate for business communication.
    `;
    
    const prompt = `
    Original email:
    From: ${sender}
    Subject: ${originalSubject}
    Body: ${originalBody}
    
    Generate a response email:
    `;
    
    try {
      return await this.generate(prompt, systemPrompt);
    } catch (error) {
      console.error('Email response generation failed:', error);
      throw error;
    }
  }
}

/**
 * Helper function to get the local LLM client
 * Returns null if the client is not available
 */
export async function getLocalLLMClient(): Promise<OllamaClient | null> {
  try {
    const client = OllamaClient.getInstance();
    const isAvailable = await client.isAvailable();
    
    return isAvailable ? client : null;
  } catch (error) {
    console.error('Failed to initialize local LLM client:', error);
    return null;
  }
} 