import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, TextInput } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { X, Clock, Lightbulb, SkipForward, Check, ChevronRight, Flag } from 'lucide-react-native'
import { colors, gradients, shadows } from '../theme'
import type { SessionState, QuestionDto } from '../types/api'

export default function PracticeSessionScreen({
  sessionState,
  currentQuestion,
  onSubmitAnswer,
  onNext,
  onComplete,
  onAbandon,
  completing,
}: {
  sessionState: SessionState | null
  currentQuestion: QuestionDto | null
  onSubmitAnswer: (answer: string, selectedIdx: number | null, durationMs: number) => void
  onNext: () => void
  onComplete: () => void
  onAbandon?: () => void
  completing?: boolean
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(90)
  const [questionStart, setQuestionStart] = useState(Date.now())

  // Reset state when the question changes.
  useEffect(() => {
    setSelected(null)
    setTextAnswer('')
    setSubmitted(false)
    setSecondsLeft(90)
    setQuestionStart(Date.now())
  }, [currentQuestion?.id])

  // Countdown timer.
  useEffect(() => {
    if (submitted || secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [submitted, secondsLeft])

  if (!sessionState || !currentQuestion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.blue} />
        <Text style={styles.loadingText}>Loading question…</Text>
      </View>
    )
  }

  const idx = sessionState.currentQuestionIndex
  const total = sessionState.totalQuestions
  const isLast = idx >= total - 1
  const isMcq = currentQuestion.options && currentQuestion.options.length > 0
  const durationMs = Date.now() - questionStart

  const handleSubmit = () => {
    if (submitted) return
    const answer = isMcq ? currentQuestion.options[selected ?? -1] ?? '' : textAnswer
    onSubmitAnswer(answer, isMcq ? selected : null, durationMs)
    setSubmitted(true)
  }

  const handleNext = () => {
    if (isLast) {
      onComplete()
    } else {
      onNext()
    }
  }

  return (
    <View style={styles.container}>
      {/* Ambient gradient */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[styles.blob, { left: -80, top: -80, backgroundColor: colors.blue, opacity: 0.25 }]} />
        <View style={[styles.blob, { right: -60, top: 160, backgroundColor: colors.orange, opacity: 0.2 }]} />
      </View>

      <View style={{ flex: 1, position: 'relative' }}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={onAbandon}>
            <X size={18} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>Question {idx + 1} of {total}</Text>
              <Text style={styles.timerText}>{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</Text>
            </View>
            <View style={styles.progressBar}>
              {Array.from({ length: total }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressSeg,
                    i < idx ? { backgroundColor: colors.blue } : i === idx ? { backgroundColor: colors.amber } : { backgroundColor: 'rgba(255,255,255,0.6)' },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
          {/* Question glass card */}
          <View style={styles.questionCard}>
            <View style={styles.tagRow}>
              <View style={styles.tagBlue}><Text style={styles.tagBlueText}>{isMcq ? 'Multiple choice' : 'Open-ended'}</Text></View>
              <View style={styles.tagAmber}><Text style={styles.tagAmberText}>{currentQuestion.difficulty}</Text></View>
              <Pressable style={styles.reportBtn}><Flag size={12} color={colors.textSubtle} /><Text style={styles.reportText}>Report</Text></Pressable>
            </View>
            <Text style={styles.questionText}>{currentQuestion.title || currentQuestion.content}</Text>
          </View>

          {/* Options (MCQ) */}
          {isMcq ? (
            <View style={{ gap: 10, marginTop: 12 }}>
              {currentQuestion.options.map((opt, i) => {
                const isSelected = selected === i
                const isCorrect = submitted && i === (currentQuestion as any).answerIndex
                const isWrong = submitted && isSelected && i !== (currentQuestion as any).answerIndex
                return (
                  <Pressable
                    key={i}
                    onPress={() => !submitted && setSelected(i)}
                    disabled={submitted}
                    style={({ pressed }) => [
                      styles.optionBtn,
                      isSelected && styles.optionSelected,
                      isCorrect && styles.optionCorrect,
                      isWrong && styles.optionWrong,
                      { opacity: pressed ? 0.97 : 1 },
                    ]}
                  >
                    <View style={[styles.optionLetter, isSelected ? styles.optionLetterActive : null]}>
                      <Text style={[styles.optionLetterText, isSelected && { color: '#fff' }]}>{String.fromCharCode(65 + i)}</Text>
                    </View>
                    <Text style={[styles.optionText, isSelected && { color: '#fff' }]}>{opt}</Text>
                    {isSelected && <Check size={16} color="#fff" />}
                  </Pressable>
                )
              })}
            </View>
          ) : (
            <View style={{ marginTop: 12 }}>
              <TextInput
                style={styles.textAnswer}
                placeholder="Type your answer…"
                placeholderTextColor={colors.textSubtle}
                value={textAnswer}
                onChangeText={setTextAnswer}
                multiline
                editable={!submitted}
              />
            </View>
          )}

          {/* Hint */}
          {currentQuestion.hint && (
            <Pressable style={styles.hintBox}>
              <Lightbulb size={16} color={colors.warning} />
              <Text style={styles.hintText}>{currentQuestion.hint}</Text>
              <ChevronRight size={16} color={colors.warning} />
            </Pressable>
          )}
        </ScrollView>

        {/* Bottom actions */}
        <View style={styles.bottomActions}>
          <Pressable style={styles.skipBtn} onPress={() => { if (!submitted) onSubmitAnswer('', null, durationMs); setSubmitted(true); }}>
            <SkipForward size={16} color={colors.textMuted} />
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
          {!submitted ? (
            <Pressable
              onPress={handleSubmit}
              disabled={isMcq && selected === null && !textAnswer}
              style={({ pressed }) => [{ flex: 1, opacity: (isMcq && selected === null) ? 0.5 : pressed ? 0.9 : 1 }]}
            >
              <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
                <Text style={styles.ctaText}>Submit answer</Text>
                <ChevronRight size={16} color="#fff" />
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable onPress={handleNext} disabled={completing} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.9 : 1 }]}>
              <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
                {completing ? <ActivityIndicator color="#fff" size="small" /> : (
                  <>
                    <Text style={styles.ctaText}>{isLast ? 'See results' : 'Next question'}</Text>
                    <ChevronRight size={16} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef4ff' },
  loadingContainer: { flex: 1, backgroundColor: '#eef4ff', alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 13, color: colors.textSubtle, marginTop: 12 },
  blob: { position: 'absolute', width: 288, height: 288, borderRadius: 144 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8, paddingTop: 4 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 11, fontWeight: '700', color: colors.ink },
  timerText: { fontSize: 11, fontWeight: '700', color: colors.blue },
  progressBar: { flexDirection: 'row', gap: 4, marginTop: 6 },
  progressSeg: { flex: 1, height: 6, borderRadius: 3 },
  questionCard: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 16, ...shadows.soft },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagBlue: { backgroundColor: 'rgba(46,139,238,0.1)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  tagBlueText: { fontSize: 10, fontWeight: '700', color: colors.blue },
  tagAmber: { backgroundColor: 'rgba(242,201,76,0.15)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  tagAmberText: { fontSize: 10, fontWeight: '700', color: colors.warning },
  reportBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 },
  reportText: { fontSize: 10, fontWeight: '600', color: colors.textSubtle },
  questionText: { fontSize: 16, fontWeight: '800', color: colors.ink, marginTop: 10, lineHeight: 22 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.7)', padding: 14 },
  optionSelected: { borderColor: 'transparent', ...shadows.soft },
  optionCorrect: { borderColor: colors.success, backgroundColor: colors.successBg },
  optionWrong: { borderColor: colors.danger, backgroundColor: colors.dangerBg },
  optionLetter: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  optionLetterActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  optionLetterText: { fontSize: 12, fontWeight: '800', color: colors.textMuted },
  optionText: { flex: 1, fontSize: 13, fontWeight: '500', color: colors.ink, lineHeight: 18 },
  textAnswer: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', padding: 14, fontSize: 13, color: colors.ink, minHeight: 100, textAlignVertical: 'top' },
  hintBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(242,201,76,0.5)', borderStyle: 'dashed', backgroundColor: '#fff8ec', padding: 12, marginTop: 12 },
  hintText: { flex: 1, fontSize: 12, fontWeight: '500', color: '#3b424c' },
  bottomActions: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },
  skipBtn: { height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  skipText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  cta: { height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, ...shadows.soft },
  ctaText: { fontSize: 14, fontWeight: '800', color: '#fff' },
})
