import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

type Level = 'none' | 'weak' | 'medium' | 'strong';

interface StrengthProps {
  password: string;
}

function getStrength(pw: string): { level: Level; label: string } {
  if (pw.length === 0) return { level: 'none', label: '' };
  if (pw.length < 6) return { level: 'weak', label: 'Too short' };
  let score = 1;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score >= 4) return { level: 'strong', label: 'Strong' };
  return { level: 'medium', label: 'Medium — add uppercase, number, or symbol' };
}

const barColors: Record<Level, string> = {
  none: 'transparent',
  weak: colors.red,
  medium: colors.amber,
  strong: colors.green,
};

const textColors: Record<Level, string> = {
  none: 'transparent',
  weak: colors.red,
  medium: colors.amber,
  strong: colors.green,
};

const barWidths: Record<Level, string> = {
  none: '0%',
  weak: '33%',
  medium: '66%',
  strong: '100%',
};

export function PasswordStrength({ password }: StrengthProps) {
  const { level, label } = getStrength(password);

  if (level === 'none') return <View style={styles.spacer} />;

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: barWidths[level], backgroundColor: barColors[level] }]} />
      </View>
      <Text style={[styles.label, { color: textColors[level] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  spacer: { height: 18 },
  wrap: { paddingVertical: 2, marginBottom: 4 },
  bar: { height: 3, backgroundColor: colors.srf, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  label: { fontSize: 10, fontFamily: fonts.caption, marginTop: 3 },
});
