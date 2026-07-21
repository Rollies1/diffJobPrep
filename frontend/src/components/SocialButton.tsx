import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

interface SocialButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

export function SocialButton({ icon, label, onPress }: SocialButtonProps) {
  return (
    <Pressable style={({ pressed }) => [styles.wrap, { opacity: pressed ? 0.6 : 1 }]} onPress={onPress}>
      {icon}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    backgroundColor: colors.srf,
    borderWidth: 1.5,
    borderColor: colors.bdr,
    borderRadius: 12,
  },
  label: { fontSize: 13, fontFamily: fonts.body, color: colors.t1 },
});
