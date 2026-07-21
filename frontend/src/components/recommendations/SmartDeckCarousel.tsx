import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useHaptics } from '../../hooks/useHaptics';
import { recommendations, DeckScore } from '../../recommendations/engine';
import { useTheme } from '../../theme/ThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const SPACING_MD = 16;
const SPACING_LG = 24;

export const SmartDeckCarousel: React.FC = () => {
  const haptics = useHaptics();
  const theme = useTheme();
  const [recommendationsList, setRecommendationsList] = useState<DeckScore[]>([]);
  const scrollX = useSharedValue(0);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    const recs = await recommendations.getRecommendations(5);
    setRecommendationsList(recs);
  };

  const handleScroll = (event: any) => {
    scrollX.value = event.nativeEvent.contentOffset.x;
  };

  const getReasonIcon = (reason: DeckScore['reason']) => {
    switch (reason) {
      case 'weak_area': return 'alert-circle';
      case 'streak_saver': return 'flame';
      case 'next_level': return 'trending-up';
      default: return 'star';
    }
  };

  const getReasonLabel = (reason: DeckScore['reason']) => {
    switch (reason) {
      case 'weak_area': return 'Focus Area';
      case 'streak_saver': return 'Keep Streak Alive';
      case 'next_level': return 'Ready to Advance';
      default: return 'Trending';
    }
  };

  const getReasonColor = (reason: DeckScore['reason']) => {
    switch (reason) {
      case 'weak_area': return theme.semantic.error || '#FF3B30';
      case 'streak_saver': return '#FF6B6B';
      case 'next_level': return theme.semantic.success || '#34C759';
      default: return theme.premium.gold;
    }
  };

  if (recommendationsList.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Recommended for You</Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>Based on your progress</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + SPACING_MD}
        contentInset={{ left: SPACING_LG, right: SPACING_LG }}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {recommendationsList.map((rec, index) => (
          <RecommendationCard
            key={rec.deckId}
            rec={rec}
            index={index}
            scrollX={scrollX}
            onPress={() => haptics.medium()}
            colors={colors}
            getReasonColor={getReasonColor}
            getReasonIcon={getReasonIcon}
            getReasonLabel={getReasonLabel}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const RecommendationCard: React.FC<{
  rec: DeckScore;
  index: number;
  scrollX: Animated.SharedValue<number>;
  onPress: () => void;
  colors: any;
  getReasonColor: (r: any) => string;
  getReasonIcon: (r: any) => string;
  getReasonLabel: (r: any) => string;
}> = ({ rec, index, scrollX, onPress, colors, getReasonColor, getReasonIcon, getReasonLabel }) => {
  const color = getReasonColor(rec.reason);

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + SPACING_MD),
      index * (CARD_WIDTH + SPACING_MD),
      (index + 1) * (CARD_WIDTH + SPACING_MD),
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.6, 1, 0.6],
      Extrapolation.CLAMP
    );

    return { transform: [{ scale }], opacity };
  });

  return (
    <Animated.View style={[styles.card, animatedStyle, { width: CARD_WIDTH, backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Pressable onPress={onPress} style={styles.cardPressable}>
        <View style={[styles.reasonBadge, { backgroundColor: `${color}15`, borderColor: `${color}25` }]}>
          <Ionicons name={getReasonIcon(rec.reason) as any} size={14} color={color} />
          <Text style={[styles.reasonText, { color }]}>{getReasonLabel(rec.reason)}</Text>
        </View>

        <Text style={[styles.cardTitle, { color: theme.text.primary }]} numberOfLines={2}>{rec.title}</Text>
        
        <View style={[styles.scoreBar, { backgroundColor: theme.border || 'rgba(255,255,255,0.1)' }]}>
          <View style={[styles.scoreFill, { width: `${Math.min(rec.score, 100)}%`, backgroundColor: color }]} />
        </View>

        <View style={styles.cardFooter}>
          <Text style={[styles.matchText, { color: theme.text.secondary }]}>{Math.min(rec.score, 100)}% match</Text>
          <Ionicons name="arrow-forward" size={18} color={theme.text.secondary} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING_LG,
  },
  header: {
    paddingHorizontal: SPACING_LG,
    marginBottom: SPACING_MD,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: SPACING_LG,
    gap: SPACING_MD,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginRight: SPACING_MD,
  },
  cardPressable: {
    padding: SPACING_LG,
    height: 180,
    justifyContent: 'space-between',
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  scoreBar: {
    height: 4,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 9999,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
