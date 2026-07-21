import { useState, useRef, useCallback, useEffect } from 'react'
import { aiStream, type ChatMessage } from '../services/stream'

export type ChatMsg =
  | { id: string; role: 'user'; content: string }
  | { id: string; role: 'ai'; content: string }
  | { id: string; role: 'ai'; content: string; evaluation: { strengths: string[]; weaknesses: string[]; score: number } }

export function useStreamingChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: "Hi! I'm your AI interview coach 🤖 Ask me anything, or paste an answer and I'll evaluate it.",
    },
  ])
  const [currentStream, setCurrentStream] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pendingEval = useRef<Partial<{ strengths: string[]; weaknesses: string[]; score: number }> | null>(null)

  // Disconnect on unmount.
  useEffect(() => {
    return () => aiStream.disconnect()
  }, [])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return

    setError(null)
    setIsStreaming(true)
    setCurrentStream('')

    // Add the user message immediately.
    const userMsg: ChatMsg = { id: Date.now().toString(), role: 'user', content: text }
    setMessages((m) => [...m, userMsg])

    // Build context for the backend (last 10 messages).
    const context: ChatMessage[] = messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }))

    // Heuristic: if the message looks like an answer (longer), request evaluation too.
    const wantsEvaluation = text.length > 30

    try {
      await aiStream.streamChat(text, context, {
        onToken: (token) => {
          setCurrentStream((prev) => prev + token)
        },
        onDone: (messageId) => {
          const aiMsg: ChatMsg = {
            id: messageId ?? Date.now().toString() + '-ai',
            role: 'ai',
            content: currentStreamRef.current || '(empty response)',
            ...(pendingEval.current
              ? { evaluation: pendingEval.current as { strengths: string[]; weaknesses: string[]; score: number } }
              : {}),
          }
          setMessages((m) => [...m, aiMsg])
          setCurrentStream('')
          setIsStreaming(false)
          pendingEval.current = null
        },
        onError: (err) => {
          setError(err)
          setIsStreaming(false)
          setCurrentStream('')
          // Add an error message.
          setMessages((m) => [
            ...m,
            { id: Date.now().toString() + '-err', role: 'ai', content: `Sorry, I couldn't respond: ${err}` },
          ])
        },
        onEvaluation: (eval_) => {
          pendingEval.current = eval_
        },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed')
      setIsStreaming(false)
    }
  }, [isStreaming, messages])

  // Keep a ref to currentStream so onDone can read the latest value.
  const currentStreamRef = useRef('')
  useEffect(() => {
    currentStreamRef.current = currentStream
  }, [currentStream])

  return { messages, send, isStreaming, currentStream, error }
}
