import { useState, forwardRef } from 'react';
import { View, Text, TextInput, TextInputProps, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

interface PremiumInputProps extends TextInputProps {
  icon: React.ReactNode;
  error?: string;
  rightElement?: React.ReactNode;
}

export const PremiumInput = forwardRef<TextInput, PremiumInputProps>(
  ({ icon, error, rightElement, style, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    const borderColor = error
      ? colors.red
      : focused
        ? colors.bdrF
        : colors.bdr;

    const bgColor = error ? colors.redBg : focused ? colors.bg : colors.srf;

    const iconColor = error ? colors.red : focused ? colors.t3 : colors.t4;

    return (
      <View>
        <View style={[styles.wrap, { borderColor, backgroundColor: bgColor }, style]}>
          <View style={[styles.iconWrap, { left: 13 }]}>{icon}</View>
          <TextInput
            ref={ref}
            style={[styles.input, { color: colors.t1 }]}
            placeholderTextColor={colors.t5}
            onFocus={(e) => { setFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); onBlur?.(e); }}
            {...props}
          />
          {rightElement && <View style={styles.rightWrap}>{rightElement}</View>}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : <View style={styles.errorSpacer} />}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    height: 48,
  },
  iconWrap: {
    position: 'absolute',
    zIndex: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: 40,
    fontSize: 15,
    fontFamily: fonts.body,
  },
  rightWrap: {
    position: 'absolute',
    right: 12,
    zIndex: 2,
  },
  error: {
    fontSize: 11,
    color: colors.red,
    fontFamily: fonts.caption,
    paddingHorizontal: 4,
    paddingTop: 3,
    minHeight: 16,
  },
  errorSpacer: {
    minHeight: 16,
  },
});
