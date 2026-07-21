import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Search, SlidersHorizontal, Lock, Users } from 'lucide-react-native'
import { JWordmark } from '../components/JLogo'
import { BottomNav } from '../components/BottomNav'
import { BreathingGradient, Chip, DifficultyBadge, ProgressRing, StoryRing } from '../components/primitives'
import { useDecks } from '../hooks/queries'
import { colors, gradients, shadows } from '../theme'
import type { DeckDto } from '../types/api'

const MOCK_DECKS: DeckDto[] = [
  { id: '1', title: 'Two Pointers', category: 'Algorithms', color: '#2e8bee', questionCount: 24, completedCount: 15, description: '' },
  { id: '2', title: 'Leadership Stories', category: 'Behavioral', color: '#18b6c5', questionCount: 18, completedCount: 18, description: '' },
  { id: '3', title: 'System Design 101', category: 'System Design', color: '#f2c94c', questionCount: 32, completedCount: 18, description: '' },
  { id: '4', title: 'Frontend Deep Dive', category: 'Frontend', color: '#f59e0b', questionCount: 27, completedCount: 0, description: '' },
  { id: '5', title: 'SQL Mastery', category: 'Databases', color: '#2e8bee', questionCount: 21, completedCount: 7, description: '' },
  { id: '6', title: 'React Internals', category: 'Frontend', color: '#fb7b3a', questionCount: 15, completedCount: 0, description: '' },
]

const CATEGORY_EMOJIS: Record<string, string> = {
  Algorithms: '🎯', Behavioral: '🧭', 'System Design': '🏗️', Frontend: '⚛️',
  Databases: '🗄️', 'AI/ML': '🤖',
}
const CATEGORY_TINTS: Record<string, string[]> = {
  Algorithms: [colors.blue, colors.teal],
  Behavioral: [colors.teal, colors.tealGreen],
  'System Design': [colors.gold, colors.amber],
  Frontend: [colors.amber, colors.orange],
  Databases: [colors.blue, '#8b5cf6'],
  'AI/ML': ['#8b5cf6', colors.blue],
}

export default function LibraryIndexScreen({ onOpenDeck, onTab }: { onOpenDeck?: (deck: DeckDto) => void; onTab?: (key: string) => void }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const { data: decks, isLoading } = useDecks()

  const allDecks = decks && decks.length > 0 ? decks : MOCK_DECKS
  const categories = ['All', ...Array.from(new Set(allDecks.map((d) => d.category)))]
  const filtered = allDecks.filter((d) => {
    const matchCat = category === 'All' || d.category === category
    const matchQuery = !query || d.title.toLowerCase().includes(query.toLowerCase())
    return matchCat && matchQuery
  })

  return (
    <View style={styles.container}>
      <BreathingGradient />
      <ScrollViewContent>
        {/* Brand bar */}
        <View style={styles.brandBar}>
          <JWordmark size={24} tone="dark" />
          <Pressable style={styles.iconBtn}><SlidersHorizontal size={17} color={colors.ink} /></Pressable>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 16 }}>
          <View style={styles.searchBox}>
            <Search size={16} color={colors.textSubtle} />
            <TextInput style={styles.searchInput} placeholder="Search decks…" placeholderTextColor={colors.textSubtle} value={query} onChangeText={setQuery} />
          </View>
        </View>

        {/* Category chips */}
        <ScrollView style={{ maxHeight: 44 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }} horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((c) => (
            <Chip key={c} active={category === c} onPress={() => setCategory(c)}>{c}</Chip>
          ))}
        </ScrollView>

        {/* Recommended carousel (story rings) */}
        <SectionLabel label="Recommended for you" />
        <ScrollView style={{ maxHeight: 110 }} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingTop: 10 }} horizontal showsHorizontalScrollIndicator={false}>
          {allDecks.slice(0, 5).map((d) => (
            <Pressable key={d.id} style={{ width: 64, alignItems: 'center', gap: 6 }} onPress={() => onOpenDeck?.(d)}>
              <StoryRing size={64} seen={(d.completedCount ?? 0) >= (d.questionCount ?? 1)}>
                <View style={{ width: 56, height: 56, borderRadius: 28, overflow: 'hidden' }}>
                  <LinearGradient colors={CATEGORY_TINTS[d.category] ?? gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 24 }}>{CATEGORY_EMOJIS[d.category] ?? '📚'}</Text>
                  </LinearGradient>
                </View>
              </StoryRing>
              <Text style={styles.carouselLabel} numberOfLines={1}>{d.title.split(' ')[0]}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Deck grid */}
        <SectionLabel label="All decks" style={{ marginTop: 20 }} />
        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={colors.blue} /></View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((d) => (
              <DeckCard key={d.id} deck={d} onPress={() => onOpenDeck?.(d)} />
            ))}
          </View>
        )}
      </ScrollViewContent>
      <BottomNav active="library" onTab={onTab} />
    </View>
  )
}

/* ── Deck card ───────────────────────────────────────────────── */
function DeckCard({ deck, onPress }: { deck: DeckDto; onPress: () => void }) {
  const qc = deck.questionCount ?? 0
  const cc = deck.completedCount ?? 0
  const progress = qc > 0 ? Math.round((cc / qc) * 100) : 0
  const tint = CATEGORY_TINTS[deck.category] ?? gradients.primary
  const emoji = CATEGORY_EMOJIS[deck.category] ?? '📚'
  const premium = progress === 0 && cc === 0 && qc > 20

  return (
    <Pressable style={({ pressed }) => [styles.deckCard, { opacity: pressed ? 0.95 : 1 }]} onPress={onPress}>
      {premium && (
        <View style={styles.premiumBadge}>
          <LinearGradient colors={gradients.primary as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Text style={styles.premiumText}>★ PREMIUM</Text>
        </View>
      )}
      <View style={{ width: '100%', height: 64, borderRadius: 16, overflow: 'hidden', marginBottom: 8 }}>
        <LinearGradient colors={tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 }}>
          <Text style={{ fontSize: 30 }}>{emoji}</Text>
          <ProgressRing progress={progress} size={40} stroke={4} trackColor="rgba(255,255,255,0.3)">
            {premium && progress === 0 ? <Lock size={14} color="#fff" /> : <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>{progress}%</Text>}
          </ProgressRing>
        </LinearGradient>
      </View>
      <Text style={styles.deckTitle} numberOfLines={1}>{deck.title}</Text>
      <Text style={styles.deckCat}>{deck.category}</Text>
      <View style={styles.deckFooter}>
        <DifficultyBadge level={qc > 25 ? 'Hard' : qc > 15 ? 'Medium' : 'Easy'} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Users size={12} color={colors.textSubtle} />
          <Text style={styles.deckCount}>{qc}</Text>
        </View>
      </View>
    </Pressable>
  )
}

/* ── Helpers ─────────────────────────────────────────────────── */

function ScrollViewContent({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  )
}

function SectionLabel({ label, style }: { label: string; style?: object }) {
  return (
    <View style={[styles.sectionLabel, style]}>
      <Text style={styles.sectionLabelText}>{label}</Text>
      <View style={styles.sectionDivider} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  brandBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 4, paddingTop: 8 },
  iconBtn: { marginLeft: 'auto', width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadows.card },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, ...shadows.card },
  searchInput: { flex: 1, fontSize: 13, color: colors.ink, padding: 0 },
  carouselLabel: { fontSize: 10, fontWeight: '600', color: colors.ink },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  sectionLabelText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  sectionDivider: { flex: 1, height: 1, backgroundColor: colors.border, marginLeft: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingTop: 10 },
  deckCard: { width: '47%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 20, padding: 12, ...shadows.card, position: 'relative' },
  premiumBadge: { position: 'absolute', top: 8, right: 8, zIndex: 10, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  premiumText: { fontSize: 10, fontWeight: '800', color: '#fff', position: 'relative' },
  deckTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  deckCat: { fontSize: 10, fontWeight: '500', color: colors.textSubtle },
  deckFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  deckCount: { fontSize: 10, fontWeight: '500', color: colors.textSubtle },
})
