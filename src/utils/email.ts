// Email utility functions
export function extractDomain(email: string): string | null {
  try {
    const match = email.match(/@([^>]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function extractCampaignId(subject: string, body?: string): string {
  const campaignIdRegex = /campaign[_-]id[_-]([a-zA-Z0-9]+)/i;
  const match = body?.match(campaignIdRegex) || subject.match(campaignIdRegex);
  return match?.[1] || 'default-campaign';
}

export function formatEmailBody(greeting: string, content: string, closing: string): string {
  return `${greeting}\n\n${content}\n\n${closing}`;
}

export function getSenderName(from: string): string {
  return from.split('<')[0].trim();
}