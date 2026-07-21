import { useState, useEffect } from 'react';
import { analytics } from '../analytics/posthog';

export type PaywallVariant = 'control' | 'urgency' | 'social_first';

export interface VariantConfig {
  headline: string;
  subheadline: string;
  ctaText: string;
  secondaryCtaText: string;
  showGuarantee: boolean;
  showSavingsBadge: boolean;
  highlightFeature: 'ai_feedback' | 'faang_bank' | 'unlimited';
  gradient: readonly [string, string, string];
}

const VARIANTS: Record<PaywallVariant, VariantConfig> = {
  control: {
    headline: 'Unlock JobPrep Pro',
    subheadline: 'Get full access to premium interview decks and AI feedback',
    ctaText: 'Start Free Trial',
    secondaryCtaText: 'Maybe Later',
    showGuarantee: true,
    showSavingsBadge: true,
    highlightFeature: 'unlimited',
    gradient: ['#FFD700', '#FF6B6B', '#8B5CF6'] as const,
  },
  urgency: {
    headline: 'Your Competition Uses Pro',
    subheadline: '80% of offer recipients practiced with AI-powered feedback',
    ctaText: 'Get Pro Access',
    secondaryCtaText: 'I\'ll Risk It',
    showGuarantee: true,
    showSavingsBadge: false,
    highlightFeature: 'ai_feedback',
    gradient: ['#FF6B6B', '#FFD700', '#8B5CF6'] as const,
  },
  social_first: {
    headline: 'Join 10,000+ Engineers',
    subheadline: 'Who landed offers at Google, Meta, and Stripe',
    ctaText: 'Join Pro Today',
    secondaryCtaText: 'Continue Free',
    showGuarantee: false,
    showSavingsBadge: true,
    highlightFeature: 'faang_bank',
    gradient: ['#8B5CF6', '#FFD700', '#10B981'] as const,
  },
};

export function usePaywallVariant(): { variant: PaywallVariant; config: VariantConfig } {
  const [variant, setVariant] = useState<PaywallVariant>('control');

  useEffect(() => {
    // PostHog feature flag check
    // In production: const flag = await PostHog.getFeatureFlag('paywall_v1');
    // For now, randomize for testing or default to control
    const flags: PaywallVariant[] = ['control', 'urgency', 'social_first'];
    const assigned = flags[Math.floor(Math.random() * flags.length)];
    
    setVariant(assigned);
    analytics.capture('paywall_variant_assigned', { variant: assigned });
  }, []);

  return { variant, config: VARIANTS[variant] };
}
