import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, FlatList } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Search, X, TrendingUp, Clock, ChevronRight, Flame, Sparkles, Hash } from 'lucide-react-native'
import { JWordmark } from '../components/JLogo'
import { BottomNav } from '../components/BottomNav'
import { BreathingGradient, Avatar, StoryRing, DifficultyBadge } from '../components/primitives'
import { useDecks, useCategories } from '../hooks/queries'
import { colors, gradients, shadows } from '../theme'

const RECENT = ['system design cache', 'two pointers', 'behavioral leadership', 'react hooks']

const TRENDING = [
  { tag: 'SystemDesign', count: '2.4k questions', emoji: '🏗️', tint: [colors.gold, colors.amber] as any },
  { tag: 'FAANG 2025', count: '1.8k questions', emoji: '🎯', tint: [colors.blue, colors.teal] as any },
  { tag: 'Behavioral', count: '960 questions', emoji: '🧭', tint: [colors.teal, colors.tealGreen] as any },
  { tag: 'Frontend', count: '1.2k questions', emoji: '⚛️', tint: [colors.orange, '#f43f5e'] as any },
  { tag: 'SQL', count: '740 questions', emoji: '🗄️', tint: [colors.blue, '#8b5cf6'] as any },
  { tag: 'AI/ML', count: '520 questions', emoji: '🤖', tint: ['#8b5cf6', colors.blue] as any },
]

export default function SearchExploreScreen({ onTab }: { onTab?: (key: string) => void }) {
  const [query, setQuery] = useState('')
  const hasQuery = query.trim().length > 0
  const { data: decks } = useDecks()

  const matchedDecks = hasQuery
    ? (decks ?? []).filter((d: any) => d.title.toLowerCase().includes(query.toLowerCase()) || d.category.toLowerCase().includes(query.toLowerCase()))
    : []

  return (
    <View style={styles.container}>
      <BreathingGradient />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <JWordmark size={22} tone="dark" />
        </View>

        {/* Search bar */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <View style={styles.searchBox}>
            <Search size={16} color={colors.textSubtle} />
            <TextInput style={styles.searchInput} placeholder="Search questions, decks, people…" placeholderTextColor={colors.textSubtle} value={query} onChangeText={setQuery} />
            {hasQuery && (
              <Pressable onPress={() => setQuery('')} style={styles.clearBtn}><X size={12} color={colors.textSubtle} /></Pressable>
            )}
          </View>
        </View>

        {!hasQuery ? (
          <>
            {/* Recent */}
            <SectionLabel icon={<Clock size={14} color={colors.textSubtle} />} label="Recent" />
            <View style={styles.chipRow}>
              {RECENT.map((r) => (
                <Pressable key={r} style={styles.recentChip} onPress={() => setQuery(r)}>
                  <Clock size={12} color={colors.textSubtle} />
                  <Text style={styles.recentText}>{r}</Text>
                </Pressable>
              ))}
            </View>

            {/* Trending */}
            <SectionLabel icon={<TrendingUp size={14} color={colors.orange} />} label="Trending now" style={{ marginTop: 20 }} />
            <View style={styles.trendingGrid}>
              {TRENDING.map((t) => (
                <Pressable key={t.tag} style={({ pressed }) => [styles.trendingCard, { opacity: pressed ? 0.95 : 1 }]}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, overflow: 'hidden' }}>
                    <LinearGradient colors={t.tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 16 }}>{t.emoji}</Text>
                    </LinearGradient>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trendingTag}>#{t.tag}</Text>
                    <Text style={styles.trendingCount}>{t.count}</Text>
                  </View>
                  <ChevronRight size={14} color="#cdd2d9" />
                </Pressable>
              ))}
            </View>

            {/* Suggested decks */}
            <SectionLabel icon={<Sparkles size={14} color={colors.blue} />} label="Suggested decks" style={{ marginTop: 20 }} />
            <View style={{ paddingHorizontal: 16, gap: 8, marginTop: 8 }}>
              {(decks ?? []).slice(0, 3).map((d: any, i: any) => (
                <View key={d.id} style={styles.suggestedRow}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden' }}>
                    <LinearGradient colors={[colors.blue, colors.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 18 }}>📚</Text>
                    </LinearGradient>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestedTitle}>{d.title}</Text>
                    <Text style={styles.suggestedMeta}>{d.category} · {d.questionCount} Qs</Text>
                  </View>
                  <DifficultyBadge level={d.questionCount > 25 ? 'Hard' : d.questionCount > 15 ? 'Medium' : 'Easy'} />
                </View>
              ))}
            </View>

            {/* People */}
            <SectionLabel icon={<Hash size={14} color="#8b5cf6" />} label="Top performers" style={{ marginTop: 20 }} />
            <View style={{ paddingHorizontal: 16, gap: 8, marginTop: 8 }}>
              {[
                { name: 'Adwoa Mensah', handle: '@adwoa', role: 'Legend · 9,840 XP' },
                { name: 'Kwesi Boadi', handle: '@kwesi', role: 'Legend · 9,520 XP' },
                { name: 'Priya Nair', handle: '@priya', role: 'Expert · 7,890 XP' },
              ].map((p, i) => (
                <View key={i} style={styles.personRow}>
                  <StoryRing size={40} seen={false}><Avatar name={p.name} size={32} /></StoryRing>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personName}>{p.name}</Text>
                    <Text style={styles.personRole}>{p.handle} · {p.role}</Text>
                  </View>
                  <Pressable style={styles.followBtn}>
                    <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={styles.followText}>Follow</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        ) : (
          /* Search results */
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <Text style={styles.resultsLabel}>Results for "<Text style={styles.resultsQuery}>{query}</Text>"</Text>
            <Text style={styles.resultsSectionLabel}>Decks</Text>
            {matchedDecks.length > 0 ? (
              <View style={{ gap: 8 }}>
                {matchedDecks.map((d: any) => (
                  <View key={d.id} style={styles.resultRow}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden' }}>
                      <LinearGradient colors={[colors.blue, colors.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18 }}>📚</Text>
                      </LinearGradient>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultTitle}>{d.title}</Text>
                      <Text style={styles.resultMeta}>{d.category} · {d.questionCount} Qs</Text>
                    </View>
                    <DifficultyBadge level={d.questionCount > 25 ? 'Hard' : d.questionCount > 15 ? 'Medium' : 'Easy'} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyResults}>
                <Search size={28} color="#cdd2d9" />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptySub}>Try a different keyword or browse trending topics.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <BottomNav active="home" onTab={onTab} />
    </View>
  )
}

function SectionLabel({ icon, label, style }: { icon: React.ReactNode; label: string; style?: object }) {
  return (
    <View style={[styles.sectionLabel, style]}>
      {icon}
      <Text style={styles.sectionLabelText}>{label}</Text>
      <View style={styles.sectionDivider} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, ...shadows.card },
  searchInput: { flex: 1, fontSize: 13, color: colors.ink, padding: 0 },
  clearBtn: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#f5f7fa', alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  sectionLabelText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  sectionDivider: { flex: 1, height: 1, backgroundColor: colors.border, marginLeft: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 8 },
  recentChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, ...shadows.card },
  recentText: { fontSize: 11.5, fontWeight: '600', color: colors.textMuted },
  trendingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginTop: 8 },
  trendingCard: { width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 16, padding: 10, ...shadows.card },
  trendingTag: { fontSize: 12, fontWeight: '700', color: colors.ink },
  trendingCount: { fontSize: 9.5, color: colors.textSubtle },
  suggestedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 10, ...shadows.card },
  suggestedTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  suggestedMeta: { fontSize: 10, color: colors.textSubtle },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 10, ...shadows.card },
  personName: { fontSize: 12.5, fontWeight: '700', color: colors.ink },
  personRole: { fontSize: 10, color: colors.textSubtle },
  followBtn: { width: 70, height: 30, borderRadius: 999, overflow: 'hidden' },
  followText: { fontSize: 10.5, fontWeight: '700', color: '#fff' },
  resultsLabel: { fontSize: 11, fontWeight: '600', color: colors.textSubtle, marginBottom: 12 },
  resultsQuery: { fontWeight: '700', color: colors.ink },
  resultsSectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textSubtle, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 10, ...shadows.card },
  resultTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  resultMeta: { fontSize: 10, color: colors.textSubtle },
  emptyResults: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: 12 },
  emptySub: { fontSize: 12, color: colors.textSubtle, marginTop: 4, textAlign: 'center' },
})
