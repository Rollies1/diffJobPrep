import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';

interface PremiumDeckCardProps {
  title: string;
  teaser: string;
  lockedQuestions: number;
  freePreviewQuestions: number;
  onPreview: () => void;
  onUnlock: () => void;
  isPremiumUser: boolean;
}

export const PremiumDeckCard = React.memo(({
  title,
  teaser,
  lockedQuestions,
  freePreviewQuestions,
  onPreview,
  onUnlock,
  isPremiumUser
}: PremiumDeckCardProps) => {
  const theme = useTheme();
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.98 : 1, { damping: 20, stiffness: 300 }) }],
  }));

  // If the user already paid, render differently or normally (for Phase 1 we assume this card is only shown when locked)
  if (isPremiumUser) return null;

  return (
    <Animated.View style={[{ marginBottom: 16 }, animatedStyle]}>
      <Pressable
        onPressIn={() => (pressed.value = true)}
        onPressOut={() => (pressed.value = false)}
        onPress={onUnlock}
        accessibilityRole="button"
        accessibilityLabel={`Premium deck: ${title}. ${lockedQuestions} questions.`}
      >
        <LinearGradient
          colors={
            theme.isDark
              ? ['rgba(139, 92, 246, 0.15)', 'rgba(255, 215, 0, 0.05)']
              : ['rgba(139, 92, 246, 0.1)', 'rgba(255, 215, 0, 0.02)']
          }
          className="rounded-2xl overflow-hidden border border-purple-500/20"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View className="p-5">
            {/* Header */}
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1 mr-4">
                <Text
                  className="text-lg font-bold mb-1"
                  style={{ color: theme.text.primary, fontFamily: 'Inter_700Bold' }}
                >
                  {title}
                </Text>
                <Text
                  className="text-sm"
                  style={{ color: theme.premium.purple, fontFamily: 'Inter_600SemiBold' }}
                >
                  <Ionicons name="lock-closed" size={12} color={theme.premium.purple} /> Pro Exclusive ({lockedQuestions} Qs)
                </Text>
              </View>
              <View className="w-12 h-12 rounded-full bg-purple-500/10 items-center justify-center">
                <Ionicons name="star" size={20} color={theme.premium.gold} />
              </View>
            </View>

            {/* Teaser */}
            <View className="bg-black/5 dark:bg-white/5 p-3 rounded-lg mb-4 border border-black/5 dark:border-white/5">
              <Text style={{ color: theme.text.secondary, fontFamily: 'Inter_500Medium' }}>
                {teaser}
              </Text>
            </View>

            {/* Actions */}
            <View className="flex-row space-x-3 mt-2 gap-3">
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
                className="flex-1 py-3 rounded-xl items-center justify-center bg-black/5 dark:bg-white/10"
              >
                <Text
                  className="text-sm font-bold"
                  style={{ color: theme.text.primary, fontFamily: 'Inter_600SemiBold' }}
                >
                  Free Preview ({freePreviewQuestions})
                </Text>
              </Pressable>

              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onUnlock();
                }}
                className="flex-1 py-3 rounded-xl items-center justify-center"
                style={{ backgroundColor: theme.premium.purple }}
              >
                <Text
                  className="text-sm font-bold text-white"
                  style={{ fontFamily: 'Inter_600SemiBold' }}
                >
                  Unlock All
                </Text>
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
});
