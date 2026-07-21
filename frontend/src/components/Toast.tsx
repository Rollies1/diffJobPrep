import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

interface ToastProps {
  message: string;
  icon?: React.ReactNode;
  visible: boolean;
  onHide: () => void;
  color?: string;
}

export function Toast({ message, icon, visible, onHide, color }: ToastProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(-12)).current;
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();

      timer.current = setTimeout(onHide, 2400);
    } else {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slide, { toValue: -12, duration: 200, useNativeDriver: true }),
      ]).start();
      clearTimeout(timer.current);
    }

    return () => clearTimeout(timer.current);
  }, [visible]);

  return (
    <Animated.View style={[styles.wrap, { opacity: fade, transform: [{ translateY: slide }] }]}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: colors.t1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  iconWrap: {
    width: 16,
    alignItems: 'center',
  },
  message: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: '#FFFFFF',
    flex: 1,
  },
});
