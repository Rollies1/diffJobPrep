import React from 'react'
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronLeft, Share2, Bookmark, Users, Clock, CheckCircle2, CircleDot, CircleDashed, ChevronRight } from 'lucide-react-native'
import { ScreenHeader, DifficultyBadge, ProgressRing, GradientButton } from '../components/primitives'
import { useDeckQuestions } from '../hooks/queries'
import { colors, gradients, shadows } from '../theme'
import type { QuestionDto } from '../types/api'

const STATUS_MAP = {
  completed: { icon: CheckCircle2, color: colors.success, bg: colors.successBg, label: 'Mastered' },
  pending: { icon: CircleDashed, color: colors.textSubtle, bg: colors.surfaceMuted, label: 'New' },
} as const

export default function LibraryDeckScreen({
  deckId,
  deckTitle = 'Deck',
  deckCategory = 'Algorithms',
  deckEmoji = '📚',
  onBack,
  onOpenQuestion,
  onStartPractice,
}: {
  deckId: string
  deckTitle?: string
  deckCategory?: string
  deckEmoji?: string
  onBack?: () => void
  onOpenQuestion?: (q: QuestionDto) => void
  onStartPractice?: () => void
}) {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDeckQuestions(deckId)

  const questions = data?.pages.flatMap((p) => p.data) ?? []
  const total = questions.length
  const completed = questions.filter((q) => q.completed).length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  const renderItem = ({ item: q, index }: { item: QuestionDto; index: number }) => {
    const status = q.completed ? STATUS_MAP.completed : STATUS_MAP.pending
    const Icon = status.icon
    return (
      <Pressable
        style={({ pressed }) => [styles.questionRow, { opacity: pressed ? 0.97 : 1 }]}
        onPress={() => onOpenQuestion?.(q)}
      >
        <View style={[styles.qStatusIcon, { backgroundColor: status.bg }]}>
          <Icon size={18} color={status.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.qIndex}>Q{index + 1}</Text>
          <Text style={styles.qTitle} numberOfLines={2}>{q.title || q.content.slice(0, 60)}</Text>
          <Text style={[styles.qMeta, { color: status.color }]}>{status.label} · {q.difficulty}</Text>
        </View>
        <ChevronRight size={16} color="#cdd2d9" />
      </Pressable>
    )
  }

  return (
    <View style={styles.container}>
      {/* Banner */}
      <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
        <ScreenHeader
          title=""
          onBack={onBack}
          right={
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable style={styles.iconBtn}><Bookmark size={17} color="#fff" /></Pressable>
              <Pressable style={styles.iconBtn}><Share2 size={17} color="#fff" /></Pressable>
            </View>
          }
        />
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 48 }}>{deckEmoji}</Text>
            <View>
              <View style={styles.catBadge}><Text style={styles.catBadgeText}>{deckCategory.toUpperCase()}</Text></View>
              <Text style={styles.bannerTitle}>{deckTitle}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16 }}>
            <ProgressRing progress={progress} size={74} stroke={7} trackColor="rgba(255,255,255,0.25)">
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.ringPct}>{progress}%</Text>
                <Text style={styles.ringLabel}>complete</Text>
              </View>
            </ProgressRing>
            <View style={{ gap: 8 }}>
              <View style={styles.metaRow}><Users size={16} color="rgba(255,255,255,0.85)" /><Text style={styles.metaText}>{total} questions</Text></View>
              <View style={styles.metaRow}><Clock size={16} color="rgba(255,255,255,0.85)" /><Text style={styles.metaText}>~{Math.round(total * 1.5)} min total</Text></View>
              <DifficultyBadge level={total > 25 ? 'Hard' : total > 15 ? 'Medium' : 'Easy'} />
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Question list */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Questions</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <FilterChip active>All</FilterChip>
          <FilterChip>Learning</FilterChip>
          <FilterChip>New</FilterChip>
        </View>
      </View>

      {isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={colors.blue} /></View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(q) => q.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 8 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator color={colors.blue} style={{ padding: 16 }} /> : null
          }
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: colors.textSubtle }}>No questions in this deck yet.</Text>
            </View>
          }
        />
      )}

      {/* Sticky CTA */}
      <View style={styles.stickyCta}>
        <Pressable onPress={onStartPractice} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
          <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            <Text style={styles.ctaText}>Continue practice</Text>
            <ChevronRight size={16} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  )
}

function FilterChip({ children, active }: { children: React.ReactNode; active?: boolean }) {
  if (active) {
    return (
      <View style={{ borderRadius: 999, overflow: 'hidden', ...shadows.soft }}>
        <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>{children}</Text>
        </LinearGradient>
      </View>
    )
  }
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSubtle }}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  banner: { borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  catBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4, marginBottom: 6 },
  catBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  ringPct: { fontSize: 18, fontWeight: '800', color: '#fff', lineHeight: 18 },
  ringLabel: { fontSize: 8, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  listTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12, ...shadows.card },
  qStatusIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  qIndex: { fontSize: 10, fontWeight: '700', color: colors.textSubtle },
  qTitle: { fontSize: 13, fontWeight: '600', color: colors.ink, marginTop: 2 },
  qMeta: { fontSize: 10, fontWeight: '500', marginTop: 2 },
  stickyCta: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16, backgroundColor: 'rgba(251,252,254,0.95)' },
  cta: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, ...shadows.soft },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#fff' },
})
