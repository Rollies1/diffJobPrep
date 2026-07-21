/// <reference path="./generated.d.ts" />

// Re-export generated types for cleaner imports
export type * from './generated';

// Frontend-specific extensions not in OpenAPI
export interface FrontendUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  onboardingComplete: boolean;
}

export type Theme = 'light' | 'dark' | 'system';
