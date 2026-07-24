import { Platform } from 'react-native'
import EventSource, { EventSourceEvent } from 'react-native-sse'
import { storage } from './storage'

const SSE_BASE = Platform.select({
  android: 'http://10.0.2.2:8089/api/ai/stream',
  ios: 'http://localhost:8089/api/ai/stream',
  default: 'http://10.0.2.2:8089/api/ai/stream',
}) as string

export type StreamToken = { type: 'token'; content: string }
export type StreamDone = { type: 'done'; messageId?: string }
export type StreamError = { type: 'error'; message: string }
export type StreamEvaluation = {
  type: 'evaluation'
  strengths: string[]
  weaknesses: string[]
  score: number
  source?: string
}
export type StreamMessage = StreamToken | StreamDone | StreamError | StreamEvaluation

export type ChatMessage = { role: 'user' | 'ai'; content: string }

type StreamCallbacks = {
  onToken: (token: string) => void
  onDone?: (messageId?: string) => void
  onError?: (error: string) => void
  onEvaluation?: (eval_: { strengths: string[]; weaknesses: string[]; score: number; source?: string }) => void
}

export class AiStreamClient {
  private es: EventSource | null = null

  /** Send a chat message and stream the response via SSE. */
  async streamChat(message: string, context: ChatMessage[], callbacks: StreamCallbacks): Promise<void> {
    this.disconnect() // Ensure any previous stream is closed

    const token = await storage.getAccessToken()
    
    this.es = new EventSource(SSE_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ type: 'chat', message, context }),
    })

    this.setupListeners(this.es, callbacks)
  }

  /** Send an evaluation request (non-streaming SSE endpoint, returns structured result). */
  async evaluate(
    question: string,
    answer: string,
    category: string,
    callbacks: { onEvaluation: (e: { strengths: string[]; weaknesses: string[]; score: number; source?: string }) => void; onError?: (e: string) => void }
  ): Promise<void> {
    this.disconnect()

    const token = await storage.getAccessToken()
    
    this.es = new EventSource(SSE_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ type: 'evaluate', question, answer, category }),
    })

    this.setupListeners(this.es, {
      onToken: () => {},
      onEvaluation: callbacks.onEvaluation,
      onError: callbacks.onError,
      onDone: () => this.disconnect()
    })
  }

  private setupListeners(es: EventSource, callbacks: StreamCallbacks) {
    es.addEventListener('message', (event: EventSourceEvent<any> | MessageEvent) => {
      try {
        const data = (event as any).data
        if (!data) return
        
        const msg: StreamMessage = JSON.parse(data)
        switch (msg.type) {
          case 'token':
            callbacks.onToken(msg.content)
            break
          case 'done':
            callbacks.onDone?.(msg.messageId)
            this.disconnect()
            break
          case 'error':
            callbacks.onError?.(msg.message)
            this.disconnect()
            break
          case 'evaluation':
            callbacks.onEvaluation?.({
              strengths: msg.strengths,
              weaknesses: msg.weaknesses,
              score: msg.score,
              source: msg.source,
            })
            this.disconnect()
            break
        }
      } catch {
        // Ignore malformed messages
      }
    })

    es.addEventListener('error', () => {
      callbacks.onError?.('Stream connection lost')
      this.disconnect()
    })
  }

  /** Close the connection. */
  disconnect() {
    this.es?.close()
    this.es = null
  }
}

/** Singleton client. */
export const aiStream = new AiStreamClient()
