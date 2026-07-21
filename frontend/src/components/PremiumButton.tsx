import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

interface PremiumButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: object;
}

export function PremiumButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  icon,
  style,
}: PremiumButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.wrap,
        { opacity: inactive ? 0.4 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <LinearGradient
        colors={[colors.ui1, colors.ui2, colors.ui3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <View style={styles.spinner} />
        ) : (
          <View style={styles.content}>
            {icon}
            <Text style={styles.label}>{label}</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    height: 50,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  spinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.25)',
    borderTopColor: '#FFFFFF',
    borderLeftColor: 'rgba(255,255,255,0.25)',
    borderRightColor: 'rgba(255,255,255,0.25)',
  },
});
