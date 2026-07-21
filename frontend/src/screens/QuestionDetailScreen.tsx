import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Bookmark, Share2, ChevronDown, Lightbulb, NotebookPen, History, ChevronRight, ThumbsUp, Sparkles } from 'lucide-react-native'
import { ScreenHeader, DifficultyBadge, GradientButton, ProgressRing } from '../components/primitives'
import { useQuestion } from '../hooks/queries'
import { colors, gradients, shadows } from '../theme'

export default function QuestionDetailScreen({
  questionId,
  onBack,
  onPractice,
}: {
  questionId: string
  onBack?: () => void
  onPractice?: () => void
}) {
  const { data: q, isLoading } = useQuestion(questionId)
  const [notesOpen, setNotesOpen] = useState(true)

  if (isLoading || !q) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading question…</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Question"
        subtitle={q.category}
        onBack={onBack}
        right={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={styles.iconBtn}><Bookmark size={17} color={colors.ink} /></Pressable>
            <Pressable style={styles.iconBtn}><Share2 size={17} color={colors.ink} /></Pressable>
          </View>
        }
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Question card */}
        <View style={styles.card}>
          <View style={styles.tagRow}>
            <DifficultyBadge level={q.difficulty as 'Easy' | 'Medium' | 'Hard'} />
            <View style={styles.tagType}><Text style={styles.tagTypeText}>{q.options.length > 0 ? 'Multiple choice' : 'Open-ended'}</Text></View>
            <Text style={styles.timeEst}>⏱ {Math.round(q.timeEstimate / 60)} min</Text>
          </View>
          <Text style={styles.questionText}>{q.title || q.content}</Text>
          <View style={styles.attemptRow}>
            <ProgressRing progress={60} size={28} stroke={3}>
              <Text style={styles.ringPct}>60%</Text>
            </ProgressRing>
            <Text style={styles.attemptMeta}>Attempted 5 times · best score 80%</Text>
          </View>
        </View>

        {/* Model answer */}
        <View style={styles.modelCard}>
          <View style={styles.modelHeader}>
            <LinearGradient colors={gradients.blueTeal as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Lightbulb size={16} color="#fff" />
              <Text style={styles.modelHeaderText}>Model answer</Text>
              <Sparkles size={16} color="#fff" style={{ marginLeft: 'auto' }} />
            </LinearGradient>
          </View>
          <View style={{ padding: 16 }}>
            {(q.options.length > 0 ? q.options : ['Clarify requirements', 'Core approach', 'Trade-offs', 'Optimization']).map((step, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <View style={styles.stepNum}>
                  <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
            <View style={styles.helpfulRow}>
              <Text style={styles.helpfulLabel}>Was this helpful?</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable style={styles.thumbBtn}><ThumbsUp size={14} color={colors.success} /></Pressable>
                <Pressable style={[styles.thumbBtn, { transform: [{ rotate: '180deg' }] }]}><ThumbsUp size={14} color={colors.textSubtle} /></Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Notes */}
        <Pressable style={styles.notesHeader} onPress={() => setNotesOpen((o) => !o)}>
          <NotebookPen size={16} color={colors.blue} />
          <Text style={styles.notesTitle}>My notes</Text>
          <View style={styles.notesCount}><Text style={styles.notesCountText}>3</Text></View>
          <ChevronDown size={16} color={colors.textSubtle} style={{ marginLeft: 'auto', transform: notesOpen ? [{ rotate: '180deg' }] : [] }} />
        </Pressable>
        {notesOpen && (
          <View style={styles.notesBody}>
            <View style={styles.noteItem}>
              <Text style={styles.noteDate}>Yesterday</Text>
              <Text style={styles.noteText}>Remember to mention prioritization — push > SMS > email. Don't forget idempotency keys!</Text>
            </View>
            <Pressable style={styles.addNoteBtn}>
              <Text style={styles.addNoteText}>+ Add a note</Text>
            </Pressable>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.sectionHeader}>
          <History size={16} color={colors.blue} />
          <Text style={styles.sectionTitle}>Answer timeline</Text>
        </View>
        <View style={styles.timelineCard}>
          {[
            { date: 'Today', score: 80, note: 'Strong on resilience, mention throughput numbers next time' },
            { date: '3 days ago', score: 65, note: 'Missed idempotency & DLQ' },
            { date: '1 week ago', score: 45, note: 'Forgot to clarify requirements' },
          ].map((t, i, arr) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12, paddingBottom: i < arr.length - 1 ? 16 : 0 }}>
              {i < arr.length - 1 && <View style={styles.timelineLine} />}
              <View style={styles.timelineDot}>
                <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={styles.timelineScore}>{t.score}</Text>
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineDate}>{t.date}</Text>
                <Text style={styles.timelineNote}>{t.note}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Related */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Related questions</Text>
        </View>
        <View style={{ gap: 8, marginTop: 8 }}>
          {['Design a rate limiter for an API gateway', 'Design a distributed cache (Redis-like)', 'Design a chat application like WhatsApp'].map((rq, i) => (
            <Pressable key={i} style={({ pressed }) => [styles.relatedRow, { opacity: pressed ? 0.97 : 1 }]}>
              <View style={styles.relatedIcon}><Text style={{ fontSize: 16 }}>🔗</Text></View>
              <Text style={styles.relatedText} numberOfLines={1}>{rq}</Text>
              <ChevronRight size={16} color="#cdd2d9" />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.stickyCta}>
        <Pressable onPress={onPractice} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
          <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            <Text style={styles.ctaText}>Practice this question</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 13, color: colors.textSubtle },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadows.card },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 16, ...shadows.card },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagType: { backgroundColor: '#f5f7fa', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  tagTypeText: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  timeEst: { marginLeft: 'auto', fontSize: 10, fontWeight: '500', color: colors.textSubtle },
  questionText: { fontSize: 17, fontWeight: '800', color: colors.ink, marginTop: 12, lineHeight: 22 },
  attemptRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  ringPct: { fontSize: 8, fontWeight: '800', color: colors.ink },
  attemptMeta: { fontSize: 11, color: colors.textSubtle },
  modelCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginTop: 16, ...shadows.card },
  modelHeader: { overflow: 'hidden', borderRadius: 8 },
  modelHeaderText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  stepNum: { width: 20, height: 20, borderRadius: 10, overflow: 'hidden' },
  stepNumText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  stepText: { flex: 1, fontSize: 12.5, color: '#3b424c', lineHeight: 18 },
  helpfulRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, backgroundColor: '#f5f7fa', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  helpfulLabel: { fontSize: 11, fontWeight: '500', color: colors.textMuted },
  thumbBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadows.card },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginTop: 16, ...shadows.card },
  notesTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  notesCount: { backgroundColor: '#f5f7fa', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  notesCountText: { fontSize: 10, fontWeight: '700', color: colors.textSubtle },
  notesBody: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 8, ...shadows.card },
  noteItem: { backgroundColor: '#fff8ec', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(242,201,76,0.3)' },
  noteDate: { fontSize: 11, fontWeight: '700', color: colors.warning },
  noteText: { fontSize: 12, color: '#3b424c', marginTop: 2, lineHeight: 18 },
  addNoteBtn: { marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: '#cdd2d9', borderStyle: 'dashed', paddingVertical: 10, alignItems: 'center' },
  addNoteText: { fontSize: 12, fontWeight: '600', color: colors.textSubtle },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, marginTop: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  timelineCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, ...shadows.card },
  timelineLine: { position: 'absolute', left: 15, top: 32, width: 1, height: '100%', backgroundColor: '#eef1f5' },
  timelineDot: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden' },
  timelineScore: { fontSize: 11, fontWeight: '800', color: '#fff' },
  timelineDate: { fontSize: 12, fontWeight: '700', color: colors.ink },
  timelineNote: { fontSize: 11, color: colors.textMuted, marginTop: 2, lineHeight: 16 },
  relatedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12, ...shadows.card },
  relatedIcon: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#f5f7fa', alignItems: 'center', justifyContent: 'center' },
  relatedText: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.ink },
  stickyCta: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16, backgroundColor: 'rgba(251,252,254,0.95)' },
  cta: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#fff' },
})
