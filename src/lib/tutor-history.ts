export interface TutorMessage {
  role: 'user' | 'assistant';
  content: string;
  failed?: boolean;
}

// Keep room for the platform instructions and a 4,000-character question
// within the gateway's 16,000-character prompt limit.
export function tutorHistory(messages: TutorMessage[]): string {
  return messages.filter(message => !message.failed).slice(-6)
    .map(message => `${message.role === 'user' ? 'User' : 'Tutor'}: ${message.content}`)
    .join('\n').slice(-6000);
}

export function failedTutorTurn(messages: TutorMessage[], error: string): TutorMessage[] {
  return [...messages.map((message, index) => index === messages.length - 1
    ? { ...message, failed: true } : message), { role: 'assistant', content: error, failed: true }];
}
