import apiClient from './apiClient';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  feedback?: 'up' | 'down' | null;
}

export interface ChatContext {
  questionId?: string;
  sessionId?: string;
  topic?: string;
  userAnswer?: string;
  correctAnswer?: string;
}

export interface SendMessageRequest {
  message: string;
  context?: ChatContext;
  history?: ChatMessage[];
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export const aiService = {
  async sendMessage(req: SendMessageRequest, signal?: AbortSignal): Promise<ReadableStream<Uint8Array> | null> {
    const response = await fetch(`${apiClient.defaults.baseURL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getToken()}`,
      },
      body: JSON.stringify(req),
      signal, // Improvement: Support aborting generation
    });
    return response.body;
  },

  async getHint(context: ChatContext): Promise<{ hint: string }> {
    const { data } = await apiClient.post('/ai/hint', { context });
    return data;
  },

  async getExplanation(context: ChatContext): Promise<{ explanation: string }> {
    const { data } = await apiClient.post('/ai/explain', { context });
    return data;
  },

  async submitFeedback(messageId: string, feedback: 'up' | 'down'): Promise<void> {
    await apiClient.post('/ai/feedback', { messageId, feedback });
  },
};

// Helper to get token from memory/store
async function getToken(): Promise<string> {
  const { tokenStorage } = await import('../utils/secureToken');
  return (await tokenStorage.getAccess()) || '';
}
