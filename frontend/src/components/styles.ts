import { StyleSheet } from 'react-native'
import { colors, shadows } from '../theme'

export const dashboardStyles = StyleSheet.create({
  brandBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 4, paddingTop: 8 },
  bellBtn: {
    marginLeft: 'auto', width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', ...shadows.card,
  },
  bellDot: { position: 'absolute', right: 8, top: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.orange, borderWidth: 2, borderColor: '#fff' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 },
  greetingLabel: { fontSize: 11, fontWeight: '500', color: colors.textSubtle },
  greetingName: { fontSize: 16, fontWeight: '800', color: colors.ink },
  resumeCard: {
    borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16, ...shadows.float,
  },
  resumePct: { fontSize: 18, fontWeight: '800', color: '#fff', lineHeight: 18 },
  resumePctLabel: { fontSize: 8, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  resumeBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2, marginTop: 4, marginBottom: 6,
  },
  resumeBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  resumeTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  resumeSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginTop: 16 },
  card: { marginHorizontal: 16, marginTop: 10, backgroundColor: '#fff', borderRadius: 16, padding: 16, ...shadows.card },
  bigNumber: { fontSize: 20, fontWeight: '800', color: colors.ink },
  cardSubtext: { fontSize: 11, fontWeight: '500', color: colors.textSubtle },
  pillGreen: { marginLeft: 'auto', backgroundColor: colors.successBg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pillGreenText: { fontSize: 10, fontWeight: '700', color: colors.success },
  link: { fontSize: 12, fontWeight: '600', color: colors.blue },
  skillName: { fontSize: 12, fontWeight: '600', color: colors.ink },
  skillValue: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  skillTrack: { height: 8, backgroundColor: '#eef2f7', borderRadius: 4, overflow: 'hidden' },
  sessionTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  sessionMeta: { fontSize: 11, color: colors.textSubtle },
  sessionScore: { fontSize: 15, fontWeight: '800', color: colors.success },
  darkCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.ink,
    borderRadius: 16, padding: 16,
  },
  darkCardIcon: {
    width: 40, height: 40, borderRadius: 12, overflow: 'hidden',
  },
  darkCardTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
  darkCardSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
})
