import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function useAIStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your AI interview tutor. Ask me anything about system design, algorithms, or behavioral questions.",
      isStreaming: false,
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    const aiMsgId = `ai-${Date.now()}`;
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setIsStreaming(true);

    abortControllerRef.current = new AbortController();

    try {
      const baseUrl = Platform.OS === 'android' 
        ? 'http://10.0.2.2:8080' 
        : 'http://localhost:8080';

      const token = await SecureStore.getItemAsync('access_token');

      const response = await fetch(`${baseUrl}/api/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text, history: messages.slice(-6) }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // Parse SSE format: data: {...} or raw text chunks
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content ?? '';
              accumulated += delta;
            } catch {
              // Fallback: treat as raw text if not JSON
              accumulated += data;
            }
          } else if (line.trim()) {
            accumulated += line;
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, content: accumulated } : m
          )
        );
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, content: accumulated, isStreaming: false } : m
        )
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, content: 'Sorry, I encountered an error. Please try again.', isStreaming: false }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [messages]);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  }, []);

  return { messages, isStreaming, sendMessage, abort };
}
