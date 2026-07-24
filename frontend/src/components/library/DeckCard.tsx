// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useHaptics } from '../../hooks/useHaptics';
import { useDeviceTier } from '../../hooks/useDeviceTier';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTheme } from '../../theme/ThemeProvider';
import { ProgressRing } from './ProgressRing';

interface DeckCardProps {
  id: string;
  title: string;
  subtitle: string;
  progress: number;
  isPremium: boolean;
  isLocked: boolean;
  questionCount: number;
  isAvailableOffline?: boolean;
  onPress: () => void;
  onPreview: () => void;
  onUnlock: () => void;
  onDownload?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const DeckCard: React.FC<DeckCardProps> = React.memo(({
  title,
  subtitle,
  progress,
  isPremium,
  isLocked,
  questionCount,
  isAvailableOffline = false,
  onPress,
  onPreview,
  onUnlock,
  onDownload,
}) => {
  const haptics = useHaptics();
  const tier = useDeviceTier();
  const reducedMotion = useReducedMotion();
  const theme = useTheme();
  
  const pressed = useSharedValue(false);
  const glowIntensity = useSharedValue(0);
  const [cardWidth, setCardWidth] = useState(0);

  // 3D tilt values
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const shadowOffset = useSharedValue({ x: 0, y: 4 });

  React.useEffect(() => {
    if (isPremium && !isLocked && !reducedMotion) {
      glowIntensity.value = withTiming(1, { duration: 1200 });
    }
  }, [isPremium, isLocked, reducedMotion]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setCardWidth(event.nativeEvent.layout.width);
  };

  const handlePressIn = (event: any) => {
    pressed.value = true;
    haptics.hapticSelection();

    if (reducedMotion || tier !== 'high') return;

    // Calculate tilt based on touch position relative to card center
    const { locationX, locationY } = event.nativeEvent;
    const centerX = cardWidth / 2;
    const centerY = 80; // approximate card height center
    
    rotateX.value = withSpring(((locationY - centerY) / centerY) * -6, { damping: 15 });
    rotateY.value = withSpring(((locationX - centerX) / centerX) * 6, { damping: 15 });
    shadowOffset.value = { x: 0, y: 8 };
  };

  const handlePressOut = () => {
    pressed.value = false;
    rotateX.value = withSpring(0);
    rotateY.value = withSpring(0);
    shadowOffset.value = { x: 0, y: 4 };
  };

  const handlePress = () => {
    if (isLocked) {
      haptics.hapticWarning(); // haptics.error is not defined in useHaptics
      onUnlock();
      return;
    }
    if (isPremium && progress === 0) {
      onPreview();
      return;
    }
    haptics.hapticSelection(); // haptics.medium
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => {
    const scale = withSpring(pressed.value ? 0.97 : 1, { damping: 15 });
    
    if (reducedMotion || tier !== 'high') {
      return { transform: [{ scale }] };
    }

    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${rotateX.value}deg` },
        { rotateY: `${rotateY.value}deg` },
        { scale },
      ],
      shadowOffset: {
        width: shadowOffset.value.x,
        height: shadowOffset.value.y,
      },
      shadowOpacity: interpolate(
        pressed.value ? 1 : 0,
        [0, 1],
        [0.25, 0.4],
        Extrapolation.CLAMP
      ),
      elevation: interpolate(
        pressed.value ? 1 : 0,
        [0, 1],
        [8, 16],
        Extrapolation.CLAMP
      ),
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value * 0.4,
    transform: [{ scale: withSpring(pressed.value ? 1.02 : 1) }],
  }));

  const accessibilityLabel = `${title}, ${subtitle}, ${progress}% complete, ${
    isLocked ? 'Premium content locked' : isPremium ? 'Premium content' : 'Free content'
  }, ${isAvailableOffline ? 'Available offline' : 'Online only'}`;

  return (
    <AnimatedPressable
      onLayout={handleLayout}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        styles.container, 
        animatedStyle,
        { backgroundColor: theme.surface, borderColor: theme.border }
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: false }}
    >
      {/* Premium glow layer */}
      {isPremium && !isLocked && (
        <Animated.View style={[styles.glow, glowStyle]} />
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.text.primary }]} numberOfLines={1}>{title}</Text>
            <Text style={[styles.subtitle, { color: theme.text.secondary }]} numberOfLines={1}>{subtitle}</Text>
          </View>
          
          <View style={styles.badges}>
            {isAvailableOffline && (
              <View style={styles.offlineBadge}>
                <Ionicons name="cloud-download" size={12} color={theme.semantic.success} />
              </View>
            )}
            {isPremium && (
              <View style={[styles.proBadge, { backgroundColor: 'rgba(255,215,0,0.1)', borderColor: 'rgba(255,215,0,0.2)' }]}>
                <Ionicons name="diamond" size={12} color={theme.premium.gold} />
                <Text style={[styles.proBadgeText, { color: theme.premium.gold }]}>PRO</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.metaSection}>
            <Text style={[styles.meta, { color: theme.text.muted }]}>{questionCount} questions</Text>
            {progress > 0 && (
              <Text style={[styles.progressLabel, { color: theme.text.secondary }]}>{Math.round(progress)}% mastered</Text>
            )}
          </View>

          <View style={styles.actions}>
            {!isAvailableOffline && onDownload && !isLocked && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  haptics.hapticSelection();
                  onDownload();
                }}
                style={[styles.downloadButton, { borderColor: theme.border }]}
                accessibilityLabel="Download for offline"
                accessibilityRole="button"
              >
                <Ionicons name="download-outline" size={16} color={theme.text.secondary} />
              </Pressable>
            )}
            
            <ProgressRing
              progress={progress}
              size={44}
              strokeWidth={4}
              color={isPremium ? theme.premium.gold : theme.semantic.success}
              delay={200}
            />
          </View>
        </View>
      </View>

      {/* Lock overlay */}
      {isLocked && (
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.lockContent}>
            <View style={styles.lockIconContainer}>
              <Ionicons name="lock-closed" size={24} color={theme.text.primary} />
            </View>
            <Text style={[styles.lockText, { color: theme.text.primary }]}>Tap to unlock</Text>
            <Text style={[styles.lockSubtext, { color: theme.premium.gold }]}>3 free preview questions</Text>
          </View>
        </BlurView>
      )}
    </AnimatedPressable>
  );
}, (prev, next) => (
  prev.id === next.id &&
  prev.progress === next.progress &&
  prev.isLocked === next.isLocked &&
  prev.isAvailableOffline === next.isAvailableOffline
));

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#8B5CF6',
    borderRadius: 24,
    opacity: 0.3,
  },
  content: {
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineBadge: {
    width: 28,
    height: 28,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  metaSection: {
    flex: 1,
  },
  meta: {
    fontSize: 12,
  },
  progressLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  lockContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lockText: {
    fontSize: 15,
    fontWeight: '700',
  },
  lockSubtext: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
  },
});
