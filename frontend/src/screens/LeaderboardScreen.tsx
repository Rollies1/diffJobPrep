import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Crown, TrendingUp, TrendingDown, Minus, ChevronRight, Users } from 'lucide-react-native'
import { JWordmark } from '../components/JLogo'
import { BottomNav } from '../components/BottomNav'
import { BreathingGradient, Avatar, Chip } from '../components/primitives'
import { colors, gradients, shadows } from '../theme'

type Ranker = { rank: number; name: string; handle: string; score: number; delta: 'up' | 'down' | 'same'; deltaValue?: number; tier: string; you?: boolean }

const TOP3: Ranker[] = [
  { rank: 1, name: 'Adwoa Mensah', handle: '@adwoa', score: 9840, delta: 'same', tier: 'Legend' },
  { rank: 2, name: 'Kwesi Boadi', handle: '@kwesi', score: 9520, delta: 'up', deltaValue: 3, tier: 'Legend' },
  { rank: 3, name: 'Yara El-Sayed', handle: '@yara', score: 9180, delta: 'down', deltaValue: 1, tier: 'Master' },
]

const REST: Ranker[] = [
  { rank: 4, name: 'Daniel Park', handle: '@dpark', score: 8740, delta: 'up', deltaValue: 2, tier: 'Master' },
  { rank: 5, name: 'Fatima Zahra', handle: '@fatima', score: 8510, delta: 'down', deltaValue: 1, tier: 'Master' },
  { rank: 6, name: "Liam O'Brien", handle: '@liam', score: 8120, delta: 'up', deltaValue: 5, tier: 'Expert' },
  { rank: 7, name: 'Priya Nair', handle: '@priya', score: 7890, delta: 'same', tier: 'Expert' },
  { rank: 8, name: 'Marcus Chen', handle: '@mchen', score: 7650, delta: 'down', deltaValue: 2, tier: 'Expert' },
  { rank: 9, name: 'Zara Ahmed', handle: '@zara', score: 7420, delta: 'up', deltaValue: 1, tier: 'Pro' },
  { rank: 10, name: 'Tom Müller', handle: '@tom', score: 7180, delta: 'down', deltaValue: 3, tier: 'Pro' },
  { rank: 11, name: 'Ama Okafor', handle: '@ama', score: 6940, delta: 'up', deltaValue: 8, tier: 'Pro', you: true },
  { rank: 12, name: 'Noah Williams', handle: '@noah', score: 6710, delta: 'same', tier: 'Pro' },
]

const TIER_COLORS: Record<string, string[]> = {
  Legend: [colors.gold, colors.orange],
  Master: ['#8b5cf6', colors.blue],
  Expert: [colors.teal, colors.tealGreen],
  Pro: [colors.blue, colors.teal],
  Rising: [colors.textSubtle, colors.textMuted],
}

export default function LeaderboardScreen({ onTab }: { onTab?: (key: string) => void }) {
  const [period, setPeriod] = useState('Weekly')

  return (
    <View style={styles.container}>
      <BreathingGradient />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <JWordmark size={22} tone="dark" />
          <View style={styles.competingPill}><Users size={12} color={colors.textMuted} /><Text style={styles.competingText}>12,480 competing</Text></View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.sub}>Top performers this week · resets Monday</Text>
        </View>

        {/* Period chips */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 }}>
          {['Weekly', 'Monthly', 'All-time'].map((p) => (
            <Chip key={p} active={period === p} onPress={() => setPeriod(p)}>{p}</Chip>
          ))}
        </View>

        {/* Podium */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 10 }}>
            <PodiumCard ranker={TOP3[1]} place={2} height={108} />
            <PodiumCard ranker={TOP3[0]} place={1} height={132} />
            <PodiumCard ranker={TOP3[2]} place={3} height={92} />
          </View>
        </View>

        {/* Ranked list */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.sectionTitle}>Rankings</Text>
            <Text style={styles.sectionSub}>{period}</Text>
          </View>
          <View style={{ gap: 6, marginTop: 10 }}>
            {REST.map((r) => <RankRow key={r.rank} ranker={r} />)}
          </View>
        </View>

        {/* Tier legend */}
        <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 12, ...shadows.card }}>
          <Text style={styles.legendLabel}>Tiers</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {Object.entries(TIER_COLORS).map(([t, c]) => (
              <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, overflow: 'hidden' }}>
                  <LinearGradient colors={c} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
                </View>
                <Text style={styles.legendText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky your-rank card */}
      <View style={styles.stickyWrap}>
        <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.stickyCard}>
          <View style={styles.stickyRank}><Text style={styles.stickyRankText}>11</Text></View>
          <Avatar name="Ama Okafor" size={36} />
          <View style={{ flex: 1 }}>
            <Text style={styles.stickyName}>You · @ama</Text>
            <Text style={styles.stickySub}>6,940 XP · Pro tier</Text>
          </View>
          <View style={styles.stickyDelta}><TrendingUp size={12} color="#fff" /><Text style={styles.stickyDeltaText}>+8</Text></View>
          <ChevronRight size={16} color="rgba(255,255,255,0.8)" />
        </LinearGradient>
      </View>
      <BottomNav active="profile" onTab={onTab} />
    </View>
  )
}

function PodiumCard({ ranker, place, height }: { ranker: Ranker; place: 1 | 2 | 3; height: number }) {
  const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉'
  const size = place === 1 ? 64 : 52
  const pedColors = place === 1 ? gradients.primary : place === 2 ? ['#c0c5ce', '#aab0ba'] : ['#e0a878', '#c08552']
  return (
    <View style={{ flex: 1, alignItems: 'center', minHeight: height }}>
      <Text style={{ fontSize: 24 }}>{medal}</Text>
      <View style={{ width: size, height: size, borderRadius: size / 2, padding: 2.5, marginTop: 4, overflow: 'hidden' }}>
        {place === 1 ? (
          <LinearGradient colors={gradients.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: size / 2, padding: 2 }}>
            <View style={{ flex: 1, borderRadius: size / 2, backgroundColor: '#fff', padding: 2 }}>
              <Avatar name={ranker.name} size={size - 12} />
            </View>
          </LinearGradient>
        ) : (
          <View style={{ flex: 1, borderRadius: size / 2, backgroundColor: place === 2 ? '#c0c5ce' : '#e0a878', padding: 2 }}>
            <View style={{ flex: 1, borderRadius: size / 2, backgroundColor: '#fff', padding: 2 }}>
              <Avatar name={ranker.name} size={size - 12} />
            </View>
          </View>
        )}
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>{ranker.name.split(' ')[0]}</Text>
      <Text style={styles.podiumScore}>{ranker.score.toLocaleString()}</Text>
      <View style={{ width: '100%', height: place === 1 ? 28 : 20, borderRadius: 8, overflow: 'hidden', marginTop: 6 }}>
        <LinearGradient colors={pedColors as any} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }}>
          {place === 1 && <Crown size={12} color="#fff" />}
          <Text style={styles.podiumRank}>{place}</Text>
        </LinearGradient>
      </View>
    </View>
  )
}

function RankRow({ ranker }: { ranker: Ranker }) {
  return (
    <View style={[styles.rankRow, ranker.you && { borderWidth: 1, borderColor: 'rgba(46,139,238,0.25)' }]}>
      <Text style={styles.rankNum}>{ranker.rank}</Text>
      <Avatar name={ranker.name} size={36} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[styles.rankName, ranker.you && { color: colors.blue }]} numberOfLines={1}>
            {ranker.name}
            {ranker.you && <Text style={styles.youBadge}> YOU</Text>}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, overflow: 'hidden' }}>
            <LinearGradient colors={TIER_COLORS[ranker.tier]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
          </View>
          <Text style={styles.rankHandle}>{ranker.handle} · {ranker.tier}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.rankScore}>{ranker.score.toLocaleString()}</Text>
        <DeltaIndicator delta={ranker.delta} value={ranker.deltaValue} />
      </View>
    </View>
  )
}

function DeltaIndicator({ delta, value }: { delta: 'up' | 'down' | 'same'; value?: number }) {
  if (delta === 'same') return <Minus size={10} color={colors.textSubtle} />
  const color = delta === 'up' ? colors.success : colors.danger
  const Icon = delta === 'up' ? TrendingUp : TrendingDown
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Icon size={10} color={color} />
      <Text style={{ fontSize: 9.5, fontWeight: '700', color }}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  competingPill: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, ...shadows.card },
  competingText: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  sub: { fontSize: 11, fontWeight: '500', color: colors.textSubtle },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  sectionSub: { fontSize: 11, fontWeight: '600', color: colors.textSubtle },
  podiumName: { fontSize: 11, fontWeight: '700', color: colors.ink, marginTop: 4 },
  podiumScore: { fontSize: 10, fontWeight: '800', color: colors.blue },
  podiumRank: { fontSize: 11, fontWeight: '800', color: '#fff' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 16, padding: 10, ...shadows.card },
  rankNum: { width: 24, textAlign: 'center', fontSize: 13, fontWeight: '800', color: colors.textSubtle },
  rankName: { flex: 1, fontSize: 12.5, fontWeight: '700', color: colors.ink },
  youBadge: { fontSize: 8, fontWeight: '800', color: colors.blue },
  rankHandle: { fontSize: 10, color: colors.textSubtle },
  rankScore: { fontSize: 12.5, fontWeight: '800', color: colors.ink },
  legendLabel: { fontSize: 11, fontWeight: '700', color: colors.textSubtle, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  legendText: { fontSize: 10.5, fontWeight: '600', color: colors.textMuted },
  stickyWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 20, paddingTop: 16 },
  stickyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 12, overflow: 'hidden', ...shadows.float },
  stickyRank: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  stickyRankText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  stickyName: { fontSize: 13, fontWeight: '700', color: '#fff' },
  stickySub: { fontSize: 10.5, color: 'rgba(255,255,255,0.85)' },
  stickyDelta: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  stickyDeltaText: { fontSize: 10.5, fontWeight: '700', color: '#fff' },
})
