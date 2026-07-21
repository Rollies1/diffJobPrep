import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = 'https://app.posthog.com';

class AnalyticsService {
  private isReady = false;

  async init() {
    if (this.isReady) return;
    this.isReady = true;
    console.log('[Analytics] PostHog disabled for now to fix Metro resolution error.');
  }

  capture(event: string, properties?: Record<string, any>) {
    console.log(`[Analytics] Captured ${event}`, properties);
  }

  screen(name: string, properties?: Record<string, any>) {
    this.capture('$screen', { screen_name: name, ...properties });
  }

  private async queueEvent(event: string, properties?: Record<string, any>) {
    // Stub
  }

  async flushQueue() {
    // Stub
  }

  // Funnel helpers
  paywallViewed(deckId?: string) {
    this.capture('paywall_viewed', { deck_id: deckId, source: 'library_tap' });
  }

  paywallDismissed(reason: 'maybe_later' | 'close_button' | 'swipe') {
    this.capture('paywall_dismissed', { reason });
  }

  trialStarted(tier: 'monthly' | 'yearly') {
    this.capture('trial_started', { tier, revenue_cat_product_id: tier });
  }

  purchaseCompleted(tier: 'monthly' | 'yearly', price: number, currency: string) {
    this.capture('purchase_completed', { tier, price, currency });
    this.capture('revenue_event', { revenue: price, currency });
  }

  purchaseRestored() {
    this.capture('purchase_restored');
  }

  purchaseFailed(error: string) {
    this.capture('purchase_failed', { error });
  }

  previewStarted(deckId: string) {
    this.capture('preview_started', { deck_id: deckId });
  }

  previewConverted(deckId: string) {
    this.capture('preview_converted', { deck_id: deckId });
  }

  sessionStarted(deckId: string, isPremium: boolean) {
    this.capture('session_started', { deck_id: deckId, is_premium: isPremium });
  }

  sessionCompleted(deckId: string, questionsAnswered: number, durationSeconds: number) {
    this.capture('session_completed', {
      deck_id: deckId,
      questions_answered: questionsAnswered,
      duration_seconds: durationSeconds,
    });
  }

  tokenDepleted(context: 'header_indicator' | 'session_end') {
    this.capture('token_depleted', { context });
  }
}

export const analytics = new AnalyticsService();
