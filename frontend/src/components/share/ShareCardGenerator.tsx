import React, { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text, ActivityIndicator } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  Text as SkiaText,
  useFont,
  Image as SkiaImage,
  useImage,
  Group,
  Paint,
  BlurMask,
} from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useDeviceTier } from '../../hooks/useDeviceTier';
import { useTheme } from '../../theme/ThemeProvider';

export interface ShareCardData {
  userName: string;
  deckTitle: string;
  streak: number;
  questionsAnswered: number;
  accuracy: number;
  date: string;
}

export const ShareCardGenerator: React.FC<{ data: ShareCardData }> = ({ data }) => {
  const tier = useDeviceTier();
  const theme = useTheme();
  const canvasRef = useRef<any>(null);
  const [generating, setGenerating] = useState(false);
  
  // Safe font loading — might fail if assets aren't in these paths, so fallback is crucial.
  // Note: user must place Inter-Bold.ttf in assets/fonts/
  let interBold = null;
  let interRegular = null;
  try {
    interBold = useFont(require('../../../assets/fonts/Inter-Bold.ttf'), 48);
    interRegular = useFont(require('../../../assets/fonts/Inter-Regular.ttf'), 24);
  } catch (e) {
    // Fonts not available in local tree yet
  }
  
  let logo = null;
  try {
    logo = useImage(require('../../../assets/icon.png'));
  } catch(e) {
    // Missing icon
  }

  // If device can't handle Skia or fonts not loaded, show fallback
  if (tier !== 'high' || !interBold || !interRegular) {
    return <FallbackShareCard data={data} theme={theme} />;
  }

  const CARD_WIDTH = 1080;
  const CARD_HEIGHT = 1350;

  const generateAndShare = async () => {
    setGenerating(true);
    try {
      const snapshot = await canvasRef.current?.makeImageSnapshotAsync();
      if (!snapshot) return;
      
      const base64 = snapshot.encodeToBase64();
      const path = `${FileSystem.cacheDirectory}share-card-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(path, base64, { encoding: 'base64' });
      
      await Sharing.shareAsync(path, {
        mimeType: 'image/png',
        dialogTitle: 'Share your progress!',
      });
    } catch (error) {
      console.error('Share generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  const bgBase = theme.isDark ? '#0F0F1A' : '#ffffff';
  const bgMid = theme.isDark ? '#1a1a3e' : '#f8fafc';
  const bgTop = theme.isDark ? '#252540' : '#f1f5f9';

  return (
    <View style={styles.container}>
      <Canvas style={{ width: 300, height: 375 }} ref={canvasRef}>
        <Group>
          {/* Background */}
          <Path
            path={Skia.Path.MakeFromSVGString(
              `M0 0 H${CARD_WIDTH} V${CARD_HEIGHT} H0 Z`
            )!}
            color={bgBase}
          />
          
          {/* Gradient mesh approximation using paths */}
          <Path
            path={Skia.Path.MakeFromSVGString(
              `M0 0 Q${CARD_WIDTH/2} ${CARD_HEIGHT/3} ${CARD_WIDTH} 0 V${CARD_HEIGHT} H0 Z`
            )!}
            color={bgMid}
          />
          
          <Path
            path={Skia.Path.MakeFromSVGString(
              `M0 ${CARD_HEIGHT} Q${CARD_WIDTH/2} ${CARD_HEIGHT*0.7} ${CARD_WIDTH} ${CARD_HEIGHT} V${CARD_HEIGHT} H0 Z`
            )!}
            color={bgTop}
          />

          {/* Glow effect */}
          <Paint>
            <BlurMask blur={60} style="normal" />
          </Paint>
          <Path
            path={Skia.Path.MakeFromSVGString(
              `M${CARD_WIDTH*0.7} ${CARD_HEIGHT*0.3} 
               C${CARD_WIDTH*0.9} ${CARD_HEIGHT*0.2} ${CARD_WIDTH} ${CARD_HEIGHT*0.4} ${CARD_WIDTH*0.8} ${CARD_HEIGHT*0.5}
               C${CARD_WIDTH*0.6} ${CARD_HEIGHT*0.6} ${CARD_WIDTH*0.5} ${CARD_HEIGHT*0.4} ${CARD_WIDTH*0.7} ${CARD_HEIGHT*0.3} Z`
            )!}
            color={theme.isDark ? "rgba(139,92,246,0.3)" : "rgba(139,92,246,0.15)"}
          />

          {/* Logo */}
          {logo && (
            <SkiaImage
              image={logo}
              x={CARD_WIDTH / 2 - 40}
              y={80}
              width={80}
              height={80}
              fit="contain"
            />
          )}

          {/* Title */}
          <SkiaText
            text="JobPrep"
            x={CARD_WIDTH / 2 - 100}
            y={220}
            font={interBold}
            color={Skia.Color(theme.premium.gold)}
          />

          {/* User name */}
          <SkiaText
            text={data.userName}
            x={CARD_WIDTH / 2 - 150}
            y={340}
            font={interBold}
            color={Skia.Color(theme.isDark ? '#FFFFFF' : '#000000')}
          />

          {/* Deck title */}
          <SkiaText
            text={`Completed: ${data.deckTitle}`}
            x={CARD_WIDTH / 2 - 200}
            y={420}
            font={interRegular}
            color={Skia.Color(theme.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)')}
          />

          {/* Stats */}
          <StatBlock
            label="STREAK"
            value={`${data.streak} days`}
            x={CARD_WIDTH * 0.2}
            y={550}
            font={interBold}
            subFont={interRegular}
            isDark={theme.isDark}
          />
          
          <StatBlock
            label="QUESTIONS"
            value={`${data.questionsAnswered}`}
            x={CARD_WIDTH * 0.5}
            y={550}
            font={interBold}
            subFont={interRegular}
            isDark={theme.isDark}
          />
          
          <StatBlock
            label="ACCURACY"
            value={`${data.accuracy}%`}
            x={CARD_WIDTH * 0.8}
            y={550}
            font={interBold}
            subFont={interRegular}
            isDark={theme.isDark}
          />

          {/* Date */}
          <SkiaText
            text={data.date}
            x={CARD_WIDTH / 2 - 100}
            y={CARD_HEIGHT - 100}
            font={interRegular}
            color={Skia.Color(theme.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)')}
          />
        </Group>
      </Canvas>

      <Pressable
        onPress={generateAndShare}
        disabled={generating}
        style={[styles.shareButton, generating && styles.disabled, { backgroundColor: theme.premium.purple }]}
      >
        {generating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.shareText}>Share Progress</Text>
        )}
      </Pressable>
    </View>
  );
};

const StatBlock: React.FC<{
  label: string;
  value: string;
  x: number;
  y: number;
  font: any;
  subFont: any;
  isDark: boolean;
}> = ({ label, value, x, y, font, subFont, isDark }) => (
  <Group>
    <SkiaText text={value} x={x} y={y} font={font} color={Skia.Color(isDark ? '#FFFFFF' : '#000000')} />
    <SkiaText text={label} x={x} y={y + 40} font={subFont} color={Skia.Color(isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)')} />
  </Group>
);

const FallbackShareCard: React.FC<{ data: ShareCardData, theme: any }> = ({ data, theme }) => (
  <View style={[styles.fallbackContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
    <Text style={[styles.fallbackTitle, { color: theme.premium.gold }]}>JobPrep</Text>
    <Text style={[styles.fallbackName, { color: theme.text.primary }]}>{data.userName}</Text>
    <Text style={[styles.fallbackDeck, { color: theme.text.secondary }]}>{data.deckTitle}</Text>
    <View style={styles.fallbackStats}>
      <Text style={[styles.fallbackStat, { color: theme.text.primary }]}>🔥 {data.streak} days</Text>
      <Text style={[styles.fallbackStat, { color: theme.text.primary }]}>✓ {data.questionsAnswered} questions</Text>
      <Text style={[styles.fallbackStat, { color: theme.text.primary }]}>🎯 {data.accuracy}%</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  shareButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  shareText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  fallbackContainer: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  fallbackName: {
    fontSize: 18,
    fontWeight: '700',
  },
  fallbackDeck: {
    fontSize: 14,
    marginBottom: 16,
  },
  fallbackStats: {
    flexDirection: 'row',
    gap: 16,
  },
  fallbackStat: {
    fontSize: 14,
  },
});
