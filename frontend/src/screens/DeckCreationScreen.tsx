// @ts-nocheck
import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronLeft, Check, Plus, Trash2, GripVertical, Sparkles, Eye, ChevronRight, Tag, FileQuestion, Trophy } from 'lucide-react-native'
import { JWordmark } from '../components/JLogo'
import { GradientButton, DifficultyBadge } from '../components/primitives'
import { colors, gradients, shadows } from '../theme'

const STEPS = [
  { n: 1, label: 'Details', Icon: Tag },
  { n: 2, label: 'Questions', Icon: FileQuestion },
  { n: 3, label: 'Review', Icon: Trophy },
]

const CATEGORIES = ['Algorithms', 'System Design', 'Behavioral', 'Frontend', 'Databases', 'AI/ML']

export default function DeckCreationScreen({ onPublish, onBack }: { onPublish?: () => void; onBack?: () => void }) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('My Custom Deck')
  const [desc, setDesc] = useState('Personalized questions for senior frontend roles.')
  const [category, setCategory] = useState('Frontend')
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium')
  const [tags, setTags] = useState(['frontend', 'react'])

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack}><ChevronLeft size={20} color={colors.ink} /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Create a deck</Text>
          <Text style={styles.sub}>Build your own question set</Text>
        </View>
        <JWordmark size={18} tone="dark" />
      </View>

      {/* Stepper */}
      <View style={styles.stepper}>
        {STEPS.map((s, i) => {
          const done = step > s.n
          const active = step === s.n
          const Icon = s.Icon
          return (
            <React.Fragment key={s.n}>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <View style={[styles.stepCircle, active && { overflow: 'hidden', ...shadows.soft }]}>
                  {active || done ? (
                    <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      {done ? <Check size={16} color="#fff" strokeWidth={3} /> : <Icon size={16} color="#fff" />}
                    </LinearGradient>
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color={colors.textSubtle} />
                    </View>
                  )}
                </View>
                <Text style={[styles.stepLabel, (active || done) && { color: colors.ink }]}>{s.label}</Text>
              </View>
              {i < STEPS.length - 1 && <View style={[styles.stepLine, step > s.n && { overflow: 'hidden' }]}>
                {step > s.n && <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />}
              </View>}
            </React.Fragment>
          )
        })}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={{ gap: 12 }}>
            <View>
              <Text style={styles.fieldLabel}>TITLE</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Deck title" placeholderTextColor={colors.textSubtle} />
            </View>
            <View>
              <Text style={styles.fieldLabel}>DESCRIPTION</Text>
              <TextInput style={[styles.input, { height: 80 }]} value={desc} onChangeText={setDesc} placeholder="Description" placeholderTextColor={colors.textSubtle} multiline textAlignVertical="top" />
            </View>
            <View>
              <Text style={styles.fieldLabel}>CATEGORY</Text>
                  </View>
                ))}
                <TextInput
                  style={styles.tagInput}
                  placeholder="add tag…"
                  placeholderTextColor={colors.textSubtle}
                  onSubmitEditing={(e) => {
                    const v = e.nativeEvent.text.trim()
                    if (v && !tags.includes(v)) setTags((s) => [...s, v])
                    e.currentTarget.clear()
                  }}
                />
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={styles.qCountTitle}>3 questions added</Text>
                <Text style={styles.qCountSub}>Drag to reorder · tap to edit</Text>
              </View>
              <Pressable style={styles.aiGenBtn}><Sparkles size={12} color="#8b5cf6" /><Text style={styles.aiGenText}>AI generate</Text></Pressable>
            </View>
            {[
              { n: 1, q: 'Explain the difference between useCallback and useMemo.', type: 'Open-ended', time: '5 min' },
              { n: 2, q: 'How does React reconciliation work under the hood?', type: 'Open-ended', time: '8 min' },
              { n: 3, q: 'When would you choose Context over Redux?', type: 'Multiple choice', time: '4 min' },
            ].map((item) => (
              <View key={item.n} style={styles.qCard}>
                <GripVertical size={16} color="#cdd2d9" style={{ marginTop: 4 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.qIndex}>Q{item.n}</Text>
                  <Text style={styles.qTitle}>{item.q}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <View style={styles.qTypeBadge}><Text style={styles.qTypeText}>{item.type}</Text></View>
                    <Text style={styles.qTime}>⏱ {item.time}</Text>
                  </View>
                </View>
                <Pressable style={styles.qDeleteBtn}><Trash2 size={14} color={colors.danger} /></Pressable>
              </View>
            ))}
            <Pressable style={styles.addQBtn}><Plus size={16} color={colors.blue} /><Text style={styles.addQText}>Add question</Text></Pressable>
          </View>
        )}

        {step === 3 && (
          <View style={{ gap: 12 }}>
            {/* Preview card */}
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <LinearGradient colors={gradients.blueTeal as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 }}>
                  <View>
                    <View style={styles.previewCatBadge}><Text style={styles.previewCatText}>{category.toUpperCase()}</Text></View>
                    <Text style={styles.previewTitle}>{title}</Text>
                  </View>
                  <Text style={{ fontSize: 30 }}>⚛️</Text>
                </LinearGradient>
              </View>
              <View style={{ padding: 14 }}>
                <Text style={styles.previewDesc}>{desc}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <DifficultyBadge level={difficulty} />
                  <Text style={styles.previewMeta}>3 questions · ~17 min</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {tags.map((t) => (
                    <View key={t} style={styles.previewTag}><Text style={styles.previewTagText}>#{t}</Text></View>
                  ))}
                </View>
              </View>
            </View>
            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>SUMMARY</Text>
              {[
                ['Title', title], ['Category', category], ['Difficulty', difficulty],
                ['Questions', '3'], ['Estimated time', '~17 min'], ['Visibility', 'Private'],
              ].map(([k, v]) => (
                <View key={k} style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>{k}</Text>
                  <Text style={styles.summaryVal}>{v}</Text>
                </View>
              ))}
            </View>
            {/* Make public */}
            <View style={styles.publicRow}>
              <View style={{ width: 32, height: 32, borderRadius: 12, overflow: 'hidden' }}>
                <LinearGradient colors={[colors.blue, colors.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Eye size={16} color="#fff" />
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.publicTitle}>Make public</Text>
                <Text style={styles.publicSub}>Other users can discover & practice this deck</Text>
              </View>
              <View style={styles.toggleOff} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer nav */}
      <View style={styles.footer}>
        {step > 1 && (
          <Pressable style={styles.backFooterBtn} onPress={() => setStep((s) => s - 1)}>
            <ChevronLeft size={16} color={colors.textMuted} />
            <Text style={styles.backFooterText}>Back</Text>
          </Pressable>
        )}
        {step < 3 ? (
          <Pressable onPress={() => setStep((s) => s + 1)} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.9 : 1 }]}>
            <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
              <Text style={styles.ctaText}>Continue</Text>
              <ChevronRight size={16} color="#fff" />
            </LinearGradient>
          </Pressable>
        ) : (
          <Pressable onPress={onPublish} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.9 : 1 }]}>
            <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
              <Check size={16} color="#fff" strokeWidth={3} />
              <Text style={styles.ctaText}>Publish deck</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadows.card },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 10.5, color: colors.textSubtle },
  stepper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  stepLabel: { fontSize: 9.5, fontWeight: '700', color: colors.textSubtle },
  stepLine: { flex: 1, height: 2, borderRadius: 1, backgroundColor: '#e3e7ee', marginHorizontal: 6, marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textSubtle, letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, fontWeight: '600', color: colors.ink, ...shadows.card },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#f5f7fa', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  chipText: { fontSize: 11.5, fontWeight: '600', color: colors.textMuted },
  diffRow: { flexDirection: 'row', gap: 8 },
  diffBtn: { flex: 1, height: 44, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  diffText: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted },
  tagsBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, backgroundColor: '#fff', borderRadius: 16, padding: 10, ...shadows.card },
  tagPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eef4ff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  tagText: { fontSize: 11, fontWeight: '700', color: colors.blue },
  tagInput: { fontSize: 11.5, fontWeight: '500', color: colors.ink, minWidth: 80, padding: 4 },
  qCountTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  qCountSub: { fontSize: 10.5, color: colors.textSubtle },
  aiGenBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  aiGenText: { fontSize: 10.5, fontWeight: '700', color: '#8b5cf6' },
  qCard: { flexDirection: 'row', gap: 8, backgroundColor: '#fff', borderRadius: 16, padding: 12, ...shadows.card },
  qIndex: { fontSize: 10, fontWeight: '700', color: colors.textSubtle },
  qTitle: { fontSize: 12.5, fontWeight: '600', color: colors.ink, marginTop: 2, lineHeight: 18 },
  qTypeBadge: { backgroundColor: '#f5f7fa', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  qTypeText: { fontSize: 9, fontWeight: '700', color: colors.textMuted },
  qTime: { fontSize: 9.5, color: colors.textSubtle },
  qDeleteBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.dangerBg, alignItems: 'center', justifyContent: 'center' },
  addQBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(46,139,238,0.3)', borderStyle: 'dashed', paddingVertical: 12 },
  addQText: { fontSize: 12.5, fontWeight: '700', color: colors.blue },
  previewCard: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', ...shadows.card },
  previewHeader: { overflow: 'hidden', borderRadius: 8 },
  previewCatBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6 },
  previewCatText: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  previewTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  previewDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  previewMeta: { fontSize: 10.5, color: colors.textSubtle },
  previewTag: { backgroundColor: '#eef4ff', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  previewTagText: { fontSize: 9.5, fontWeight: '700', color: colors.blue },
  summaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, ...shadows.card },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: colors.textSubtle, letterSpacing: 0.5, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryKey: { fontSize: 11.5, color: colors.textSubtle },
  summaryVal: { fontSize: 11.5, fontWeight: '700', color: colors.ink },
  publicRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12, ...shadows.card },
  publicTitle: { fontSize: 12.5, fontWeight: '700', color: colors.ink },
  publicSub: { fontSize: 10, color: colors.textSubtle, marginTop: 2 },
  toggleOff: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#e3e7ee' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },
  backFooterBtn: { height: 48, borderRadius: 16, backgroundColor: '#fff', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6, ...shadows.card },
  backFooterText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  cta: { height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, ...shadows.soft },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#fff' },
})
