import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronLeft, Phone, MoreVertical, Plus, Mic, Sparkles, CheckCircle2 } from 'lucide-react-native'
import { Avatar } from '../components/primitives'
import { StreamingText } from '../components/StreamingText'
import { useStreamingChat, type ChatMsg } from '../hooks/useStreamingChat'
import { colors, gradients, shadows } from '../theme'

export default function TutorScreen({ onBack }: { onBack?: () => void }) {
  const { messages, send, isStreaming, currentStream } = useStreamingChat()
  const [input, setInput] = useState('')
  const listRef = useRef<FlatList>(null)

  // Auto-scroll to bottom when messages or stream update.
  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true })
  }, [messages, currentStream])

  const handleSend = () => {
    const text = input.trim()
    if (!text || isStreaming) return
    send(text)
    setInput('')
  }

  const renderItem = ({ item }: { item: ChatMsg }) => {
    if (item.role === 'user') {
      return (
        <View style={styles.userBubbleWrap}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{item.content}</Text>
          </View>
        </View>
      )
    }
    if ('evaluation' in item) {
      return (
        <View style={styles.aiBubbleWrap}>
          <View style={styles.aiBubble}>
            <Text style={styles.aiText}>{item.content}</Text>
            <View style={styles.evalHeader}>
              <CheckCircle2 size={16} color={colors.success} />
              <Text style={styles.evalHeaderText}>Evaluation · {item.evaluation.score}/100</Text>
            </View>
            {item.evaluation.strengths.length > 0 && (
              <>
                <Text style={styles.evalLabelGreen}>✓ Strengths</Text>
                {item.evaluation.strengths.map((s, i) => (
                  <Text key={i} style={styles.evalItem}>• {s}</Text>
                ))}
              </>
            )}
            {item.evaluation.weaknesses.length > 0 && (
              <>
                <Text style={styles.evalLabelAmber}>⚠ Areas to improve</Text>
                {item.evaluation.weaknesses.map((s, i) => (
                  <Text key={i} style={styles.evalItem}>• {s}</Text>
                ))}
              </>
            )}
          </View>
        </View>
      )
    }
    return (
      <View style={styles.aiBubbleWrap}>
        <View style={styles.aiBubble}>
          <Text style={styles.aiText}>{item.content}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
          {onBack && (
            <Pressable style={styles.headerBtn} onPress={onBack}><ChevronLeft size={20} color="#fff" /></Pressable>
          )}
          <View style={{ position: 'relative' }}>
            <Avatar name="JobPrep AI" size={40} ring />
            <View style={styles.onlineDot} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.headerName}>JobPrep AI</Text>
              <Sparkles size={14} color={colors.gold} />
            </View>
            <Text style={styles.headerSub}>{isStreaming ? 'typing…' : 'Online · your interview coach'}</Text>
          </View>
          <Pressable style={styles.headerBtn}><Phone size={17} color="#fff" /></Pressable>
          <Pressable style={styles.headerBtn}><MoreVertical size={17} color="#fff" /></Pressable>
        </View>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isStreaming ? (
            <View style={styles.aiBubbleWrap}>
              <View style={styles.aiBubble}>
                {currentStream ? (
                  <StreamingText text={currentStream} active={true} />
                ) : (
                  <View style={styles.typingRow}>
                    {[0, 1, 2].map((i) => (
                      <View key={i} style={[styles.typingDot, { backgroundColor: colors.blue, opacity: 0.5 }]} />
                    ))}
                  </View>
                )}
              </View>
            </View>
          ) : null
        }
      />

      {/* Quick chips */}
      <ScrollView style={{ maxHeight: 40 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }} horizontal showsHorizontalScrollIndicator={false}>
        {['Explain like I\'m new 🙋', 'Give me a hint 💡', 'Mock interview me 🎤', 'Harder question 🔥'].map((c, i) => (
          <Pressable key={i} style={styles.chip} onPress={() => !isStreaming && send(c)}>
            <Text style={styles.chipText}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Input bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <Pressable style={styles.inputIconBtn}><Plus size={20} color={colors.blue} /></Pressable>
          <TextInput
            style={styles.input}
            placeholder="Ask anything…"
            placeholderTextColor={colors.textSubtle}
            value={input}
            onChangeText={setInput}
            multiline
            editable={!isStreaming}
          />
          <Pressable style={styles.sendBtn} onPress={handleSend} disabled={!input.trim() || isStreaming}>
            {isStreaming ? <ActivityIndicator color="#fff" size="small" /> : <Mic size={18} color="#fff" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fb' },
  header: { ...shadows.soft },
  headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerName: { fontSize: 15, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
  userBubbleWrap: { alignItems: 'flex-end' },
  userBubble: { maxWidth: '78%', borderRadius: 16, borderBottomRightRadius: 6, paddingHorizontal: 14, paddingVertical: 10, overflow: 'hidden', ...shadows.soft },
  userText: { fontSize: 13, lineHeight: 18, color: '#fff' },
  aiBubbleWrap: { alignItems: 'flex-start' },
  aiBubble: { maxWidth: '82%', borderRadius: 16, borderBottomLeftRadius: 6, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, ...shadows.card },
  aiText: { fontSize: 13, lineHeight: 18, color: colors.ink },
  evalHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 4 },
  evalHeaderText: { fontSize: 12, fontWeight: '700', color: colors.success },
  evalLabelGreen: { fontSize: 11, fontWeight: '700', color: colors.success, marginTop: 6, marginBottom: 2 },
  evalLabelAmber: { fontSize: 11, fontWeight: '700', color: colors.warning, marginTop: 6, marginBottom: 2 },
  evalItem: { fontSize: 12, color: '#3b424c', lineHeight: 16 },
  typingRow: { flexDirection: 'row', gap: 6, paddingVertical: 4 },
  typingDot: { width: 8, height: 8, borderRadius: 4 },
  chip: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(46,139,238,0.2)' },
  chipText: { fontSize: 11, fontWeight: '600', color: colors.blue },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingBottom: 24, paddingTop: 8 },
  inputIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 13, color: colors.ink, maxHeight: 80, ...shadows.card },
  sendBtn: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', ...shadows.soft },
})
